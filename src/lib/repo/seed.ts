/**
 * 로컬 시드 JSON에서 읽는 구현.
 *
 * Supabase 자격증명이 없을 때 이쪽이 쓰인다.
 * src/lib/repo/supabase.ts 와 같은 함수 이름·같은 반환 타입을 유지해야 한다.
 */

import { toDateKey } from "@/lib/date";
import { ORG_GROUPS } from "@/lib/types";
import type {
  AssociationStory,
  Faq,
  HeroSlide,
  PresidentMessage,
  HistoryItem,
  JoinGuide,
  SeoSettings,
  PartnerOrg,
  ProgramItem,
  Business,
  Member,
  MemberBusiness,
  OrgGroup,
  OrgMember,
  PopupNotice,
  Post,
  SiteInfo,
  StatItem,
} from "@/lib/types";

import businessesSeed from "@/lib/data/seed/businesses.json";
import membersSeed from "@/lib/data/seed/members.json";
import orgSeed from "@/lib/data/seed/org.json";
import postsSeed from "@/lib/data/seed/posts.json";
import siteSeed from "@/lib/data/seed/site.json";

const businesses = businessesSeed as unknown as Business[];
const posts = postsSeed as unknown as Post[];
const orgMembers = orgSeed as unknown as OrgMember[];
const members = membersSeed.members as unknown as Member[];
const memberBusinesses = membersSeed.memberBusinesses as unknown as MemberBusiness[];

const isPublic = <T extends { status: string }>(row: T) => row.status === "public";

/* ------------------------------------------------------------------ */
/* 사이트 설정                                                          */
/* ------------------------------------------------------------------ */

export async function getSiteInfo(): Promise<SiteInfo> {
  return siteSeed.info as SiteInfo;
}

/** 숫자로 보는 원청협 — 코드에 고정하지 않고 데이터에서 읽는다. */
export async function getStats(): Promise<StatItem[]> {
  return (siteSeed.stats as StatItem[]).slice().sort((a, b) => a.order - b.order);
}

/** 메인 히어로 슬라이드 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  return (siteSeed.heroSlides as HeroSlide[]).slice().sort((a, b) => a.order - b.order);
}

export async function getSeo(): Promise<SeoSettings> {
  return siteSeed.seo as SeoSettings;
}

export async function getJoinGuide(): Promise<JoinGuide> {
  return siteSeed.joinGuide as JoinGuide;
}

export async function getFaqs(): Promise<Faq[]> {
  return siteSeed.faqs as Faq[];
}

export async function getPresidentMessage(): Promise<PresidentMessage> {
  return siteSeed.presidentMessage as PresidentMessage;
}

/** 기간이 유효하고 공개 상태인 팝업만 반환한다. */
export async function getActivePopups(now = new Date()): Promise<PopupNotice[]> {
  return (siteSeed.popups as PopupNotice[]).filter(
    (p) =>
      p.status === "public" &&
      new Date(p.startAt) <= now &&
      now <= new Date(p.endAt),
  );
}

/* ------------------------------------------------------------------ */
/* 업장                                                                */
/* ------------------------------------------------------------------ */

export async function getPublicBusinesses(): Promise<Business[]> {
  return businesses.filter(isPublic);
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  return businesses.find((b) => b.slug === slug && isPublic(b)) ?? null;
}

/** 이달의 추천 회원업장 — 관리자가 featured 로 지정한 곳 */
export async function getFeaturedBusinesses(limit = 3): Promise<Business[]> {
  return businesses.filter((b) => isPublic(b) && b.featured).slice(0, limit);
}

/** 지역 필터 선택지 — 등록된 업장에서 실제로 쓰이는 동만 뽑는다. */
export async function getDistricts(): Promise<string[]> {
  const used = new Set(businesses.filter(isPublic).map((b) => b.district));
  return [...used].sort((a, b) => a.localeCompare(b, "ko"));
}

/* ------------------------------------------------------------------ */
/* 조직                                                                */
/* ------------------------------------------------------------------ */

export async function getOrgMembers(): Promise<OrgMember[]> {
  return orgMembers.slice().sort((a, b) => a.order - b.order);
}

/** 예비 데이터에는 회원 전용 자료를 두지 않는다 (파일이 저장소에만 있다) */
export async function getMemberDocInfo(): Promise<{ title: string; description: string } | null> {
  return null;
}

export async function getOrgGroupOrder(): Promise<OrgGroup[]> {
  return ORG_GROUPS.slice();
}

/* ------------------------------------------------------------------ */
/* 게시물                                                              */
/* ------------------------------------------------------------------ */

const byDateDesc = (a: Post, b: Post) => b.date.localeCompare(a.date);

export async function getNotices(limit?: number): Promise<Post[]> {
  const rows = posts
    .filter((p) => p.type === "notice" && isPublic(p))
    // 상단고정 공지를 먼저, 그 다음 최신순
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || byDateDesc(a, b));
  return limit ? rows.slice(0, limit) : rows;
}

export async function getActivities(limit?: number): Promise<Post[]> {
  const rows = posts.filter((p) => p.type === "activity" && isPublic(p)).sort(byDateDesc);
  return limit ? rows.slice(0, limit) : rows;
}

export async function getPublicPosts(): Promise<Post[]> {
  return posts.filter(isPublic);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return posts.find((p) => p.slug === slug && isPublic(p)) ?? null;
}

/** 연간 일정 캘린더용 — 해당 연도의 행사 전부 (지난 것 포함) */
export async function getEventsByYear(year: number): Promise<Post[]> {
  return posts
    .filter((p) => p.type === "event" && isPublic(p))
    .filter((p) => (p.startDate ?? p.date).startsWith(String(year)))
    .sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date));
}

/** 행사가 등록된 연도 목록 — 캘린더 연도 선택기에 쓴다. */
export async function getEventYears(): Promise<number[]> {
  const years = new Set(
    posts
      .filter((p) => p.type === "event" && isPublic(p))
      .map((p) => Number((p.startDate ?? p.date).slice(0, 4))),
  );
  return [...years].sort((a, b) => a - b);
}

/** 오늘 열리는 행사. 있으면 홈페이지 접속 시 팝업으로 안내한다. */
export async function getTodayEvents(now = new Date()): Promise<Post[]> {
  const today = toDateKey(now);
  return posts.filter(
    (p) =>
      p.type === "event" &&
      isPublic(p) &&
      !p.dateTbd &&
      (p.startDate ?? p.date) <= today &&
      (p.endDate ?? p.startDate ?? p.date) >= today,
  );
}

/** 다음 예정 행사 1건. 없으면 null → 화면에서 섹션 자체를 숨긴다. */
export async function getNextEvent(now = new Date()): Promise<Post | null> {
  const today = toDateKey(now);
  return (
    posts
      .filter((p) => p.type === "event" && isPublic(p) && !p.dateTbd)
      .filter((p) => (p.endDate ?? p.startDate ?? p.date) >= today)
      .sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date))[0] ?? null
  );
}

/* ------------------------------------------------------------------ */
/* 회원 (2단계 회원 로그인 대비 — 지금은 화면에 직접 노출하지 않는다)    */
/* ------------------------------------------------------------------ */

export async function getMembers(): Promise<Member[]> {
  return members;
}

/** 이 회원이 수정 권한을 가진 업장들. 2단계 로그인에서 그대로 쓴다. */
export async function getBusinessesOwnedBy(memberId: string): Promise<Business[]> {
  const ids = memberBusinesses
    .filter((mb) => mb.memberId === memberId && mb.canEdit)
    .map((mb) => mb.businessId);
  return businesses.filter((b) => ids.includes(b.id));
}

/** 업장에 연결된 회원들 (공동대표 포함). */
export async function getMembersOfBusiness(businessId: string): Promise<Member[]> {
  const ids = memberBusinesses
    .filter((mb) => mb.businessId === businessId)
    .map((mb) => mb.memberId);
  return members.filter((m) => ids.includes(m.id));
}


/* ------------------------------------------------------------------ */
/* 협회소개 콘텐츠                                                      */
/* ------------------------------------------------------------------ */

export async function getStory(): Promise<AssociationStory> {
  return siteSeed.story as AssociationStory;
}

export async function getPrograms(): Promise<ProgramItem[]> {
  return siteSeed.programs as ProgramItem[];
}

export async function getHistory(): Promise<HistoryItem[]> {
  return siteSeed.history as HistoryItem[];
}

export async function getPartners(): Promise<PartnerOrg[]> {
  return siteSeed.partners as PartnerOrg[];
}

export async function getBusinessById(id: string): Promise<Business | null> {
  return businesses.find((b) => b.id === id) ?? null;
}
