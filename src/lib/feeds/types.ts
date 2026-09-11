/**
 * 바깥에서 모아 오는 소식.
 *
 * 출처가 여러 곳이지만 회원이 보는 모양은 하나다.
 * "무엇을, 누가, 언제까지, 어디서 신청" — 이 네 가지면 충분하다.
 * 그래서 출처마다 다른 응답을 모두 이 한 가지 모양으로 바꿔서 담는다.
 */

export type FeedSource = "bizinfo" | "semas_edu" | "festival";

export const SOURCE_LABEL: Record<FeedSource, string> = {
  bizinfo: "지원사업·정책자금",
  semas_edu: "소상공인 교육",
  festival: "원주 행사·축제",
};

/** 알림 첫 줄에 붙는 표시. 무슨 소식인지 한눈에 보이게 한다. */
export const SOURCE_TAG: Record<FeedSource, string> = {
  bizinfo: "💰 지원사업",
  semas_edu: "📚 교육",
  festival: "🎪 행사",
};

/** 출처에서 막 가져온 상태. 아직 저장하지 않았다. */
export interface FeedDraft {
  source: FeedSource;
  /** 그쪽에서 쓰는 고유 번호. 같은 공고를 두 번 담지 않는 기준이다. */
  externalId: string;
  title: string;
  summary: string;
  link: string;
  organizer: string | null;
  category: string | null;
  /** YYYY-MM-DD. 모르면 null */
  startsOn: string | null;
  endsOn: string | null;
  publishedOn: string | null;
}

/** 저장된 소식 */
export interface FeedItem extends FeedDraft {
  id: string;
  notifiedAt: string | null;
  hidden: boolean;
}

/** 여러 모양으로 오는 날짜를 YYYY-MM-DD 로 맞춘다. 못 알아보면 null. */
export function toDate(value: unknown): string | null {
  if (typeof value === "number") return toDate(String(value));
  if (typeof value !== "string") return null;

  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;

  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);

  const year = Number(y);
  if (year < 2000 || year > 2100) return null;
  if (Number(m) < 1 || Number(m) > 12) return null;
  if (Number(d) < 1 || Number(d) > 31) return null;

  return `${y}-${m}-${d}`;
}

/** 태그가 섞인 글에서 글자만 뽑고, 너무 길면 줄인다. */
export function toText(value: unknown, max = 300): string {
  if (typeof value !== "string") return "";

  const plain = value
    .replace(/<[^>]*>/g, " ")
    // &#039; 처럼 숫자로 적힌 기호. 공공기관 화면에서 따옴표가 이렇게 온다.
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // &amp; 는 맨 나중에 푼다. 먼저 풀면 &amp;lt; 가 < 로 두 번 풀린다.
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}
