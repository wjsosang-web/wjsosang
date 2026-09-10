import { getAdminSupabase } from "@/lib/supabase/server";
import { broadcastTelegram, hasTelegram } from "@/lib/telegram";

/**
 * 문의가 들어오면 담당자에게 텔레그램으로 알린다.
 *
 * 누구에게 보낼지는 사람이 아니라 직책으로 정한다.
 * 회장이 바뀌면 임원진이 통째로 바뀌는데, 사람 이름으로 적어두면
 * 그만둔 분에게 계속 알림이 가고 새로 온 분은 못 받는다.
 * 직책으로 두면 조직도만 고쳐도 알림이 따라 옮겨간다.
 *
 * 문의 종류마다 여러 명을 지정할 수 있다. 한 사람만 지정하면
 * 그 사람이 자리를 비웠을 때 문의가 그대로 묻힌다.
 */

/** 문의 종류별로 알림을 받을 직책. 관리자 화면에서 바꾼다. */
export type NotifyRoutes = Record<string, string[]>;

export const INQUIRY_KINDS = [
  "협회 관련 문의",
  "회원가입 문의",
  "협업·제휴 문의",
  "행사 문의",
  "기타",
];

/** 아직 정하지 않았을 때 쓰는 기본값 */
export const DEFAULT_NOTIFY_ROUTES: NotifyRoutes = {
  "협회 관련 문의": ["회장", "부회장", "사무국장"],
  "회원가입 문의": ["인사국장", "인사부국장", "사무국장"],
  "협업·제휴 문의": ["회장", "사무국장", "기획국장"],
  "행사 문의": ["기획국장", "사무국장"],
  기타: ["사무국장"],
};

export async function getNotifyRoutes(): Promise<NotifyRoutes> {
  try {
    const { data } = await getAdminSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", "inquiry_notify")
      .maybeSingle();

    const saved = data?.value as NotifyRoutes | undefined;
    if (saved && typeof saved === "object") {
      // 저장된 값에 없는 종류는 기본값으로 메운다
      return { ...DEFAULT_NOTIFY_ROUTES, ...saved };
    }
  } catch {
    // 설정을 못 읽어도 기본값으로 알림은 가야 한다
  }
  return DEFAULT_NOTIFY_ROUTES;
}

/** 그 직책들을 맡은 사람 중 텔레그램을 등록한 사람의 chat_id */
async function chatIdsForTitles(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];

  const db = getAdminSupabase();

  const { data: org } = await db
    .from("org_members")
    .select("member_id")
    .in("title", titles)
    .not("member_id", "is", null);

  const memberIds = [...new Set((org ?? []).map((o) => o.member_id as string))];
  if (memberIds.length === 0) return [];

  const { data: members } = await db
    .from("members")
    .select("telegram_chat_id")
    .in("id", memberIds)
    .not("telegram_chat_id", "is", null);

  return [...new Set((members ?? []).map((m) => m.telegram_chat_id as string))];
}

export interface InquiryNotice {
  kind: string;
  name: string;
  phone: string;
  company: string | null;
  email: string | null;
  message: string;
}

/** 텔레그램 HTML 모드에서 문제를 일으키는 글자를 막는다 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 문의 알림을 보낸다.
 *
 * 실패해도 예외를 던지지 않는다. 알림이 안 갔다고 해서
 * 문의 접수 자체가 실패하면 안 되기 때문이다.
 */
export async function notifyInquiry(inquiry: InquiryNotice): Promise<void> {
  if (!hasTelegram()) return;

  try {
    const routes = await getNotifyRoutes();
    const titles = routes[inquiry.kind] ?? DEFAULT_NOTIFY_ROUTES["기타"];
    const chatIds = await chatIdsForTitles(titles);

    if (chatIds.length === 0) return;

    const lines = [
      `<b>새 문의가 들어왔습니다</b>`,
      ``,
      `종류: ${escapeHtml(inquiry.kind)}`,
      `이름: ${escapeHtml(inquiry.name)}`,
      `연락처: ${escapeHtml(inquiry.phone)}`,
      inquiry.company ? `업장: ${escapeHtml(inquiry.company)}` : null,
      inquiry.email ? `이메일: ${escapeHtml(inquiry.email)}` : null,
      ``,
      escapeHtml(inquiry.message),
    ].filter((l) => l !== null);

    await broadcastTelegram(chatIds, lines.join("\n"));
  } catch {
    // 알림 실패는 조용히 넘긴다. 문의는 이미 저장되어 관리자 화면에서 볼 수 있다.
  }
}
