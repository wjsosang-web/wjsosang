/**
 * 소상공인 지식배움터(edu.sbiz.or.kr) 공지사항.
 *
 * 왜 공지사항인가
 *   지식배움터는 공개 API 가 없다. 공공데이터포털에 올라와 있는 교육 자료는
 *   2021·2024년 통계 파일이라 "지금 신청할 수 있는 교육"과는 상관이 없다.
 *   현장교육(집합교육) 목록은 소상공인24 로그인 뒤에 있어서 가져올 수 없다.
 *
 *   공개된 것 중 교육 소식이 실제로 올라오는 곳은 공지사항뿐이다.
 *   그래서 공지사항을 읽되, 이벤트 당첨자 발표 같은 것은 걸러내고
 *   모집·신청 성격의 글만 남긴다.
 *
 * 이 방식은 API 가 아니라 화면을 읽는 것이라, 저쪽 화면이 바뀌면 멈춘다.
 * 멈춰도 오류를 내지 않고 빈 목록을 돌려준다. 다른 출처는 그대로 돌아야 한다.
 */

import { toDate, toText, type FeedDraft } from "@/lib/feeds/types";

const LIST_URL = "https://edu.sbiz.or.kr/edu/board/noticeList.do?menuCode=WWW004004";
const VIEW_URL = "https://edu.sbiz.or.kr/edu/board/noticeView.do?bbsNo=";

/**
 * 회원에게 보낼 만한 글만 남기는 말들.
 *
 * 공지사항에는 "이달의 공부왕 당첨자 발표" 같은 글이 절반쯤 된다.
 * 그런 것까지 휴대폰으로 보내면 다음부터 알림을 안 읽는다.
 */
const KEEP = /(모집|신청|접수|교육과정|과정 안내|개설|주문식|무료|지원|설명회|세미나|컨설팅)/;
const DROP = /(당첨자|발표|이벤트 당첨|점검|중단 안내|시스템 개선)/;

interface Row {
  id: string;
  title: string;
  date: string | null;
}

/** 목록 표에서 글 번호·제목·날짜를 뽑는다 */
function parseRows(html: string): Row[] {
  const body = html.slice(html.search(/<tbody/i));
  if (!body) return [];

  const rows: Row[] = [];

  // <a ... onclick="notiView('20949')...>제목</a> … <td>2026-09-10</td>
  const blocks = body.split(/<tr[^>]*>/i);

  for (const block of blocks) {
    const idMatch = block.match(/notiView\(\s*'(\d+)'\s*\)/);
    if (!idMatch) continue;

    const titleMatch = block.match(/notiView\([^)]*\)[^>]*>([\s\S]*?)<\/a>/);
    const title = toText(titleMatch?.[1], 200);
    if (!title) continue;

    const dateMatch = block.match(/>(\d{4}-\d{2}-\d{2})</);

    rows.push({ id: idMatch[1], title, date: toDate(dateMatch?.[1]) });
  }

  return rows;
}

export async function fetchSemasEdu(): Promise<FeedDraft[]> {
  let html = "";

  try {
    const res = await fetch(LIST_URL, {
      headers: {
        // 사람이 보는 화면과 같은 것을 달라고 알린다. 없으면 다른 화면을 주기도 한다.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "accept-language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  return parseRows(html)
    .filter((row) => KEEP.test(row.title) && !DROP.test(row.title))
    .map((row) => ({
      source: "semas_edu" as const,
      externalId: row.id,
      title: row.title,
      summary: "소상공인 지식배움터 공지사항입니다. 자세한 내용은 원문을 확인해 주세요.",
      link: `${VIEW_URL}${row.id}`,
      organizer: "소상공인시장진흥공단",
      category: "교육",
      startsOn: null,
      endsOn: null,
      publishedOn: row.date,
    }));
}
