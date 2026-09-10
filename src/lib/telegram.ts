/**
 * 텔레그램 알림.
 *
 * 협회 공지·행사·문의 알림을 텔레그램으로 보낸다.
 * 카카오 알림톡과 달리 심사나 발송 비용이 없고, 봇 하나만 만들면 된다.
 *
 * 보내는 방법은 간단하다. 봇 토큰으로 sendMessage 를 부르면 끝이다.
 * 다만 "누구에게" 보낼지는 chat_id 를 알아야 하고, chat_id 는 그 사람이
 * 먼저 봇에게 말을 걸어야 알 수 있다. 그래서 회원이 봇을 한 번 눌러
 * /start 를 보내는 절차가 필요하다. (registerTelegramUpdates 참고)
 *
 * 토큰이 없으면 조용히 아무것도 하지 않는다. 알림이 안 갈 뿐,
 * 글쓰기나 문의 접수 같은 본래 동작이 실패하면 안 되기 때문이다.
 */

const API = "https://api.telegram.org/bot";

export function hasTelegram(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

interface SendResult {
  ok: boolean;
  error?: string;
}

/** 한 사람에게 보낸다 */
export async function sendTelegram(chatId: string, text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "봇 토큰이 없습니다" };

  try {
    const res = await fetch(`${API}${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await res.json()) as { ok?: boolean; description?: string };
    return data.ok ? { ok: true } : { ok: false, error: data.description ?? "발송 실패" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * 여러 사람에게 보낸다.
 *
 * 텔레그램은 초당 발송 수를 제한한다. 한꺼번에 던지면 일부가 조용히 버려지므로
 * 조금씩 끊어서 보내고, 한 사람이 실패해도 나머지는 계속 보낸다.
 */
export async function broadcastTelegram(
  chatIds: string[],
  text: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < chatIds.length; i += 20) {
    const batch = chatIds.slice(i, i + 20);
    const results = await Promise.all(batch.map((id) => sendTelegram(id, text)));

    for (const r of results) r.ok ? (sent += 1) : (failed += 1);

    if (i + 20 < chatIds.length) await new Promise((r) => setTimeout(r, 1200));
  }

  return { sent, failed };
}

/**
 * 봇에게 말을 건 사람들의 chat_id 를 받아 온다.
 *
 * 회원이 봇에서 /start 를 누르면 그 기록이 여기 쌓인다.
 * 이름(또는 전화번호 뒷자리)으로 우리 회원과 맞춰 연결하는 데 쓴다.
 */
export interface TelegramContact {
  chatId: string;
  username: string | null;
  firstName: string;
  text: string;
}

export async function fetchTelegramContacts(): Promise<TelegramContact[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(`${API}${token}/getUpdates?limit=100`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      result?: { message?: { chat?: { id: number; username?: string; first_name?: string }; text?: string } }[];
    };

    if (!data.ok || !data.result) return [];

    const found = new Map<string, TelegramContact>();
    for (const update of data.result) {
      const chat = update.message?.chat;
      if (!chat) continue;

      found.set(String(chat.id), {
        chatId: String(chat.id),
        username: chat.username ?? null,
        firstName: chat.first_name ?? "",
        text: update.message?.text ?? "",
      });
    }

    return [...found.values()];
  } catch {
    return [];
  }
}
