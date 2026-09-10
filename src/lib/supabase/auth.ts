import { getServerSupabase, getAdminSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { can, type Permission } from "@/lib/permissions";
import type { Role } from "@/lib/types";

/**
 * 지금 로그인한 사람이 관리자 화면을 쓸 수 있는지 확인한다.
 *
 * 권한은 두 가지로 정해진다.
 *
 *   1. members.role — 운영자로 직접 지정된 사람
 *   2. 조직도의 직책 — 회장·부회장·사무국장·인사국장처럼
 *      "그 자리에 앉으면 따라오는" 권한
 *
 * 2번이 있는 이유: 회장이 바뀌면 부회장·이사회·임원진이 통째로 바뀐다.
 * 사람마다 권한을 다시 매기면 빠뜨리기 쉽고, 그만둔 사람의 권한이 남는다.
 * 조직도만 고치면 권한이 따라 움직이도록 직책으로 판단한다.
 *
 * 어떤 직책에 권한을 줄지는 관리자 화면에서 바꾼다(site_settings.approver_titles).
 */

export interface AdminUser {
  accountId: string;
  memberId: string;
  name: string;
  email: string | null;
  /** 실제로 적용되는 권한 등급 */
  role: Role;
  /** 조직도에서 맡고 있는 직책 (없으면 null) */
  title: string | null;
}

const DIRECT_ADMIN: Role[] = ["superadmin", "admin"];

/** 기본값. 관리자 화면에서 바꾸기 전까지 이 직책들이 권한을 갖는다. */
export const DEFAULT_APPROVER_TITLES = [
  "회장",
  "부회장",
  "사무국장",
  "인사국장",
  "인사부국장",
];

export async function getApproverTitles(): Promise<string[]> {
  try {
    const { data } = await getAdminSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", "approver_titles")
      .maybeSingle();

    const saved = data?.value;
    if (Array.isArray(saved) && saved.length > 0) return saved.map(String);
  } catch {
    // 설정을 못 읽어도 기본값으로 동작해야 한다
  }
  return DEFAULT_APPROVER_TITLES;
}

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

  if (!member) return null;

  const memberId = member.id as string;
  const declaredRole = member.role as Role;

  // 조직도에서 맡은 직책을 본다
  let title: string | null = null;
  try {
    const { data: org } = await getAdminSupabase()
      .from("org_members")
      .select("title")
      .eq("member_id", memberId)
      .maybeSingle();
    title = (org?.title as string | null) ?? null;
  } catch {
    // 조직도를 못 읽으면 role 만으로 판단한다
  }

  const role = await resolveRole(declaredRole, title);

  // 관리자 화면에 들어올 수 없는 등급이면 여기서 끊는다
  if (!can(role, "admin.access")) return null;

  return {
    accountId: user.id,
    memberId,
    name: member.name as string,
    email: (member.email as string | null) ?? user.email ?? null,
    role,
    title,
  };
}

/** 지정된 역할과 직책을 합쳐 실제 등급을 정한다 */
async function resolveRole(declared: Role, title: string | null): Promise<Role> {
  if (DIRECT_ADMIN.includes(declared)) return declared;

  if (title) {
    const approverTitles = await getApproverTitles();
    if (approverTitles.includes(title)) return "officer";
  }

  return declared;
}

/** 관리자가 아니면 예외를 던진다. */
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
