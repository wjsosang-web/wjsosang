import { getAdminSupabase } from "@/lib/supabase/server";
import { toBusiness, toOrgMember, toPost } from "@/lib/repo/supabase";
import { toDateKey } from "@/lib/date";
import type { Business, Member, OrgMember, Post } from "@/lib/types";

/**
 * 관리자 화면에서 쓰는 조회.
 *
 * 공개 사이트와 달리 비공개(private/draft) 항목까지 전부 보여야 하므로
 * service role 로 읽는다. 호출하는 쪽에서 requireAdmin() 을 먼저 통과시킨다.
 */

type Row = Record<string, unknown>;

const BUSINESS_SELECT = `
  *,
  business_photos (id, url, caption, sort_order),
  business_promo_blocks (id, block_type, text, image_url, caption, sort_order),
  business_menus (id, name, price, description, image_url, source, sort_order)
`;
const POST_SELECT = `*, post_photos (id, url, caption, sort_order)`;

/* ------------------------------------------------------------------ */
/* 대시보드                                                            */
/* ------------------------------------------------------------------ */

export interface DashboardCounts {
  members: number;
  businesses: number;
  publicBusinesses: number;
  upcomingEvents: number;
  unhandledInquiries: number;
  recentActivities: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const db = getAdminSupabase();
  const today = toDateKey(new Date());
  const head = { count: "exact" as const, head: true };

  const [members, businesses, publicBusinesses, upcomingEvents, unhandledInquiries, activities] =
    await Promise.all([
      db.from("members").select("id", head),
      db.from("businesses").select("id", head),
      db.from("businesses").select("id", head).eq("status", "public"),
      db.from("posts").select("id", head).eq("type", "event").gte("date", today),
      db.from("inquiries").select("id", head).eq("handled", false),
      db.from("posts").select("id", head).eq("type", "activity"),
    ]);

  return {
    members: members.count ?? 0,
    businesses: businesses.count ?? 0,
    publicBusinesses: publicBusinesses.count ?? 0,
    upcomingEvents: upcomingEvents.count ?? 0,
    unhandledInquiries: unhandledInquiries.count ?? 0,
    recentActivities: activities.count ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* 게시물                                                              */
/* ------------------------------------------------------------------ */

export async function listPosts(type?: Post["type"]): Promise<Post[]> {
  const db = getAdminSupabase();
  let query = db.from("posts").select(POST_SELECT).order("date", { ascending: false });
  if (type) query = query.eq("type", type);
  const { data } = await query;
  return (data ?? []).map((r) => toPost(r as Row));
}

export async function getPostById(id: string): Promise<Post | null> {
  const db = getAdminSupabase();
  const { data } = await db.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  return data ? toPost(data as Row) : null;
}

/* ------------------------------------------------------------------ */
/* 업장                                                                */
/* ------------------------------------------------------------------ */

export async function listBusinesses(): Promise<Business[]> {
  const db = getAdminSupabase();
  const { data } = await db
    .from("businesses")
    .select(BUSINESS_SELECT)
    .order("priority", { ascending: true, nullsFirst: false })
    .order("name");
  return (data ?? []).map((r) => toBusiness(r as Row));
}

export async function getBusinessByIdAdmin(id: string): Promise<Business | null> {
  const db = getAdminSupabase();
  const { data } = await db.from("businesses").select(BUSINESS_SELECT).eq("id", id).maybeSingle();
  return data ? toBusiness(data as Row) : null;
}

/* ------------------------------------------------------------------ */
/* 회원 · 조직                                                          */
/* ------------------------------------------------------------------ */

export async function listMembers(): Promise<Member[]> {
  const db = getAdminSupabase();
  const { data } = await db.from("members").select("*").order("name");

  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    accountId: (r.account_id as string | null) ?? null,
    authProvider: (r.auth_provider as Member["authProvider"]) ?? null,
    role: r.role as Member["role"],
    status: r.status as Member["status"],
    phone: (r.phone as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    joinedAt: (r.joined_at as string | null) ?? null,
    profileImage: (r.profile_image as string | null) ?? null,
    consents: [],
  }));
}

export async function listOrgMembers(): Promise<OrgMember[]> {
  const db = getAdminSupabase();
  const { data } = await db.from("org_members").select("*").order("sort_order");
  return (data ?? []).map((r) => toOrgMember(r as Row));
}

/* ------------------------------------------------------------------ */
/* 문의                                                                */
/* ------------------------------------------------------------------ */

export interface Inquiry {
  id: string;
  kind: string;
  name: string;
  phone: string;
  company: string | null;
  email: string | null;
  message: string;
  privacyAgreed: boolean;
  handled: boolean;
  createdAt: string;
}

export async function listInquiries(): Promise<Inquiry[]> {
  const db = getAdminSupabase();
  const { data } = await db
    .from("inquiries")
    .select("*")
    .order("handled")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind: r.kind as string,
    name: r.name as string,
    phone: r.phone as string,
    company: (r.company as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    message: r.message as string,
    privacyAgreed: Boolean(r.privacy_agreed),
    handled: Boolean(r.handled),
    createdAt: r.created_at as string,
  }));
}
