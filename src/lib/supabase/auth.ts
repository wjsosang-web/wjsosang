import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { can, type Permission } from "@/lib/permissions";
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

// 임원진도 관리자 화면에 들어온다. 무엇까지 할 수 있는지는
// lib/permissions 의 can() 으로 화면마다 따로 가린다.
const ADMIN_ROLES: Role[] = ["superadmin", "admin", "officer"];

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

/**
 * 특정 권한이 없으면 예외를 던진다.
 *
 * requireAdmin() 만으로는 임원진과 운영자를 가르지 못한다.
 * 권한을 바꾸거나 협회 정보를 고치는 일은 운영자만 해야 하므로
 * 그런 동작은 이 함수로 한 번 더 막는다.
 */
export async function requirePermission(permission: Permission): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!can(admin.role, permission)) {
    throw new Error("이 작업을 할 권한이 없습니다. 운영자에게 문의해 주세요.");
  }
  return admin;
}
