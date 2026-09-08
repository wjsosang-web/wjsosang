/**
 * Supabase 에서 읽는 구현.
 *
 * src/lib/repo/seed.ts 와 같은 함수 이름·같은 반환 타입을 유지한다.
 * 화면 코드는 어느 쪽이 쓰이는지 알 필요가 없다.
 *
 * 사이트 문구(협회 소개, 히어로 슬라이드 등)는 site_settings 테이블에
 * key/value(jsonb) 로 담긴다. 아직 옮기지 않은 항목은 시드 값으로 대체해서
 * 콘텐츠 이관 중에도 화면이 비지 않게 한다.
 */

import { createClient } from "@supabase/supabase-js";
import { toDateKey } from "@/lib/date";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import * as seed from "@/lib/repo/seed";
import type {
  AssociationStory,
  Business,
  Faq,
  HeroSlide,
  HistoryItem,
  Member,
  MenuItem,
  OrgMember,
  PartnerOrg,
  PopupNotice,
  PresidentMessage,
  Post,
  ProgramItem,
  SiteInfo,
  StatItem,
} from "@/lib/types";

/**
 * 쿼리가 실패하면(테이블이 아직 없거나 일시적 오류) 시드 값으로 대체한다.
 * 마이그레이션 도중이나 DB 장애 때 사이트가 빈 화면이 되는 것을 막는다.
 */
async function orSeed<T>(
  run: () => PromiseLike<{ data: unknown; error: unknown }>,
  map: (data: never) => T,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    const { data, error } = await run();
    if (error || data === null) return fallback();
    return map(data as never);
  } catch {
    return fallback();
  }
}

/** 공개 데이터 읽기용 클라이언트. RLS 의 "공개된 것만 읽기" 정책이 적용된다. */
function db() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ------------------------------------------------------------------ */
/* 사이트 설정                                                          */
/* ------------------------------------------------------------------ */

/** site_settings 한 칸을 읽고, 없으면 시드 값을 그대로 쓴다. */
async function setting<T>(key: string, fallback: () => Promise<T>): Promise<T> {
  const { data, error } = await db()
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return fallback();
  return data.value as T;
}

export async function getSiteInfo(): Promise<SiteInfo> {
  return setting("info", seed.getSiteInfo);
}

export async function getStory(): Promise<AssociationStory> {
  return setting("story", seed.getStory);
}

export async function getPresidentMessage(): Promise<PresidentMessage> {
  return setting("president_message", seed.getPresidentMessage);
}

export async function getPrograms(): Promise<ProgramItem[]> {
  return setting("programs", seed.getPrograms);
}

export async function getHistory(): Promise<HistoryItem[]> {
  return setting("history", seed.getHistory);
}

export async function getPartners(): Promise<PartnerOrg[]> {
  return setting("partners", seed.getPartners);
}

export async function getFaqs(): Promise<Faq[]> {
  return setting("faqs", seed.getFaqs);
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return setting("hero_slides", seed.getHeroSlides);
}

export async function getStats(): Promise<StatItem[]> {
  const { data } = await db()
    .from("site_stats")
    .select("id, value, label, description, icon, sort_order")
    .order("sort_order");

  if (!data || data.length === 0) return seed.getStats();

  return data.map((r) => ({
    id: r.id as string,
    value: r.value as string,
    label: r.label as string,
    description: (r.description as string | null) ?? "",
    icon: (r.icon as string | null) ?? "store",
    order: r.sort_order as number,
  }));
}

export async function getActivePopups(now = new Date()): Promise<PopupNotice[]> {
  const iso = now.toISOString();
  const { data } = await db()
    .from("popups")
    .select("*")
    .eq("status", "public")
    .lte("start_at", iso)
    .gte("end_at", iso);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    body: (r.body as string | null) ?? "",
    imageUrl: (r.image_url as string | null) ?? null,
    linkUrl: (r.link_url as string | null) ?? null,
    linkLabel: (r.link_label as string | null) ?? null,
    startAt: r.start_at as string,
    endAt: r.end_at as string,
    status: r.status as PopupNotice["status"],
  }));
}

/* ------------------------------------------------------------------ */
/* 업장                                                                */
/* ------------------------------------------------------------------ */

const BUSINESS_SELECT = `
  *,
  business_photos (id, url, caption, sort_order),
  business_promo_blocks (id, block_type, text, image_url, caption, sort_order),
  business_menus (id, name, price, description, image_url, source, sort_order)
`;

type Row = Record<string, unknown>;

/** DB 행을 화면이 쓰는 모양으로 바꾼다. */
export function toBusiness(r: Row): Business {
  const photos = ((r.business_photos as Row[]) ?? [])
    .map((p) => ({
      id: p.id as string,
      url: (p.url as string | null) ?? null,
      caption: (p.caption as string | null) ?? "",
      order: (p.sort_order as number) ?? 0,
    }))
    .sort((a, b) => a.order - b.order);

  const promo = ((r.business_promo_blocks as Row[]) ?? [])
    .map((p) => ({
      id: p.id as string,
      type: ((p.block_type as string) === "image" ? "image" : "text") as "image" | "text",
      text: (p.text as string | null) ?? undefined,
      imageUrl: (p.image_url as string | null) ?? null,
      caption: (p.caption as string | null) ?? undefined,
      order: (p.sort_order as number) ?? 0,
    }))
    .sort((a, b) => a.order - b.order);

  const menus: MenuItem[] = ((r.business_menus as Row[]) ?? [])
    .map((m) => ({
      id: m.id as string,
      name: m.name as string,
      price: (m.price as string | null) ?? null,
      description: (m.description as string | null) ?? null,
      imageUrl: (m.image_url as string | null) ?? null,
      source: ((m.source as string) === "place" ? "place" : "manual") as "place" | "manual",
      order: (m.sort_order as number) ?? 0,
    }))
    .sort((a, b) => a.order - b.order);

  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    category: r.category as Business["category"],
    tagline: (r.tagline as string) ?? "",
    description: (r.description as string) ?? "",
    ownerName: (r.owner_name as string) ?? "",
    address: (r.address as string) ?? "",
    district: (r.district as string) ?? "",
    lat: (r.lat as number | null) ?? null,
    lng: (r.lng as number | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    hours: (r.hours as string | null) ?? null,
    placeUrl: (r.place_url as string | null) ?? null,
    homepageUrl: (r.homepage_url as string | null) ?? null,
    instagramUrl: (r.instagram_url as string | null) ?? null,
    blogUrl: (r.blog_url as string | null) ?? null,
    snsUrl: (r.sns_url as string | null) ?? null,
    logoImage: (r.logo_image as string | null) ?? null,
    benefit: (r.benefit as string | null) ?? null,
    coverImage: (r.cover_image as string | null) ?? null,
    photos,
    promo,
    placeId: (r.place_id as string | null) ?? null,
    placeType: (r.place_type as string | null) ?? null,
    placePhoto: (r.place_photo as string | null) ?? null,
    placeKeywords: (r.place_keywords as string[] | null) ?? [],
    menus,
    placeSyncedAt: (r.place_synced_at as string | null) ?? null,
    fieldSources: (r.field_sources as Business["fieldSources"]) ?? {},
    keywords: (r.keywords as string[] | null) ?? [],
    priority: (r.priority as number | null) ?? null,
    featured: Boolean(r.featured),
    status: r.status as Business["status"],
    sourcedFromPlace: Boolean(r.sourced_from_place),
    createdAt: (r.created_at as string) ?? "",
    updatedAt: (r.updated_at as string) ?? "",
  };
}

export async function getPublicBusinesses(): Promise<Business[]> {
  return orSeed(
    () => db().from("businesses").select(BUSINESS_SELECT).eq("status", "public"),
    (rows: Row[]) => rows.map((r) => toBusiness(r)),
    seed.getPublicBusinesses,
  );
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data } = await db()
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("slug", slug)
    .eq("status", "public")
    .maybeSingle();
  return data ? toBusiness(data as Row) : null;
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const { data } = await db().from("businesses").select(BUSINESS_SELECT).eq("id", id).maybeSingle();
  return data ? toBusiness(data as Row) : null;
}

export async function getFeaturedBusinesses(limit = 3): Promise<Business[]> {
  const { data } = await db()
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("status", "public")
    .eq("featured", true)
    .limit(limit);
  return (data ?? []).map((r) => toBusiness(r as Row));
}

export async function getDistricts(): Promise<string[]> {
  return orSeed(
    () => db().from("businesses").select("district").eq("status", "public"),
    (rows: Row[]) => {
      const used = new Set(rows.map((r) => r.district as string).filter(Boolean));
      return [...used].sort((a, b) => a.localeCompare(b, "ko"));
    },
    seed.getDistricts,
  );
}

/* ------------------------------------------------------------------ */
/* 조직                                                                */
/* ------------------------------------------------------------------ */

export function toOrgMember(r: Row): OrgMember {
  return {
    id: r.id as string,
    memberId: (r.member_id as string | null) ?? null,
    businessId: (r.business_id as string | null) ?? null,
    name: r.name as string,
    group: r.org_group as OrgMember["group"],
    title: r.title as string,
    department: (r.department as string | null) ?? null,
    photo: (r.photo as string | null) ?? null,
    intro: (r.intro as string) ?? "",
    expertise: (r.expertise as string | null) ?? null,
    order: (r.sort_order as number) ?? 0,
  };
}

export async function getOrgMembers(): Promise<OrgMember[]> {
  return orSeed(
    () => db().from("org_members").select("*").order("sort_order"),
    (rows: Row[]) => rows.map((r) => toOrgMember(r)),
    seed.getOrgMembers,
  );
}

/* ------------------------------------------------------------------ */
/* 게시물                                                              */
/* ------------------------------------------------------------------ */

const POST_SELECT = `*, post_photos (id, url, caption, sort_order)`;

export function toPost(r: Row): Post {
  const photos = ((r.post_photos as Row[]) ?? [])
    .map((p) => ({
      id: p.id as string,
      url: (p.url as string | null) ?? null,
      caption: (p.caption as string | null) ?? "",
      order: (p.sort_order as number) ?? 0,
    }))
    .sort((a, b) => a.order - b.order);

  return {
    id: r.id as string,
    type: r.type as Post["type"],
    slug: r.slug as string,
    title: r.title as string,
    category: (r.category as Post["category"]) ?? null,
    date: r.date as string,
    startDate: (r.start_date as string | null) ?? null,
    endDate: (r.end_date as string | null) ?? null,
    dateTbd: Boolean(r.date_tbd),
    time: (r.time as string | null) ?? null,
    place: (r.place as string | null) ?? null,
    participants: (r.participants as number | null) ?? null,
    summary: (r.summary as string) ?? "",
    body: (r.body as string) ?? "",
    coverImage: (r.cover_image as string | null) ?? null,
    photos,
    pinned: Boolean(r.pinned),
    important: Boolean(r.important),
    status: r.status as Post["status"],
  };
}

export async function getNotices(limit?: number): Promise<Post[]> {
  let query = db()
    .from("posts")
    .select(POST_SELECT)
    .eq("type", "notice")
    .eq("status", "public")
    .order("pinned", { ascending: false })
    .order("date", { ascending: false });

  if (limit) query = query.limit(limit);
  return orSeed(
    () => query,
    (rows: Row[]) => rows.map((r) => toPost(r)),
    () => seed.getNotices(limit),
  );
}

export async function getActivities(limit?: number): Promise<Post[]> {
  let query = db()
    .from("posts")
    .select(POST_SELECT)
    .eq("type", "activity")
    .eq("status", "public")
    .order("date", { ascending: false });

  if (limit) query = query.limit(limit);
  return orSeed(
    () => query,
    (rows: Row[]) => rows.map((r) => toPost(r)),
    () => seed.getActivities(limit),
  );
}

export async function getPublicPosts(): Promise<Post[]> {
  return orSeed(
    () => db().from("posts").select(POST_SELECT).eq("status", "public"),
    (rows: Row[]) => rows.map((r) => toPost(r)),
    seed.getPublicPosts,
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data } = await db()
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "public")
    .maybeSingle();
  return data ? toPost(data as Row) : null;
}

export async function getEventsByYear(year: number): Promise<Post[]> {
  const { data } = await db()
    .from("posts")
    .select(POST_SELECT)
    .eq("type", "event")
    .eq("status", "public")
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`)
    .order("date");
  if (!data || data.length === 0) return seed.getEventsByYear(year);
  return data.map((r) => toPost(r as Row));
}

export async function getEventYears(): Promise<number[]> {
  const { data } = await db()
    .from("posts")
    .select("date")
    .eq("type", "event")
    .eq("status", "public");

  if (!data || data.length === 0) return seed.getEventYears();
  const years = new Set(data.map((r) => Number((r.date as string).slice(0, 4))));
  return [...years].sort((a, b) => a - b);
}

/** 오늘 열리는 행사. 있으면 홈페이지 접속 시 팝업으로 안내한다. */
export async function getTodayEvents(now = new Date()): Promise<Post[]> {
  const today = toDateKey(now);
  const { data, error } = await db()
    .from("posts")
    .select(POST_SELECT)
    .eq("type", "event")
    .eq("status", "public")
    .eq("date_tbd", false)
    .lte("date", today)
    .order("date");

  if (error || !data) return seed.getTodayEvents(now);

  // 종료일까지 걸쳐 있는 행사도 오늘 열리는 것으로 본다
  return data
    .map((r) => toPost(r as Row))
    .filter((p) => (p.endDate ?? p.startDate ?? p.date) >= today);
}

export async function getNextEvent(now = new Date()): Promise<Post | null> {
  const today = toDateKey(now);
  const { data } = await db()
    .from("posts")
    .select(POST_SELECT)
    .eq("type", "event")
    .eq("status", "public")
    .eq("date_tbd", false)
    .gte("date", today)
    .order("date")
    .limit(1)
    .maybeSingle();
  return data ? toPost(data as Row) : null;
}

/* ------------------------------------------------------------------ */
/* 회원                                                                */
/* ------------------------------------------------------------------ */

/**
 * 공개 사이트에서는 회원 목록을 읽을 수 없다(RLS 로 막혀 있다).
 * 임원 사진 대체용으로만 쓰이므로 빈 배열을 돌려준다.
 * 관리자 화면은 service role 로 따로 조회한다.
 */
export async function getMembers(): Promise<Member[]> {
  return [];
}

export async function getBusinessesOwnedBy(): Promise<Business[]> {
  return [];
}

export async function getMembersOfBusiness(): Promise<Member[]> {
  return [];
}
