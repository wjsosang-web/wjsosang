/**
 * 원주에서 열리는 행사·축제.
 *
 * 원주시가 직접 여는 공공데이터 창구에는 행사 자료가 없다.
 * 대신 한국관광공사가 전국 축제·행사를 매일 갱신해서 열어 둔다(TourAPI).
 * 강원 전체를 받아 와서 주소에 "원주" 가 들어간 것만 남긴다.
 *
 * 시군구 코드로 거르지 않는 이유는, 코드가 개편으로 바뀐 적이 있어서
 * 주소로 거르는 편이 오래 간다. 강원 한 달치라야 몇십 건이라 부담도 없다.
 *
 *   TOUR_API_KEY=...   공공데이터포털 "한국관광공사_국문 관광정보 서비스" 인증키
 */

import { toDate, toText, type FeedDraft } from "@/lib/feeds/types";

/** 강원특별자치도 */
const AREA_GANGWON = "32";

/** 관광공사가 서비스 이름을 바꾼 적이 있어서, 새 것부터 차례로 시도한다. */
const SERVICES = [
  { path: "KorService2", op: "searchFestival2" },
  { path: "KorService1", op: "searchFestival1" },
];

export function hasTourKey(): boolean {
  return Boolean(process.env.TOUR_API_KEY);
}

interface FestivalRow {
  contentid?: string;
  title?: string;
  addr1?: string;
  eventstartdate?: string;
  eventenddate?: string;
  firstimage?: string;
  tel?: string;
  createdtime?: string;
}

function itemsOf(payload: unknown): FestivalRow[] {
  const body = (payload as { response?: { body?: { items?: unknown } } })?.response?.body?.items;
  if (!body || typeof body !== "object") return [];

  const item = (body as { item?: unknown }).item;
  if (Array.isArray(item)) return item as FestivalRow[];
  if (item && typeof item === "object") return [item as FestivalRow];
  return [];
}

/** YYYYMMDD. 오늘부터 앞으로 열리는 행사만 받는다. */
function todayKey(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}

async function callOnce(
  key: string,
  service: (typeof SERVICES)[number],
  rows: number,
): Promise<FestivalRow[]> {
  const url = new URL(`https://apis.data.go.kr/B551011/${service.path}/${service.op}`);
  // 인증키는 이미 URL 인코딩된 형태로 발급된다. searchParams 에 넣으면 두 번 인코딩돼서 막힌다.
  const query = new URLSearchParams({
    MobileOS: "ETC",
    MobileApp: "wjsosang",
    _type: "json",
    numOfRows: String(rows),
    pageNo: "1",
    arrange: "A",
    areaCode: AREA_GANGWON,
    eventStartDate: todayKey(),
  });

  const res = await fetch(`${url}?serviceKey=${key}&${query}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`관광공사가 ${res.status} 를 돌려줬습니다`);

  // 키가 틀리면 JSON 이 아니라 XML 오류문을 준다
  const text = await res.text();
  if (!text.trim().startsWith("{")) throw new Error("인증키를 확인해 주세요");

  return itemsOf(JSON.parse(text));
}

export async function fetchFestivals(rows = 100): Promise<FeedDraft[]> {
  const key = process.env.TOUR_API_KEY;
  if (!key) return [];

  let found: FestivalRow[] = [];
  let lastError: unknown = null;

  for (const service of SERVICES) {
    try {
      found = await callOnce(key, service, rows);
      if (found.length > 0) break;
    } catch (e) {
      lastError = e;
    }
  }

  if (found.length === 0 && lastError) throw lastError;

  return found
    .filter((row) => (row.addr1 ?? "").includes("원주"))
    .map((row) => {
      const starts = toDate(row.eventstartdate);
      const ends = toDate(row.eventenddate);

      return {
        source: "festival" as const,
        externalId: String(row.contentid ?? row.title ?? ""),
        title: toText(row.title, 200),
        summary: [toText(row.addr1, 120), row.tel ? `문의 ${toText(row.tel, 40)}` : ""]
          .filter(Boolean)
          .join(" · "),
        link: row.contentid
          ? `https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=${row.contentid}`
          : "",
        organizer: "원주시",
        category: "행사·축제",
        startsOn: starts,
        endsOn: ends,
        publishedOn: toDate(row.createdtime),
      };
    })
    .filter((item) => item.externalId && item.title);
}
