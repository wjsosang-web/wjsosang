import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Role } from "@/lib/types";

/**
 * 지금 로그인한 사람이 관리자인지 확인한다.
 *
 * 관리자 여부는 members 테이블의 role 로 판단한다.
 * auth 계정만 있고 members 에 연결된 행이 없으면 관리자가 아니다.
 */

export interface AdminUser {
  accountId: string;
  memberId: string;
  name: string;
  email: string | null;
  role: Role;
}

const ADMIN_ROLES: Role[] = ["superadmin", "admin"];

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("id, name, email, role")
    .eq("account_id", user.id)
    .maybeSingle();

  if (!member || !ADMIN_ROLES.includes(member.role as Role)) return null;

  return {
    accountId: user.id,
    memberId: member.id as string,
    name: member.name as string,
    email: (member.email as string | null) ?? user.email ?? null,
    role: member.role as Role,
  };
}

/** 관리자가 아니면 예외를 던진다. API 라우트에서 쓴다. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("관리자 권한이 필요합니다.");
  return admin;
}
