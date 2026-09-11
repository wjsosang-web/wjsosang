/**
 * 회원업장 검색·정렬 로직.
 *
 * 검색 대상 (화면에 안내하지 않는 숨은 항목 포함)
 *   - 겉으로 보이는 것: 업장명, 업종, 한 줄 소개, 상세 소개, 주소, 지역
 *   - 겉으로 드러내지 않는 것: 대표자명, 관리자 등록 키워드, 플레이스 대표키워드, 메뉴 이름,
 *     그리고 대표자의 협회 직함(회장·이사·감사·사무국장·재무국장 …)과 소속국
 *
 * 정렬
 *   - priority 가 지정된 업장이 먼저 (관리자가 직접 정한 몇 곳)
 *   - 나머지는 임원·일반 구분 없이 전부 랜덤. 다만 서버와 클라이언트가 같은 순서를 만들어야 하므로
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
  /** 이 업장이 속한 모든 업종 */
  categories: string[];
  tagline: string;
  district: string;
  coverImage: string | null;
  priority: number | null;
  /** 협회 가입 6개월 이내 */
  isNew: boolean;
  /** 임원이 운영하는 업장 — 목록에서 위로 올린다 */
  isOfficer: boolean;
  /** 임원 직책 (회장 / 사무국장 / 이사 …). 없으면 null */
  officerTitle: string | null;
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

    // 대표 직책 하나만 배지로 보여준다. 여러 개면 순서가 앞선 것을 쓴다.
    const officerTitle =
      roles
        .filter((o) => o.title && o.title !== "회원")
        .sort((a, b2) => a.order - b2.order)[0]?.title ?? null;

    // 겸업 업종도 검색어에 넣는다. "자동차"로 찾아도 휴대폰 가게가 걸려야 한다.
    const visible = [
      b.name,
      ...(b.categories.length > 0 ? b.categories : [b.category]),
      b.tagline,
      b.description,
      b.address,
      b.district,
    ];

    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      category: b.category,
      categories: b.categories.length > 0 ? b.categories : [b.category].filter(Boolean),
      tagline: b.tagline,
      district: b.district,
      // 회원 사진이 없으면 플레이스 대표사진으로 대체된다
      coverImage: resolveBusinessCover(b).url,
      priority: b.priority,
      isNew: !b.hideNewBadge && isNewMember(b.memberSince, today),
      // 임원 직책이 붙어 있으면 임원 업장으로 본다
      isOfficer: officerTitle !== null,
      officerTitle,
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
    // 겸업이면 어느 쪽으로 걸러도 나와야 한다
    if (category && !c.categories.includes(category)) return false;
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
 *   2. 그 밖의 모든 업장은 임원·일반 구분 없이 전부 랜덤
 *
 * 예전에는 임원 업장을 한 덩어리로 앞에 몰아 놓았는데, 임원 업장만 서른 곳이라
 * 첫 화면(모바일 15칸)이 통째로 임원 업장으로 채워졌다. 매일 순서가 바뀌어도
 * 나오는 얼굴이 늘 같으니 랜덤이 아닌 것처럼 보였다. 그래서 모두 같이 섞는다.
 *
 * 랜덤은 날짜를 시드로 쓰는 결정적 셔플이라 서버와 브라우저 순서가 같고,
 * 하루가 지나면 순서가 새로 섞인다. 그래서 특정 업장만 계속 위에 있지 않다.
 */
export function orderBusinessCards(cards: BusinessCard[], seed: number): BusinessCard[] {
  const pinned = cards
    .filter((c) => c.priority !== null)
    .sort((a, b) => (a.priority as number) - (b.priority as number));

  const rest = cards.filter((c) => c.priority === null);

  return [...pinned, ...shuffle(rest, seed)];
}
