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
