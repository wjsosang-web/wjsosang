"use server";

import { revalidatePath } from "next/cache";
import { refreshPublicPages } from "@/lib/admin/revalidate";
import { redirect } from "next/navigation";
import { requireAdmin, requirePermission } from "@/lib/supabase/auth";
import { getAdminSupabase } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/supabase/config";
import { importFromPlaceUrl } from "@/lib/place/import";
import { INQUIRY_KINDS } from "@/lib/notify";
import {
  broadcastTelegram,
  fetchTelegramContacts,
  hasTelegram,
} from "@/lib/telegram";
import { getHeroSlides } from "@/lib/repo";
import { ORG_GROUPS, REMOVE_IMAGE } from "@/lib/types";
import type { HeroSlide, OrgGroup, PlaceImportResult } from "@/lib/types";

/**
 * 관리자 저장 작업.
 *
 * 모든 함수는 requireAdmin() 을 먼저 통과해야 한다.
 * 그 뒤 service role 로 저장하므로 RLS 를 우회한다.
 * 즉, 권한 검사는 전적으로 requireAdmin() 에 달려 있다. 빠뜨리지 말 것.
 */

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** 공개 사이트 캐시를 비운다. 저장하면 바로 반영되도록. */

const str = (form: FormData, key: string): string => String(form.get(key) ?? "").trim();
const nullable = (form: FormData, key: string): string | null => str(form, key) || null;
const bool = (form: FormData, key: string): boolean => form.get(key) === "on";
const num = (form: FormData, key: string): number | null => {
  const v = str(form, key);
  return v === "" || Number.isNaN(Number(v)) ? null : Number(v);
};

/** 제목에서 URL 슬러그를 만든다. 한글은 그대로 두면 주소가 지저분해지므로 날짜를 붙인다. */
function makeSlug(title: string, fallbackDate: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const hasLatin = /[a-z0-9]/.test(ascii);
  return hasLatin ? `${ascii}-${fallbackDate}`.slice(0, 80) : `post-${fallbackDate}-${Date.now().toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* 사진 업로드                                                          */
/* ------------------------------------------------------------------ */

/** 파일 하나를 스토리지에 올리고 공개 주소를 돌려준다. */
/**
 * 새로 올라온 사진의 주소를 고른다.
 *
 * 사진은 브라우저에서 저장소로 바로 올라오므로 폼에는 보통 주소만 담겨 온다.
 * 옛 화면이나 자바스크립트가 막힌 환경에서 파일이 그대로 오는 경우도 있어
 * 둘 다 받아준다. 새로 올린 것이 없으면 원래 쓰던 주소를 유지한다.
 */
async function pickedImage(
  form: FormData,
  field: string,
  keepField: string,
  folder: string,
): Promise<string | null> {
  const picked = form.get(field);

  if (picked instanceof File && picked.size > 0) return uploadOne(picked, folder);

  if (typeof picked === "string") {
    const value = picked.trim();
    // 지우기를 누른 경우. 빈 값(= 그대로 두기)과 구분해야 한다.
    if (value === REMOVE_IMAGE) return null;
    if (value !== "") return value;
  }

  return nullable(form, keepField);
}

/** 여러 장을 받을 때 — 주소와 파일이 섞여 와도 순서를 지켜 돌려준다 */
async function pickedImages(form: FormData, field: string, folder: string): Promise<string[]> {
  const out: string[] = [];

  for (const entry of form.getAll(field)) {
    if (entry instanceof File) {
      if (entry.size === 0) continue;
      const url = await uploadOne(entry, folder);
      if (url) out.push(url);
    } else if (typeof entry === "string" && entry.trim() !== "") {
      out.push(entry.trim());
    }
  }

  return out;
}

async function uploadOne(file: File, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const db = getAdminSupabase();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (error) throw new Error(`사진 업로드 실패: ${error.message}`);

  return db.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/* ------------------------------------------------------------------ */
/* 게시물 — 공지사항 / 활동소식 / 행사                                   */
/* ------------------------------------------------------------------ */

export async function savePost(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getAdminSupabase();

    const id = nullable(form, "id");
    const type = str(form, "type") as "notice" | "activity" | "event";
    const title = str(form, "title");
    const date = str(form, "date");

    if (!title) return { ok: false, message: "제목을 입력해 주세요." };
    if (!date) return { ok: false, message: "날짜를 선택해 주세요." };

    const coverUrl = await pickedImage(form, "coverFile", "coverImage", "posts");

    const payload = {
      type,
      title,
      slug: nullable(form, "slug") ?? makeSlug(title, date),
      category: type === "notice" ? nullable(form, "category") : nullable(form, "activityCategory"),
      date,
      date_tbd: type === "event" && bool(form, "dateTbd"),
      start_date: type === "event" ? date : null,
      end_date: type === "event" ? nullable(form, "endDate") : null,
      time: nullable(form, "time"),
      place: nullable(form, "place"),
      participants: num(form, "participants"),
      summary: str(form, "summary"),
      body: str(form, "body"),
      cover_image: coverUrl,
      pinned: bool(form, "pinned"),
      important: bool(form, "important"),
      status: str(form, "status") || "draft",
    };

    let postId = id;

    if (id) {
      const { error } = await db.from("posts").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await db.from("posts").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      postId = data.id as string;
    }

    // 활동사진 — 파일과 설명을 짝지어 저장한다 (기획안 29조)
    const urls = await pickedImages(form, "photoFiles", "posts");
    const captions = form.getAll("photoCaptions").map((c) => String(c ?? ""));

    if (urls.length > 0 && postId) {
      const { count } = await db
        .from("post_photos")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      const rows = [];
      for (let i = 0; i < urls.length; i += 1) {
        const url = urls[i];
        rows.push({
          post_id: postId,
          url,
          caption: captions[i] ?? "",
          sort_order: (count ?? 0) + i + 1,
        });
      }
      if (rows.length > 0) {
        const { error } = await db.from("post_photos").insert(rows);
        if (error) throw new Error(error.message);
      }
    }

    refreshPublicPages();
    revalidatePath("/admin/posts");

    return { ok: true, message: id ? "수정했습니다." : "등록했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function deletePost(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("id") ?? "");
  if (id) await db.from("posts").delete().eq("id", id);
  refreshPublicPages();
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePostPhoto(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("photoId") ?? "");
  if (id) await db.from("post_photos").delete().eq("id", id);
  refreshPublicPages();
}

export async function deleteBusinessPhoto(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("photoId") ?? "");
  if (id) await db.from("business_photos").delete().eq("id", id);
  refreshPublicPages();
}

/* ------------------------------------------------------------------ */
/* 회원업장                                                             */
/* ------------------------------------------------------------------ */

/** [업장정보 불러오기] 버튼. 저장하지 않고 초안만 돌려준다. */
export async function fetchPlaceDraft(url: string): Promise<PlaceImportResult> {
  await requireAdmin();
  return importFromPlaceUrl(url);
}

export async function saveBusiness(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getAdminSupabase();

    const id = nullable(form, "id");
    const name = str(form, "name");
    if (!name) return { ok: false, message: "업장명을 입력해 주세요." };

    const coverUrl = await pickedImage(form, "coverFile", "coverImage", "businesses");
    const logoUrl = await pickedImage(form, "logoFile", "logoImage", "businesses");

    const keywords = str(form, "keywords")
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      name,
      slug: nullable(form, "slug") ?? `biz-${Date.now().toString(36)}`,
      category: str(form, "category") || "기타",
      tagline: str(form, "tagline"),
      description: str(form, "description"),
      owner_name: str(form, "ownerName"),
      address: str(form, "address"),
      district: str(form, "district"),
      lat: num(form, "lat"),
      lng: num(form, "lng"),
      phone: nullable(form, "phone"),
      hours: nullable(form, "hours"),
      place_url: nullable(form, "placeUrl"),
      homepage_url: nullable(form, "homepageUrl"),
      instagram_url: nullable(form, "instagramUrl"),
      blog_url: nullable(form, "blogUrl"),
      sns_url: nullable(form, "snsUrl"),
      benefit: nullable(form, "benefit"),
      phone_public: bool(form, "phonePublic"),
      // 새로 등록하면서 가입일을 비워두면 오늘로 잡는다.
      // 그래야 신입회원 배지가 자동으로 붙는다.
      member_since: nullable(form, "memberSince") ?? (id ? null : new Date().toISOString().slice(0, 10)),
      hide_new_badge: bool(form, "hideNewBadge"),
      cover_image: coverUrl,
      logo_image: logoUrl,
      place_id: nullable(form, "placeId"),
      place_type: nullable(form, "placeType"),
      // "플레이스 사진 사용 안 함"을 켜면 비운다. 직접 올린 사진만 쓰게 된다.
      place_photo: bool(form, "dropPlacePhoto") ? null : nullable(form, "placePhoto"),
      place_keywords: str(form, "placeKeywords")
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter(Boolean),
      keywords,
      priority: num(form, "priority"),
      featured: bool(form, "featured"),
      status: str(form, "status") || "draft",
      sourced_from_place: Boolean(nullable(form, "placeId")),
    };

    let businessId = id;

    if (id) {
      const { error } = await db.from("businesses").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await db.from("businesses").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      businessId = data.id as string;
    }

    // 플레이스에서 가져온 메뉴 — 새로 불러왔을 때만 통째로 교체한다
    const menusJson = str(form, "menusJson");
    if (menusJson && businessId) {
      try {
        const menus = JSON.parse(menusJson) as Array<{ name: string; price: string | null }>;
        await db.from("business_menus").delete().eq("business_id", businessId).eq("source", "place");
        if (menus.length > 0) {
          await db.from("business_menus").insert(
            menus.map((m, i) => ({
              business_id: businessId,
              name: m.name,
              price: m.price,
              source: "place",
              sort_order: i + 1,
            })),
          );
        }
      } catch {
        // 메뉴 형식이 깨져도 업장 저장 자체는 살린다
      }
    }

    // 업장 사진
    const urls = await pickedImages(form, "photoFiles", "businesses");
    const captions = form.getAll("photoCaptions").map((c) => String(c ?? ""));

    if (urls.length > 0 && businessId) {
      const { count } = await db
        .from("business_photos")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);

      const rows = [];
      for (let i = 0; i < urls.length; i += 1) {
        const url = urls[i];
        rows.push({
          business_id: businessId,
          url,
          caption: captions[i] ?? "",
          sort_order: (count ?? 0) + i + 1,
        });
      }
      if (rows.length > 0) await db.from("business_photos").insert(rows);
    }

    refreshPublicPages();
    revalidatePath("/admin/businesses");

    return { ok: true, message: id ? "수정했습니다." : "등록했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteBusiness(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("id") ?? "");
  if (id) await db.from("businesses").delete().eq("id", id);
  refreshPublicPages();
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

/* ------------------------------------------------------------------ */
/* 문의                                                                */
/* ------------------------------------------------------------------ */

export async function markInquiryHandled(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("id") ?? "");
  const handled = form.get("handled") === "true";
  if (id) await db.from("inquiries").update({ handled }).eq("id", id);
  revalidatePath("/admin/inquiries");
}

export async function deleteInquiry(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("id") ?? "");
  if (id) await db.from("inquiries").delete().eq("id", id);
  revalidatePath("/admin/inquiries");
}

/* ------------------------------------------------------------------ */
/* 조직도 · 임원                                                        */
/* ------------------------------------------------------------------ */

/** 협회소개에서 분류 탭이 나오는 순서를 저장한다 (site_settings.orgGroupOrder) */
/* ------------------------------------------------------------------ */
/* 텔레그램 — 회원·임원 알림                                             */
/* ------------------------------------------------------------------ */

/**
 * 봇에게 말을 건 사람을 회원과 연결한다.
 *
 * 회원이 봇에서 /start 를 누르면 그 기록이 텔레그램에 남는다.
 * 그 목록을 받아와 이름으로 우리 회원과 맞춘다.
 * 이름이 같은 사람이 둘 이상이면 자동으로 잇지 않고 넘어간다.
 */
export async function linkTelegramContacts(): Promise<ActionResult> {
  try {
    await requirePermission("members.approve");

    const contacts = await fetchTelegramContacts();
    if (contacts.length === 0) {
      return {
        ok: false,
        message:
          "봇에게 말을 건 사람이 아직 없습니다. 회원분들께 봇에서 /start 를 눌러달라고 안내해 주세요.",
      };
    }

    const db = getAdminSupabase();
    const { data: members } = await db.from("members").select("id, name, telegram_chat_id");

    let linked = 0;
    const unmatched: string[] = [];

    for (const c of contacts) {
      // 이미 연결된 사람은 건너뛴다
      if ((members ?? []).some((m) => m.telegram_chat_id === c.chatId)) continue;

      // 이름은 "/start 홍길동" 처럼 보내거나, 텔레그램 이름을 그대로 쓴다
      const typed = c.text.replace(/^\/start\s*/, "").trim();
      const candidate = typed || c.firstName;

      const matches = (members ?? []).filter((m) => String(m.name).trim() === candidate);

      if (matches.length !== 1) {
        unmatched.push(candidate || c.chatId);
        continue;
      }

      await db
        .from("members")
        .update({
          telegram_chat_id: c.chatId,
          telegram_username: c.username,
          telegram_linked_at: new Date().toISOString(),
        })
        .eq("id", matches[0].id);

      linked += 1;
    }

    revalidatePath("/admin/members");

    const tail =
      unmatched.length > 0
        ? ` 이름을 못 맞춘 ${unmatched.length}명은 직접 연결해 주세요 (${unmatched.slice(0, 3).join(", ")}).`
        : "";

    return { ok: true, message: `${linked}명을 연결했습니다.${tail}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 문의 종류마다 알림 받을 직책을 정한다 */
export async function saveNotifyRoutes(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("members.role");

    const routes: Record<string, string[]> = {};

    for (const kind of INQUIRY_KINDS) {
      routes[kind] = str(form, `kind:${kind}`)
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const empty = Object.entries(routes).filter(([, titles]) => titles.length === 0);
    if (empty.length > 0) {
      return {
        ok: false,
        message: `${empty.map(([k]) => k).join(", ")} 에 받을 사람이 없습니다. 한 명 이상 적어 주세요.`,
      };
    }

    await putSetting("inquiry_notify", routes);
    return { ok: true, message: "저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 텔레그램을 등록한 모든 회원에게 알림을 보낸다 */
export async function broadcastNotice(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("posts.manage");

    const text = str(form, "message");
    if (!text) return { ok: false, message: "보낼 내용을 적어 주세요." };
    if (!hasTelegram()) {
      return { ok: false, message: "텔레그램 봇 토큰이 등록되지 않았습니다." };
    }

    const db = getAdminSupabase();
    const { data } = await db
      .from("members")
      .select("telegram_chat_id")
      .not("telegram_chat_id", "is", null);

    const ids = (data ?? []).map((m) => m.telegram_chat_id as string);
    if (ids.length === 0) {
      return { ok: false, message: "텔레그램을 등록한 회원이 아직 없습니다." };
    }

    const { sent, failed } = await broadcastTelegram(ids, text);

    return {
      ok: sent > 0,
      message:
        failed > 0
          ? `${sent}명에게 보냈습니다. ${failed}명은 실패했습니다(봇을 차단했을 수 있습니다).`
          : `${sent}명에게 보냈습니다.`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/* ------------------------------------------------------------------ */
/* 회원 가입 승인 — 인사국이 쓴다                                        */
/* ------------------------------------------------------------------ */

/** 가입 신청을 승인한다 */
export async function approveMember(form: FormData) {
  const admin = await requirePermission("members.approve");
  const db = getAdminSupabase();

  const id = String(form.get("id") ?? "");
  if (!id) return;

  await db
    .from("members")
    .update({
      status: "active",
      approved_at: new Date().toISOString(),
      approved_by: admin.memberId,
      reject_reason: null,
      joined_at: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);

  revalidatePath("/admin/members");
}

/** 가입 신청을 되돌린다. 이유를 적어두면 본인 화면에 보인다. */
export async function rejectMember(form: FormData) {
  await requirePermission("members.approve");
  const db = getAdminSupabase();

  const id = String(form.get("id") ?? "");
  if (!id) return;

  await db
    .from("members")
    .update({
      status: "pending",
      approved_at: null,
      reject_reason: String(form.get("reason") ?? "").trim() || "가입 조건을 다시 확인해 주세요.",
    })
    .eq("id", id);

  revalidatePath("/admin/members");
}

/**
 * 권한 등급을 바꾼다.
 *
 * 운영자만 할 수 있다. 임원진이 스스로를 운영자로 올리는 길을 막아야 하고,
 * 마지막 남은 운영자가 스스로를 내려버리면 아무도 못 들어가므로 그것도 막는다.
 */
export async function changeMemberRole(form: FormData): Promise<void> {
  const admin = await requirePermission("members.role");
  const db = getAdminSupabase();

  const id = String(form.get("id") ?? "");
  const role = String(form.get("role") ?? "");
  if (!id || !["superadmin", "admin", "officer", "member"].includes(role)) return;

  if (id === admin.memberId && role !== "admin" && role !== "superadmin") {
    const { count } = await db
      .from("members")
      .select("id", { count: "exact", head: true })
      .in("role", ["admin", "superadmin"]);

    // 운영자가 나 하나뿐이면 스스로 내려올 수 없다
    if ((count ?? 0) <= 1) return;
  }

  await db.from("members").update({ role }).eq("id", id);
  revalidatePath("/admin/members");
}

/** 승인 권한을 갖는 직책 목록을 바꾼다 */
export async function saveApproverTitles(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("members.role");

    const titles = str(form, "titles")
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (titles.length === 0) {
      return { ok: false, message: "직책을 하나 이상 남겨 주세요. 비우면 아무도 승인할 수 없습니다." };
    }

    await putSetting("approver_titles", titles);
    revalidatePath("/admin/members");

    return { ok: true, message: `${titles.length}개 직책에 권한을 주었습니다.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/* ------------------------------------------------------------------ */
/* 회원 전용 자료 — 협회 정관                                            */
/* ------------------------------------------------------------------ */

const MEMBER_BUCKET = "member-files";

/** 관리자가 회원 전용 자료를 올린다 */
export async function saveMemberDoc(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("site.manage");
    const db = getAdminSupabase();

    const title = str(form, "title");
    const code = str(form, "code");
    const file = form.get("file");

    if (!title) return { ok: false, message: "자료 이름을 입력해 주세요." };
    if (!code) return { ok: false, message: "협회원 코드를 정해 주세요." };

    const current = (await getMemberDoc()) ?? { path: null, fileName: null };
    let path = current.path;
    let fileName = current.fileName;

    if (file instanceof File && file.size > 0) {
      if (file.size > 20 * 1024 * 1024) {
        return { ok: false, message: "파일이 너무 큽니다. 20MB 아래로 줄여 주세요." };
      }

      const ext = (file.name.split(".").pop() ?? "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
      const next = `docs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "pdf"}`;

      const { error } = await db.storage
        .from(MEMBER_BUCKET)
        .upload(next, file, { contentType: file.type || undefined, upsert: false });

      if (error) throw new Error(`파일을 올리지 못했습니다: ${error.message}`);

      // 새 파일이 올라갔으면 옛 파일은 지운다
      if (path) await db.storage.from(MEMBER_BUCKET).remove([path]);

      path = next;
      fileName = file.name;
    }

    if (!path) return { ok: false, message: "파일을 골라 주세요." };

    await putSetting("member_doc", {
      title,
      description: str(form, "description"),
      code,
      path,
      fileName,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true, message: "저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export interface MemberDoc {
  title: string;
  description: string;
  code: string;
  path: string | null;
  fileName: string | null;
  updatedAt: string;
}

async function getMemberDoc(): Promise<MemberDoc | null> {
  const db = getAdminSupabase();
  const { data } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "member_doc")
    .maybeSingle();

  return (data?.value as MemberDoc | undefined) ?? null;
}

/**
 * 코드를 맞히면 잠깐 열리는 내려받기 주소를 만들어 준다.
 *
 * 코드가 틀려도 맞아도 응답 모양이 같아야 파일이 있는지 없는지 새어 나가지 않는다.
 * 주소는 5분 뒤에 만료되므로 다른 곳에 퍼뜨려도 오래 쓰이지 않는다.
 */
export async function requestMemberDoc(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult & { url?: string }> {
  const doc = await getMemberDoc();
  const entered = str(form, "code");

  if (!doc?.path || !doc.code || entered !== doc.code) {
    return { ok: false, message: "코드가 맞지 않습니다. 협회 사무국에 문의해 주세요." };
  }

  const db = getAdminSupabase();
  const { data, error } = await db.storage
    .from(MEMBER_BUCKET)
    .createSignedUrl(doc.path, 300, { download: doc.fileName ?? true });

  if (error || !data) {
    return { ok: false, message: "파일을 여는 데 실패했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  return { ok: true, message: "내려받기를 시작합니다.", url: data.signedUrl };
}

/* ------------------------------------------------------------------ */
/* 협회 정보 · 소개 글                                                   */
/* ------------------------------------------------------------------ */

async function putSetting(key: string, value: unknown): Promise<void> {
  const db = getAdminSupabase();
  const { error } = await db
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  refreshPublicPages();
  revalidatePath("/admin/site");
}

/** 협회 기본 정보 — 연락처, 주소, 슬로건 */
export async function saveSiteInfo(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("site.manage");

    const name = str(form, "name");
    if (!name) return { ok: false, message: "협회 이름을 입력해 주세요." };

    await putSetting("info", {
      name,
      shortName: str(form, "shortName"),
      foundedYear: num(form, "foundedYear") ?? new Date().getFullYear(),
      phone: str(form, "phone"),
      phoneOwner: str(form, "phoneOwner"),
      email: str(form, "email"),
      address: str(form, "address"),
      addressDetail: str(form, "addressDetail"),
      officeHours: str(form, "officeHours"),
      transport: str(form, "transport"),
      parking: str(form, "parking"),
      mapUrl: str(form, "mapUrl"),
      instagramUrl: str(form, "instagramUrl"),
      youtubeUrl: str(form, "youtubeUrl"),
      contactImage: await pickedImage(form, "contactImageFile", "contactImage", "site"),
      tagline: str(form, "tagline"),
      slogan: str(form, "slogan"),
    });

    return { ok: true, message: "저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 검색 노출 설정 — 네이버·구글에 뜨는 제목·설명·사진·키워드 */
export async function saveSeo(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("site.manage");

    await putSetting("seo", {
      title: str(form, "title"),
      description: str(form, "description"),
      keywords: str(form, "keywords")
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter(Boolean),
      ogImage: await pickedImage(form, "ogImageFile", "ogImage", "site"),
      naverVerification: str(form, "naverVerification"),
      googleVerification: str(form, "googleVerification"),
    });

    return { ok: true, message: "저장했습니다. 검색엔진에 반영되기까지는 며칠 걸립니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 협회 이야기 — 협회소개 가운데 글 */
export async function saveStory(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("site.manage");

    await putSetting("story", {
      heading: str(form, "heading"),
      lead: str(form, "lead"),
      note: str(form, "note"),
      // 빈 줄로 문단을 나눈다. 글 쓰듯 적으면 그대로 문단이 된다.
      paragraphs: str(form, "paragraphs")
        .split(/\n\s*\n/)
        .map((t) => t.trim())
        .filter(Boolean),
    });

    return { ok: true, message: "저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 회장 인사말 */
export async function savePresidentMessage(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("site.manage");

    await putSetting("president_message", {
      quote: str(form, "quote"),
      note: str(form, "note"),
      plaque: str(form, "plaque"),
      body: str(form, "body"),
    });

    return { ok: true, message: "저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * 여러 줄짜리 항목 — 주요사업 / 연혁 / 자주 묻는 질문.
 *
 * 화면에서 줄을 더하고 지운 결과를 JSON 으로 받는다.
 * 관리자만 부를 수 있지만, 아는 항목만 남기고 나머지는 버린다.
 */
export async function saveSiteList(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("site.manage");

    const key = str(form, "key");
    const allowed = ["programs", "history", "faqs", "stats", "partners"];
    if (!allowed.includes(key)) return { ok: false, message: "알 수 없는 항목입니다." };

    let rows: Record<string, unknown>[];
    try {
      const parsed = JSON.parse(str(form, "rows"));
      if (!Array.isArray(parsed)) throw new Error("목록이 아닙니다");
      rows = parsed;
    } catch {
      return { ok: false, message: "내용을 읽지 못했습니다. 화면을 새로고침해 주세요." };
    }

    const pick = (row: Record<string, unknown>, fields: string[]) =>
      Object.fromEntries(fields.map((f) => [f, String(row[f] ?? "")]));

    const cleaned = rows.map((row, i) => {
      const id = String(row.id ?? `${key}-${i + 1}`);

      if (key === "programs") return { id, ...pick(row, ["title", "description", "icon"]) };
      if (key === "history") {
        return { id, ...pick(row, ["year", "title", "text"]), upcoming: row.upcoming === true };
      }
      if (key === "stats") {
        return { id, ...pick(row, ["value", "label", "description", "icon"]), order: i + 1 };
      }
      if (key === "partners") {
        const cleanedRow = pick(row, ["name", "note", "logo", "url"]);
        // 빈 칸은 null 로 둔다. 화면에서 "없음"과 "빈 글자"를 구분해 쓴다.
        return {
          id,
          name: cleanedRow.name,
          note: cleanedRow.note,
          logo: cleanedRow.logo || null,
          url: cleanedRow.url || null,
        };
      }
      return { id, ...pick(row, ["question", "answer"]) };
    });

    await putSetting(key, cleaned);
    return { ok: true, message: `${cleaned.length}개를 저장했습니다.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/* ------------------------------------------------------------------ */
/* 히어로 슬라이드 — 메인홈 맨 위 배너                                   */
/* ------------------------------------------------------------------ */

/** 지금 저장된 슬라이드를 읽는다. 아직 없으면 예비 데이터로 시작한다. */
async function readHeroSlides(): Promise<HeroSlide[]> {
  const db = getAdminSupabase();
  const { data } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "hero_slides")
    .maybeSingle();

  if (Array.isArray(data?.value)) return data.value as HeroSlide[];
  return getHeroSlides();
}

async function writeHeroSlides(slides: HeroSlide[]): Promise<void> {
  const db = getAdminSupabase();
  const ordered = slides.map((s, i) => ({ ...s, order: i + 1 }));

  const { error } = await db
    .from("site_settings")
    .upsert({ key: "hero_slides", value: ordered, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  refreshPublicPages();
  revalidatePath("/admin/hero");
}

export async function saveHeroSlide(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const slides = await readHeroSlides();
    const index = num(form, "index") ?? -1;
    if (index < 0 || index >= slides.length) {
      return { ok: false, message: "슬라이드를 찾지 못했습니다." };
    }

    const title = str(form, "title");
    if (!title) return { ok: false, message: "제목을 입력해 주세요." };

    // 강조할 단어는 쉼표로 받는다. 제목에 없는 단어가 들어와도 그냥 무시된다.
    const highlight = str(form, "highlight")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    const links = [1, 2]
      .map((n) => ({
        label: str(form, `linkLabel${n}`),
        href: str(form, `linkHref${n}`),
      }))
      .filter((l) => l.label && l.href);

    slides[index] = {
      ...slides[index],
      eyebrow: str(form, "eyebrow"),
      title,
      highlight,
      description: str(form, "description"),
      note: str(form, "note"),
      thumbTitle: title,
      thumbDescription: str(form, "description"),
      image: await pickedImage(form, "imageFile", "image", "hero"),
      links,
    };

    await writeHeroSlides(slides);
    return { ok: true, message: "저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function addHeroSlide() {
  await requireAdmin();
  const slides = await readHeroSlides();

  slides.push({
    id: `hs${Date.now()}`,
    eyebrow: "원주청년소상공인협회",
    title: "새 슬라이드",
    highlight: [],
    description: "",
    note: "",
    thumbTitle: "새 슬라이드",
    thumbDescription: "",
    image: null,
    links: [],
    order: slides.length + 1,
  });

  await writeHeroSlides(slides);
}

export async function deleteHeroSlide(form: FormData) {
  await requireAdmin();
  const slides = await readHeroSlides();
  const index = Number(form.get("index"));

  // 한 장은 남겨 둔다. 전부 지우면 메인홈 맨 위가 비어 버린다.
  if (slides.length <= 1 || !(index >= 0 && index < slides.length)) return;

  slides.splice(index, 1);
  await writeHeroSlides(slides);
}

export async function moveHeroSlide(form: FormData) {
  await requireAdmin();
  const slides = await readHeroSlides();

  const index = Number(form.get("index"));
  const to = index + (String(form.get("direction")) === "up" ? -1 : 1);
  if (!(index >= 0 && index < slides.length) || to < 0 || to >= slides.length) return;

  [slides[index], slides[to]] = [slides[to], slides[index]];
  await writeHeroSlides(slides);
}

/* ------------------------------------------------------------------ */
/* 팝업 — 메인홈에 뜨는 알림창                                          */
/* ------------------------------------------------------------------ */

export async function savePopup(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getAdminSupabase();

    const id = nullable(form, "id");
    const title = str(form, "title");
    if (!title) return { ok: false, message: "제목을 입력해 주세요." };

    // 날짜만 받고 시각은 하루의 처음과 끝으로 채운다.
    // 관리자가 시각까지 정하게 하면 실수하기 쉽고, 실제로 필요한 적도 드물다.
    const startDate = str(form, "startDate");
    const endDate = str(form, "endDate");
    if (!startDate || !endDate) {
      return { ok: false, message: "노출 기간을 정해 주세요." };
    }
    if (endDate < startDate) {
      return { ok: false, message: "종료일이 시작일보다 빠릅니다." };
    }

    const payload = {
      title,
      body: str(form, "body"),
      image_url: await pickedImage(form, "imageFile", "imageUrl", "popups"),
      link_url: nullable(form, "linkUrl"),
      link_label: nullable(form, "linkLabel"),
      start_at: new Date(`${startDate}T00:00:00+09:00`).toISOString(),
      end_at: new Date(`${endDate}T23:59:59+09:00`).toISOString(),
      status: str(form, "status") || "draft",
    };

    if (id) {
      const { error } = await db.from("popups").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("popups").insert(payload);
      if (error) throw new Error(error.message);
    }

    refreshPublicPages();
    revalidatePath("/admin/popups");

    return { ok: true, message: id ? "수정했습니다." : "만들었습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function deletePopup(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("id") ?? "");
  if (id) await db.from("popups").delete().eq("id", id);
  refreshPublicPages();
  revalidatePath("/admin/popups");
  redirect("/admin/popups");
}

export async function saveOrgGroupOrder(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getAdminSupabase();

    const order = str(form, "order")
      .split(",")
      .map((g) => g.trim())
      .filter((g): g is OrgGroup => ORG_GROUPS.includes(g as OrgGroup));

    // 아는 분류만 남긴 뒤, 빠진 분류는 뒤에 붙여 하나도 잃지 않게 한다.
    const full = [...order, ...ORG_GROUPS.filter((g) => !order.includes(g))];

    const { error } = await db
      .from("site_settings")
      .upsert({ key: "orgGroupOrder", value: full, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);

    refreshPublicPages();
    revalidatePath("/admin/org");

    return { ok: true, message: "순서를 저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveOrgMember(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getAdminSupabase();

    const id = nullable(form, "id");
    const name = str(form, "name");
    const title = str(form, "title");

    if (!name) return { ok: false, message: "이름을 입력해 주세요." };
    if (!title) return { ok: false, message: "직책을 입력해 주세요." };

    const photoUrl = await pickedImage(form, "photoFile", "photo", "org");

    const payload = {
      name,
      org_group: str(form, "group"),
      title,
      sub_title: nullable(form, "subTitle"),
      department: nullable(form, "department"),
      business_id: nullable(form, "businessId"),
      photo: photoUrl,
      intro: str(form, "intro"),
      expertise: nullable(form, "expertise"),
      sort_order: num(form, "sortOrder") ?? 99,
    };

    if (id) {
      const { error } = await db.from("org_members").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("org_members").insert(payload);
      if (error) throw new Error(error.message);
    }

    refreshPublicPages();
    revalidatePath("/admin/org");

    return { ok: true, message: id ? "수정했습니다." : "추가했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteOrgMember(form: FormData) {
  await requireAdmin();
  const db = getAdminSupabase();
  const id = String(form.get("id") ?? "");
  if (id) await db.from("org_members").delete().eq("id", id);
  refreshPublicPages();
  revalidatePath("/admin/org");
  redirect("/admin/org");
}
