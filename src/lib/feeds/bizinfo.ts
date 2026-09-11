/**
 * 기업마당 지원사업 공고.
 *
 * 중앙부처·지자체·공공기관이 올리는 지원사업 공고가 모두 여기로 모인다.
 * 소상공인 정책자금(융자) 공고도 이곳에 함께 올라오기 때문에,
 * 이 한 곳만 봐도 "지금 신청할 수 있는 돈"은 거의 다 잡힌다.
 *
 * 인증키는 기업마당(bizinfo.go.kr)에서 따로 받는다.
 * 공공데이터포털 키와는 다른 키다.
 *
 *   BIZINFO_API_KEY=...
 *
 * 키가 없으면 빈 목록을 돌려준다. 알림이 안 갈 뿐,
 * 나머지 기능이 멈추면 안 되기 때문이다.
 */

import { toDate, toText, type FeedDraft } from "@/lib/feeds/types";

const ENDPOINT = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";

/**
 * 어떤 공고를 가져올지.
 *
 * "강원" 은 강원도·원주시가 올린 지역 공고를 잡고,
 * "소상공인" 은 전국 단위 공고 중 우리와 상관있는 것을 잡는다.
 * 둘 다 받아서 합친 뒤 중복을 지운다.
 */
export const DEFAULT_TAGS = ["강원", "소상공인"];

export function hasBizinfoKey(): boolean {
  return Boolean(process.env.BIZINFO_API_KEY);
}

type Row = Record<string, unknown>;

/** 응답 어디에 목록이 들어 있든 찾아낸다. 필드 이름이 바뀌어도 견디게. */
function rowsOf(payload: unknown): Row[] {
  if (Array.isArray(payload)) return payload as Row[];
  if (!payload || typeof payload !== "object") return [];

  for (const value of Object.values(payload as Row)) {
    if (Array.isArray(value)) return value as Row[];
    if (value && typeof value === "object") {
      const nested = rowsOf(value);
      if (nested.length > 0) return nested;
    }
  }
  return [];
}

/** 여러 이름 중 먼저 값이 있는 것을 고른다 */
function pick(row: Row, ...names: string[]): string {
  for (const name of names) {
    const value = row[name];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

/**
 * 신청기간이 "20260101 ~ 20260131" 한 칸에 들어오기도 한다.
 * 그럴 때는 앞뒤로 나눈다.
 */
function splitPeriod(text: string): { from: string | null; to: string | null } {
  const dates = text.match(/\d{4}[-.]?\d{2}[-.]?\d{2}/g);
  if (!dates || dates.length === 0) return { from: null, to: null };
  return { from: toDate(dates[0]), to: toDate(dates[dates.length - 1]) };
}

async function fetchTag(key: string, tag: string, count: number): Promise<Row[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("crtfcKey", key);
  url.searchParams.set("dataType", "json");
  url.searchParams.set("searchCnt", String(count));
  if (tag) url.searchParams.set("hashtags", tag);

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`기업마당이 ${res.status} 를 돌려줬습니다`);

  return rowsOf(await res.json());
}

export async function fetchBizinfo(
  tags: string[] = DEFAULT_TAGS,
  countPerTag = 60,
): Promise<FeedDraft[]> {
  const key = process.env.BIZINFO_API_KEY;
  if (!key) return [];

  const found = new Map<string, FeedDraft>();

  for (const tag of tags) {
    let rows: Row[] = [];
    try {
      rows = await fetchTag(key, tag, countPerTag);
    } catch {
      // 한 조건이 실패해도 나머지는 가져온다
      continue;
    }

    for (const row of rows) {
      const title = toText(pick(row, "pblancNm", "title"), 200);
      if (!title) continue;

      const id =
        pick(row, "pblancId", "seq", "pblancSn") ||
        // 번호를 안 주면 제목으로 구분한다. 같은 제목이 두 번 오는 일은 드물다.
        `t-${title.slice(0, 60)}`;

      if (found.has(id)) continue;

      const rawLink = pick(row, "pblancUrl", "link", "rceptInsttUrl");
      const period = splitPeriod(pick(row, "reqstBeginEndDe", "reqstDt", "applicationPeriod"));

      found.set(id, {
        source: "bizinfo",
        externalId: id,
        title,
        summary: toText(pick(row, "bsnsSumryCn", "description", "cn")),
        link: rawLink.startsWith("http") ? rawLink : `https://www.bizinfo.go.kr${rawLink}`,
        organizer: pick(row, "jrsdInsttNm", "excInsttNm", "author") || null,
        category: pick(row, "pldirSportRealmLclasCodeNm", "lcategory") || null,
        startsOn: toDate(pick(row, "reqstBeginDe")) ?? period.from,
        endsOn: toDate(pick(row, "reqstEndDe")) ?? period.to,
        publishedOn: toDate(pick(row, "creatPnttm", "rgtrInsttNm", "pubDate")),
      });
    }
  }

  return [...found.values()];
}
