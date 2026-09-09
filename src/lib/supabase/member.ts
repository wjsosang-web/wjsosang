import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { MemberStatus, Role } from "@/lib/types";

/**
 * 지금 로그인한 회원을 확인한다.
 *
 * 관리자 확인(getCurrentAdmin)과 나누어 둔 이유:
 *   관리자는 "권한이 있는가"를 보고, 회원은 "가입 신청이 어디까지 왔는가"를 본다.
 *   로그인은 했지만 아직 신청서를 안 쓴 사람, 신청했지만 승인 전인 사람이
 *   각각 다른 화면으로 가야 하기 때문이다.
 */

export interface CurrentMember {
  accountId: string;
  email: string | null;
  /** 아직 신청서를 쓰지 않았으면 null */
  member: {
    id: string;
    name: string;
    status: MemberStatus;
    role: Role;
    rejectReason: string | null;
  } | null;
}

export async function getCurrentMember(): Promise<CurrentMember | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("members")
    .select("id, name, status, role, reject_reason")
    .eq("account_id", user.id)
    .maybeSingle();

  return {
    accountId: user.id,
    email: user.email ?? null,
    member: data
      ? {
          id: data.id as string,
          name: data.name as string,
          status: data.status as MemberStatus,
          role: data.role as Role,
          rejectReason: (data.reject_reason as string | null) ?? null,
        }
      : null,
  };
}

/** 승인이 끝난 회원인지 */
export function isActiveMember(current: CurrentMember | null): boolean {
  return current?.member?.status === "active";
}
