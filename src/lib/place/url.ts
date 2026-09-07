/**
 * 네이버 플레이스 주소 해석.
 *
 * 관리자가 붙여넣는 주소는 형태가 제각각이다.
 *   https://naver.me/xxxxxxx                          (공유 단축주소)
 *   https://m.place.naver.com/restaurant/1234567890/home
 *   https://pcmap.place.naver.com/restaurant/1234567890
 *   https://map.naver.com/p/entry/place/1234567890
 *   https://map.naver.com/v5/entry/place/1234567890
 *
 * 단축주소는 리다이렉트를 따라가야 실제 주소를 알 수 있다.
 *
 * 보안: 서버가 임의의 주소를 대신 호출하게 두면 내부망을 찔러보는 통로가 된다(SSRF).
 * 그래서 네이버 도메인만 허용하고, 리다이렉트 한 단계마다 다시 검사한다.
 */

const ALLOWED_HOSTS = new Set([
  "naver.me",
  "m.place.naver.com",
  "place.naver.com",
  "pcmap.place.naver.com",
  "map.naver.com",
  "m.map.naver.com",
  "v.map.naver.com",
  "naver.com",
  "www.naver.com",
]);

/** 플레이스 업종 경로로 쓰이는 값들 */
const PLACE_TYPES = [
  "restaurant",
  "cafe",
  "hairshop",
  "beauty",
  "hospital",
  "clinic",
  "accommodation",
  "attraction",
  "place",
  "share",
];

export interface ParsedPlaceUrl {
  placeId: string | null;
  placeType: string | null;
  /** 정규화된 모바일 플레이스 주소 */
  canonicalUrl: string | null;
}

export function isAllowedHost(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** 주소에서 플레이스 id 와 업종을 뽑는다. 리다이렉트는 따라가지 않는다. */
export function parsePlaceUrl(raw: string): ParsedPlaceUrl {
  const empty: ParsedPlaceUrl = { placeId: null, placeType: null, canonicalUrl: null };

  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return empty;
  }

  const segments = u.pathname.split("/").filter(Boolean);

  // /restaurant/1234567890/home  또는  /p/entry/place/1234567890
  let placeType: string | null = null;
  let placeId: string | null = null;

  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    if (PLACE_TYPES.includes(seg)) placeType = seg === "share" ? null : seg;
    if (/^\d{6,}$/.test(seg)) {
      placeId = seg;
      // id 바로 앞이 업종이면 그걸 쓴다 (entry/place/123... 형태 대응)
      const prev = segments[i - 1];
      if (prev && PLACE_TYPES.includes(prev) && prev !== "share") placeType = prev;
    }
  }

  // map.naver.com 은 쿼리로 id 를 주기도 한다
  if (!placeId) {
    const fromQuery = u.searchParams.get("id") ?? u.searchParams.get("entryId");
    if (fromQuery && /^\d{6,}$/.test(fromQuery)) placeId = fromQuery;
  }

  if (!placeId) return { ...empty, placeType };

  const type = placeType ?? "place";
  return {
    placeId,
    placeType: type,
    canonicalUrl: `https://m.place.naver.com/${type}/${placeId}/home`,
  };
}

/**
 * naver.me 단축주소를 실제 주소로 편다.
 * 리다이렉트를 직접 따라가면서 매 단계 도메인을 검사한다.
 */
export async function resolveShortUrl(raw: string, maxHops = 5): Promise<string> {
  let current = raw.trim();

  for (let hop = 0; hop < maxHops; hop += 1) {
    if (!isAllowedHost(current)) {
      throw new Error(`허용되지 않은 주소입니다: ${current}`);
    }

    const res = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": UA, "accept-language": "ko-KR,ko;q=0.9" },
      signal: AbortSignal.timeout(8000),
    });

    const location = res.headers.get("location");
    if (!location) return current;

    current = new URL(location, current).toString();
  }

  return current;
}

/** 플레이스 페이지는 모바일 UA 로 요청해야 필요한 데이터가 들어온다. */
export const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
