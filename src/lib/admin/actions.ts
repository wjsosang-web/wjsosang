"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { getAdminSupabase } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/supabase/config";
import { importFromPlaceUrl } from "@/lib/place/import";
import type { PlaceImportResult } from "@/lib/types";

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
function refreshPublicPages() {
  for (const path of ["/", "/about", "/business", "/activities", "/contact"]) {
    revalidatePath(path, "page");
  }
  revalidatePath("/business/[slug]", "page");
  revalidatePath("/activities/[slug]", "page");
}

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

    const cover = form.get("coverFile");
    const coverUrl =
      cover instanceof File && cover.size > 0
        ? await uploadOne(cover, "posts")
        : nullable(form, "coverImage");

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
    const files = form.getAll("photoFiles").filter((f): f is File => f instanceof File && f.size > 0);
    const captions = form.getAll("photoCaptions").map((c) => String(c ?? ""));

    if (files.length > 0 && postId) {
      const { count } = await db
        .from("post_photos")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      const rows = [];
      for (let i = 0; i < files.length; i += 1) {
        const url = await uploadOne(files[i], "posts");
        if (!url) continue;
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

    const cover = form.get("coverFile");
    const coverUrl =
      cover instanceof File && cover.size > 0
        ? await uploadOne(cover, "businesses")
        : nullable(form, "coverImage");

    const logo = form.get("logoFile");
    const logoUrl =
      logo instanceof File && logo.size > 0
        ? await uploadOne(logo, "businesses")
        : nullable(form, "logoImage");

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
    const files = form.getAll("photoFiles").filter((f): f is File => f instanceof File && f.size > 0);
    const captions = form.getAll("photoCaptions").map((c) => String(c ?? ""));

    if (files.length > 0 && businessId) {
      const { count } = await db
        .from("business_photos")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);

      const rows = [];
      for (let i = 0; i < files.length; i += 1) {
        const url = await uploadOne(files[i], "businesses");
        if (!url) continue;
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

    const photo = form.get("photoFile");
    const photoUrl =
      photo instanceof File && photo.size > 0
        ? await uploadOne(photo, "org")
        : nullable(form, "photo");

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
