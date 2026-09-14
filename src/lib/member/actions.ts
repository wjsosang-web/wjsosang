"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, getAdminSupabase } from "@/lib/supabase/server";


/**
 * 로그인한 회원이 쓰는 동작.
 *
 * 관리자 동작(admin/actions.ts)과 나눠 둔다. 이쪽은 권한이 훨씬 좁고,
 * "지금 로그인한 본인"만 건드릴 수 있어야 한다. 한 파일에 섞어 두면
 * 나중에 실수로 회원 화면에서 관리자 동작을 부르기 쉬워진다.
 */

/** 회원 전용 자료가 담긴 비공개 저장소. 관리자 저장 쪽과 같은 이름을 쓴다. */
const MEMBER_BUCKET = "member-files";

export interface MemberActionResult {
  ok: boolean;
  message: string;
  url?: string;
}

/** 휴대폰 번호는 적는 방식이 제각각이다. 숫자만 남겨서 비교한다. */
function digitsOf(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/** 이름은 띄어쓰기만 정리한다. 동명이인은 휴대폰으로 갈린다. */
function nameKey(value: string): string {
  return value.replace(/\s+/g, "");
}

/**
 * 로그인한 계정을 협회 명단의 내 이름과 잇는다.
 *
 * 명단 134명은 관리국이 엑셀로 관리해 온 것이라 로그인 계정이 없다.
 * 카카오로 로그인해도 그 계정이 명단의 누구인지 알 수가 없어서,
 * 본인 확인을 한 번 거쳐 이어 붙인다.
 *
 * 이름만으로는 안 된다. 남의 이름을 적어 회원 자료를 보게 되기 때문이다.
 * 그래서 이름과 휴대폰 번호가 둘 다 맞아야 한다.
 */
export async function linkMyAccount(
  _prev: MemberActionResult | null,
  form: FormData,
): Promise<MemberActionResult> {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, message: "로그인이 필요합니다." };

    const name = nameKey(String(form.get("name") ?? ""));
    const phone = digitsOf(String(form.get("phone") ?? ""));

    if (!name || !phone) {
      return { ok: false, message: "이름과 휴대폰 번호를 모두 적어 주세요." };
    }
    if (phone.length < 10) {
      return { ok: false, message: "휴대폰 번호를 다시 확인해 주세요." };
    }

    const db = getAdminSupabase();

    // 이 계정이 이미 다른 회원과 이어져 있으면 더 할 일이 없다
    const { data: mine } = await db
      .from("members")
      .select("id")
      .eq("account_id", user.id)
      .maybeSingle();

    if (mine) return { ok: true, message: "이미 연결되어 있습니다." };

    // 이름·번호는 적는 방식이 제각각이라 DB 조건으로는 못 거른다. 받아서 맞춘다.
    const { data: candidates } = await db
      .from("members")
      .select("id, name, phone, account_id, status");

    const found = (candidates ?? []).find(
      (m) =>
        nameKey((m.name as string) ?? "") === name &&
        digitsOf((m.phone as string) ?? "") === phone,
    );

    if (!found) {
      return {
        ok: false,
        message:
          "명단에서 찾지 못했습니다. 협회에 등록된 이름·번호와 같은지 확인해 주시고, 계속 안 되면 사무국(010-2777-0093)으로 연락 주세요.",
      };
    }

    if (found.account_id && found.account_id !== user.id) {
      return {
        ok: false,
        message: "이미 다른 계정과 연결된 회원입니다. 사무국으로 연락 주세요.",
      };
    }

    const { error } = await db
      .from("members")
      .update({ account_id: user.id, updated_at: new Date().toISOString() })
      .eq("id", found.id as string);

    if (error) throw new Error(error.message);

    revalidatePath("/my");
    return { ok: true, message: `${found.name as string} 님, 확인되었습니다.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

interface MemberDocValue {
  title: string;
  description: string;
  code: string;
  path: string | null;
  fileName: string | null;
}

/**
 * 승인된 회원에게 회원 전용 자료를 내려 준다.
 *
 * 협회소개 화면에서는 코드를 적어야 하지만, 로그인한 회원은 이미 본인이
 * 확인된 사람이다. 코드를 또 묻는 것은 로그인을 한 보람이 없다.
 */
export async function downloadMemberDoc(): Promise<MemberActionResult> {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, message: "로그인이 필요합니다." };

    const db = getAdminSupabase();

    const { data: me } = await db
      .from("members")
      .select("status")
      .eq("account_id", user.id)
      .maybeSingle();

    if (!me || me.status !== "active") {
      return { ok: false, message: "승인된 협회원만 받으실 수 있습니다." };
    }

    const { data: setting } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "member_doc")
      .maybeSingle();

    const doc = setting?.value as MemberDocValue | undefined;
    if (!doc?.path) {
      return { ok: false, message: "아직 올라온 자료가 없습니다." };
    }

    const { data, error } = await db.storage
      .from(MEMBER_BUCKET)
      .createSignedUrl(doc.path, 300, { download: doc.fileName ?? true });

    if (error || !data) {
      return { ok: false, message: "파일을 여는 데 실패했습니다. 잠시 뒤 다시 시도해 주세요." };
    }

    return { ok: true, message: "내려받기를 시작합니다.", url: data.signedUrl };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/* ------------------------------------------------------------------ */
/* 텔레그램 연결 — 회원이 스스로 한다                                    */
/* ------------------------------------------------------------------ */

/**
 * chat_id 는 그 사람이 봇에게 먼저 말을 걸어야 알 수 있는 값이라,
 * 회원이 홈페이지 칸에 적어 넣을 수가 없다. 그래서 짧은 코드로 잇는다.
 *
 *   1. 여기서 여섯 자리 코드를 만들어 준다
 *   2. 회원이 그 코드를 협회 봇에게 보낸다
 *   3. confirmTelegramLink 가 그 코드를 보낸 chat_id 를 찾아 연결한다
 *
 * 헷갈리는 글자(0·O, 1·I)는 빼고 만든다. 옮겨 적다가 틀리면 번거롭다.
 */
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_MINUTES = 10;

function makeCode(): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** 지금 로그인한 회원 행을 찾는다. 없으면 null. */
async function findMyMember() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await getAdminSupabase()
    .from("members")
    .select("id, name, status, telegram_link_code")
    .eq("account_id", user.id)
    .maybeSingle();

  return data ?? null;
}

export interface TelegramCodeResult extends MemberActionResult {
  code?: string;
  /** 봇 주소. 눌러서 바로 대화창을 열 수 있게 한다. */
  botUrl?: string;
  botName?: string;
}

export async function startTelegramLink(): Promise<TelegramCodeResult> {
  try {
    const me = await findMyMember();
    if (!me) return { ok: false, message: "로그인이 필요합니다." };
    if (me.status !== "active") {
      return { ok: false, message: "승인된 협회원만 연결하실 수 있습니다." };
    }

    const { botUsername } = await import("@/lib/telegram");
    const botName = botUsername() ?? "";
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return { ok: false, message: "협회 텔레그램 봇이 아직 준비되지 않았습니다. 사무국에 문의해 주세요." };
    }

    const code = makeCode();
    const expires = new Date(Date.now() + CODE_MINUTES * 60 * 1000).toISOString();

    const { error } = await getAdminSupabase()
      .from("members")
      .update({ telegram_link_code: code, telegram_link_expires: expires })
      .eq("id", me.id as string);

    if (error) throw new Error(error.message);

    return {
      ok: true,
      message: `${CODE_MINUTES}분 안에 협회 봇에게 이 코드를 보내 주세요.`,
      code,
      botName,
      botUrl: botName ? `https://t.me/${botName.replace(/^@/, "")}` : undefined,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function confirmTelegramLink(): Promise<MemberActionResult> {
  try {
    const me = await findMyMember();
    if (!me) return { ok: false, message: "로그인이 필요합니다." };

    const code = me.telegram_link_code as string | null;
    if (!code) return { ok: false, message: "먼저 [연결 시작] 을 눌러 코드를 받아 주세요." };

    const db = getAdminSupabase();

    // 코드가 아직 살아 있는지 다시 확인한다
    const { data: fresh } = await db
      .from("members")
      .select("telegram_link_expires")
      .eq("id", me.id as string)
      .maybeSingle();

    const expires = fresh?.telegram_link_expires as string | null;
    if (!expires || new Date(expires) < new Date()) {
      return { ok: false, message: "코드가 만료되었습니다. 다시 받아 주세요." };
    }

    const { fetchTelegramContacts } = await import("@/lib/telegram");
    const contacts = await fetchTelegramContacts();

    const found = contacts.find((c) => c.text.toUpperCase().includes(code));
    if (!found) {
      return {
        ok: false,
        message: "아직 코드를 받지 못했습니다. 봇에게 코드를 보내신 뒤 다시 눌러 주세요.",
      };
    }

    // 같은 텔레그램을 두 사람이 쓰면 알림이 엉킨다. 먼저 떼어 낸다.
    await db
      .from("members")
      .update({ telegram_chat_id: null, telegram_username: null })
      .eq("telegram_chat_id", found.chatId)
      .neq("id", me.id as string);

    const { error } = await db
      .from("members")
      .update({
        telegram_chat_id: found.chatId,
        telegram_username: found.username,
        telegram_linked_at: new Date().toISOString(),
        telegram_link_code: null,
        telegram_link_expires: null,
      })
      .eq("id", me.id as string);

    if (error) throw new Error(error.message);

    revalidatePath("/my");
    return { ok: true, message: "연결되었습니다. 이제 협회 알림을 받으실 수 있습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function unlinkTelegram(): Promise<MemberActionResult> {
  try {
    const me = await findMyMember();
    if (!me) return { ok: false, message: "로그인이 필요합니다." };

    const { error } = await getAdminSupabase()
      .from("members")
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        telegram_linked_at: null,
        telegram_link_code: null,
        telegram_link_expires: null,
      })
      .eq("id", me.id as string);

    if (error) throw new Error(error.message);

    revalidatePath("/my");
    return { ok: true, message: "연결을 끊었습니다. 이제 알림이 가지 않습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/* ------------------------------------------------------------------ */
/* 가입 신청 — 명단에 없는 분이 홈페이지에서 직접                         */
/* ------------------------------------------------------------------ */

/**
 * 가입 신청.
 *
 * 받는 것은 셋뿐이다. 이름 · 업장명 · 연락처.
 * 많이 물어보면 안 쓴다. 사업자등록번호나 주소 같은 것은 인사국이 승인하면서
 * 따로 받는다. 홈페이지는 "누가 신청했는지" 만 알면 된다.
 *
 * 신청은 곧바로 회원이 되는 것이 아니다. status 를 pending 으로 넣고,
 * 인사국이 관리자 화면에서 승인해야 협회원이 된다.
 */
export async function applyForMembership(
  _prev: MemberActionResult | null,
  form: FormData,
): Promise<MemberActionResult> {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, message: "로그인이 필요합니다." };

    const name = String(form.get("name") ?? "").trim();
    const shopName = String(form.get("shopName") ?? "").trim();
    const phoneRaw = String(form.get("phone") ?? "").trim();
    const phone = digitsOf(phoneRaw);

    if (!name || !shopName || !phone) {
      return { ok: false, message: "이름·업장명·연락처를 모두 적어 주세요." };
    }
    if (phone.length < 10) {
      return { ok: false, message: "휴대폰 번호를 다시 확인해 주세요." };
    }

    const db = getAdminSupabase();

    // 이미 신청했거나 회원이면 또 만들지 않는다
    const { data: mine } = await db
      .from("members")
      .select("id, status")
      .eq("account_id", user.id)
      .maybeSingle();

    if (mine) {
      return {
        ok: true,
        message:
          mine.status === "active" ? "이미 협회원이십니다." : "이미 신청이 접수되어 있습니다.",
      };
    }

    // 같은 번호가 명단에 있으면 신규 신청이 아니라 본인 확인이 맞다.
    // 여기서 새 줄을 만들면 명단에 같은 사람이 두 번 생긴다.
    const { data: existing } = await db.from("members").select("id, name, phone, account_id");
    const already = (existing ?? []).find((m) => digitsOf((m.phone as string) ?? "") === phone);

    if (already && !already.account_id) {
      const { error } = await db
        .from("members")
        .update({ account_id: user.id, updated_at: new Date().toISOString() })
        .eq("id", already.id as string);

      if (error) throw new Error(error.message);

      revalidatePath("/my");
      return {
        ok: true,
        message: `이미 협회 명단에 계셔서 바로 연결해 드렸습니다. (${already.name as string} 님)`,
      };
    }
    if (already) {
      return {
        ok: false,
        message: "이미 등록된 번호입니다. 사무국(010-2777-0093)으로 연락 주세요.",
      };
    }

    const now = new Date().toISOString();
    const { error } = await db.from("members").insert({
      account_id: user.id,
      name,
      shop_name: shopName,
      phone: phoneRaw,
      email: user.email ?? null,
      status: "pending",
      role: "member",
      auth_provider: user.app_metadata?.provider ?? "email",
      applied_at: now,
    });

    if (error) throw new Error(error.message);

    // 인사국에 알린다. 알림이 실패해도 신청은 이미 접수됐다.
    try {
      const { notifyInquiry } = await import("@/lib/notify");
      await notifyInquiry({
        kind: "회원가입 문의",
        name,
        phone: phoneRaw,
        company: shopName,
        email: user.email ?? null,
        message: "홈페이지에서 가입 신청이 들어왔습니다. 관리자 → 회원 관리에서 승인해 주세요.",
      });
    } catch {
      /* 알림 실패는 넘긴다 */
    }

    revalidatePath("/my");
    revalidatePath("/admin/members");

    return {
      ok: true,
      message: "가입 신청이 접수되었습니다. 인사국에서 확인 후 연락드리겠습니다.",
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/* ------------------------------------------------------------------ */
/* 내 업장 고치기 — 본인 업장만                                          */
/* ------------------------------------------------------------------ */

/**
 * 이 업장을 고칠 수 있는 사람인지 확인한다.
 *
 * 명단과 업장은 대표자명으로 이어져 있다. 내 이름이 그 업장의 대표자명과
 * 같을 때만 통과시킨다. 업장 번호만 받아서 고치게 두면, 번호를 바꿔 넣어
 * 남의 가게를 고칠 수 있다.
 *
 * 승인된 회원만 가능하다.
 */
async function assertMyBusiness(businessId: string) {
  const me = await findMyMember();
  if (!me) throw new Error("로그인이 필요합니다.");
  if (me.status !== "active") throw new Error("승인된 협회원만 고치실 수 있습니다.");

  const db = getAdminSupabase();
  const { data: shop } = await db
    .from("businesses")
    .select("id, owner_name, name")
    .eq("id", businessId)
    .maybeSingle();

  if (!shop) throw new Error("업장을 찾지 못했습니다.");
  if ((shop.owner_name as string) !== (me.name as string)) {
    throw new Error("본인 업장만 고치실 수 있습니다.");
  }

  return { db, shop, me };
}

/** 회원이 고칠 수 있는 항목만 추린다. 상호·주소·공개여부는 협회가 관리한다. */
export async function saveMyBusiness(
  _prev: MemberActionResult | null,
  form: FormData,
): Promise<MemberActionResult> {
  try {
    const id = String(form.get("id") ?? "");
    if (!id) return { ok: false, message: "어느 업장인지 알 수 없습니다." };

    const { db } = await assertMyBusiness(id);

    const text = (key: string) => String(form.get(key) ?? "").trim();
    const orNull = (key: string) => text(key) || null;

    const patch: Record<string, unknown> = {
      tagline: text("tagline"),
      description: text("description"),
      phone: orNull("phone"),
      phone_public: form.get("phonePublic") === "on",
      hours: orNull("hours"),
      homepage_url: orNull("homepageUrl"),
      instagram_url: orNull("instagramUrl"),
      blog_url: orNull("blogUrl"),
      benefit: orNull("benefit"),
      updated_at: new Date().toISOString(),
    };

    // 회원이 직접 고친 값은 나중에 플레이스 동기화가 덮어쓰지 않도록 표시해 둔다
    const { data: current } = await db
      .from("businesses")
      .select("field_sources")
      .eq("id", id)
      .maybeSingle();

    const sources = { ...((current?.field_sources as Record<string, string>) ?? {}) };
    for (const key of ["tagline", "description", "phone", "hours", "benefit"]) {
      sources[key] = "manual";
    }
    patch.field_sources = sources;

    const { error } = await db.from("businesses").update(patch).eq("id", id);
    if (error) throw new Error(error.message);

    // 홈페이지에 바로 반영되게 한다
    const { refreshPublicPages } = await import("@/lib/admin/revalidate");
    refreshPublicPages();
    revalidatePath("/my");

    return { ok: true, message: "저장했습니다. 홈페이지에 바로 반영됩니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 대표사진 바꾸기. 사진은 브라우저에서 저장소로 바로 올리고 주소만 온다. */
export async function saveMyBusinessCover(
  _prev: MemberActionResult | null,
  form: FormData,
): Promise<MemberActionResult> {
  try {
    const id = String(form.get("id") ?? "");
    const url = String(form.get("coverImage") ?? "").trim();
    if (!id) return { ok: false, message: "어느 업장인지 알 수 없습니다." };

    const { db } = await assertMyBusiness(id);

    const { error } = await db
      .from("businesses")
      .update({ cover_image: url || null, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);

    const { refreshPublicPages } = await import("@/lib/admin/revalidate");
    refreshPublicPages();
    revalidatePath("/my");

    return { ok: true, message: url ? "대표사진을 바꿨습니다." : "대표사진을 지웠습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
