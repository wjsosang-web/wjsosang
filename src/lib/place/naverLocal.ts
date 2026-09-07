/**
 * 네이버 공식 지역검색 API.
 *
 * https://openapi.naver.com/v1/search/local.json
 *
 * 여기서 오는 값은 공식 API라 구조가 잘 안 바뀐다.
 * 상호 / 업종 / 주소 / 도로명주소 / 전화 / 좌표까지 안정적으로 가져온다.
 * 대신 사진·메뉴·영업시간·대표키워드는 주지 않는다. 그건 placePage.ts 가 맡는다.
 */

import type { PlaceDraft } from "@/lib/types";

interface LocalItem {
  title: string;
  link: string;
  category: string;
  telephone: string;
  address: string;
  roadAddress: string;
  /** KATECH(TM128) 좌표. 위경도로 바꿔야 한다. */
  mapx: string;
  mapy: string;
}

/** <b> 태그가 섞여 오므로 걷어낸다. */
const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").trim();

export function hasLocalApiKeys(): boolean {
  return Boolean(process.env.NAVER_SEARCH_CLIENT_ID && process.env.NAVER_SEARCH_CLIENT_SECRET);
}

/**
 * 상호명으로 지역검색을 해서 가장 그럴듯한 한 건을 고른다.
 * 플레이스 페이지에서 상호를 먼저 알아낸 뒤 이 함수로 주소·전화를 보강하는 식으로 쓴다.
 */
export async function searchLocal(query: string): Promise<Partial<PlaceDraft> | null> {
  if (!hasLocalApiKeys()) return null;

  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "5");

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_SEARCH_CLIENT_ID as string,
      "X-Naver-Client-Secret": process.env.NAVER_SEARCH_CLIENT_SECRET as string,
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`네이버 지역검색 API 오류 (${res.status})`);
  }

  const data = (await res.json()) as { items?: LocalItem[] };
  const item = data.items?.[0];
  if (!item) return null;

  const address = item.roadAddress || item.address || "";

  return {
    name: stripTags(item.title) || null,
    // "음식점>한식>육류,고기" 처럼 오므로 가장 구체적인 마지막 조각을 쓴다
    category: item.category ? item.category.split(">").pop()?.trim() || null : null,
    address: address || null,
    district: extractDistrict(address),
    phone: item.telephone || null,
    ...tm128ToWgs84(Number(item.mapx), Number(item.mapy)),
  };
}

/**
 * 주소에서 원주시의 읍·면·동을 뽑는다. 지역 필터 기준이 된다.
 * 도로명주소에는 동이 없는 경우가 많아 지번주소도 함께 넘겨 보는 게 좋다.
 */
export function extractDistrict(address: string): string | null {
  if (!address) return null;
  const match = address.match(/([가-힣]+(?:\d+)?(?:동|읍|면))(?:\s|$)/);
  return match ? match[1] : null;
}

/**
 * 네이버 지역검색이 주는 TM128(KATECH) 좌표를 위경도로 바꾼다.
 *
 * 정확한 변환에는 측지 라이브러리가 필요하다. 여기서는 근사식만 쓰고,
 * 지도에 정확히 찍어야 할 때는 관리자가 좌표를 직접 확인하도록 한다.
 * (플레이스 페이지에서 위경도를 직접 얻으면 그 값을 우선한다.)
 */
function tm128ToWgs84(mapx: number, mapy: number): { lat: number | null; lng: number | null } {
  if (!Number.isFinite(mapx) || !Number.isFinite(mapy)) {
    return { lat: null, lng: null };
  }
  // 지역검색 API 는 최근 응답에서 경위도*1e7 형태를 주는 경우가 있다.
  if (mapx > 1_000_000_0 && mapy > 1_000_000_0) {
    return { lat: mapy / 1e7, lng: mapx / 1e7 };
  }
  // 그 밖의 값은 신뢰하지 않고 비워 둔다. 잘못된 좌표를 넣는 것보다 낫다.
  return { lat: null, lng: null };
}
