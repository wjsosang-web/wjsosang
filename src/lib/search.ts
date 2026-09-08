/**
 * 회원업장 검색·정렬 로직.
 *
 * 검색 대상 (화면에 안내하지 않는 숨은 항목 포함)
 *   - 겉으로 보이는 것: 업장명, 업종, 한 줄 소개, 상세 소개, 주소, 지역
 *   - 겉으로 드러내지 않는 것: 대표자명, 관리자 등록 키워드, 플레이스 대표키워드, 메뉴 이름,
 *     그리고 대표자의 협회 직함(회장·이사·감사·사무국장·재무국장 …)과 소속국
 *
 * 정렬
 *   - priority 가 지정된 업장이 먼저 (관리자가 회장단·이사진 순서를 직접 정한다)
 *   - 나머지는 랜덤. 다만 서버와 클라이언트가 같은 순서를 만들어야 하므로
 *     날짜를 시드로 쓰는 결정적 셔플을 사용한다(하루 단위로 순서가 바뀐다).
 */

import { resolveBusinessCover } from "@/lib/images";
import type { Business, OrgMember } from "@/lib/types";

/** 카드에 그릴 값 + 검색에만 쓰는 텍스트 */
export interface BusinessCard {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  district: string;
  coverImage: string | null;
  priority: number | null;
  /** 협회 가입 6개월 이내 */
  isNew: boolean;
  /** 임원이 운영하는 업장 — 목록에서 위로 올린다 */
  isOfficer: boolean;
  /** 검색 전용. 화면에는 절대 출력하지 않는다. */
  searchText: string;
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");

/** 협회 가입 6개월 이내면 신입회원 */
export function isNewMember(memberSince: string | null, today: string): boolean {
  if (!memberSince) return false;
  const joined = new Date(`${memberSince}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return joined >= sixMonthsAgo && joined <= now;
}

export function buildBusinessCards(
  businesses: Business[],
  orgMembers: OrgMember[],
  today = "",
): BusinessCard[] {
  return businesses.map((b) => {
    // 이 업장과 연결된 협회 직책들. businessId 연결이 우선이고,
    // 연결이 없으면 대표자 이름으로도 맞춰본다.
    const roles = orgMembers.filter(
      (o) => (o.businessId && o.businessId === b.id) || o.name === b.ownerName,
    );

    const hidden = [
      b.ownerName,
      ...b.keywords,
      // 플레이스에서 가져온 대표키워드와 메뉴 이름도 검색된다.
      // 예: "돈까스"로 검색하면 메뉴에 돈까스가 있는 식당이 나온다.
      ...b.placeKeywords,
      ...b.menus.map((m) => m.name),
      ...roles.flatMap((o) => [o.title, o.department ?? "", o.group, o.expertise ?? ""]),
    ];

    const visible = [b.name, b.category, b.tagline, b.description, b.address, b.district];

    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      category: b.category,
      tagline: b.tagline,
      district: b.district,
      // 회원 사진이 없으면 플레이스 대표사진으로 대체된다
      coverImage: resolveBusinessCover(b).url,
      priority: b.priority,
      isNew: isNewMember(b.memberSince, today),
      // 임원 직책이 붙어 있으면 임원 업장으로 본다
      isOfficer: roles.some((o) => o.title && o.title !== "회원"),
      searchText: normalize([...visible, ...hidden].filter(Boolean).join(" ")),
    };
  });
}

export interface BusinessFilter {
  query: string;
  category: string | null;
  district: string | null;
}

export function filterBusinessCards(
  cards: BusinessCard[],
  { query, category, district }: BusinessFilter,
): BusinessCard[] {
  // 공백으로 나눈 모든 토큰이 포함돼야 통과 (AND 조건)
  const tokens = query.trim().split(/\s+/).filter(Boolean).map(normalize);

  return cards.filter((c) => {
    if (category && c.category !== category) return false;
    if (district && c.district !== district) return false;
    return tokens.every((t) => c.searchText.includes(t));
  });
}

/* ------------------------------------------------------------------ */
/* 결정적 셔플                                                          */
/* ------------------------------------------------------------------ */

/** mulberry32 — 같은 시드면 서버와 브라우저가 같은 순서를 만든다. */
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const rand = seededRandom(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** "2026-09-07" → 20260907. 하루가 지나면 랜덤 순서가 새로 섞인다. */
export function seedFromDateKey(dateKey: string): number {
  return Number(dateKey.replace(/-/g, ""));
}

/**
 * 노출 순서.
 *
 *   1. 관리자가 우선순위를 매긴 업장 (숫자가 작을수록 먼저)
 *   2. 임원이 운영하는 업장
 *   3. 나머지는 랜덤
 *
 * 랜덤은 날짜를 시드로 쓰는 결정적 셔플이라 서버와 브라우저 순서가 같고,
 * 하루가 지나면 순서가 새로 섞인다. 그래서 특정 업장만 계속 위에 있지 않다.
 */
export function orderBusinessCards(cards: BusinessCard[], seed: number): BusinessCard[] {
  const pinned = cards
    .filter((c) => c.priority !== null)
    .sort((a, b) => (a.priority as number) - (b.priority as number));

  const officers = cards.filter((c) => c.priority === null && c.isOfficer);
  const rest = cards.filter((c) => c.priority === null && !c.isOfficer);

  return [...pinned, ...shuffle(officers, seed), ...shuffle(rest, seed)];
}
