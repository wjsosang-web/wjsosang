/**
 * 소식 모으기 → 처음 보는 것만 알리기.
 *
 * 하루 한 번 도는 일이다.
 *   1. 출처마다 최근 공고를 받아 온다
 *   2. 이미 담아 둔 것은 버리고, 처음 보는 것만 저장한다
 *   3. 저장된 것 중 아직 안 보낸 것을 텔레그램으로 보낸다
 *
 * 2번과 3번을 나눈 이유가 있다. 저장까지만 해두면 회원이 홈페이지에서
 * 언제든 볼 수 있고, 알림은 나중에 사람이 눌러서 보낼 수도 있다.
 * 자동 발송을 꺼 두어도 목록은 계속 쌓인다.
 *
 * 한 출처가 실패해도 나머지는 계속한다. 기업마당이 점검 중이라고
 * 행사 소식까지 못 받을 이유는 없다.
 */

import { getAdminSupabase } from "@/lib/supabase/server";
import { broadcastTelegram, hasTelegram } from "@/lib/telegram";
import { fetchBizinfo } from "@/lib/feeds/bizinfo";
import { fetchFestivals } from "@/lib/feeds/festival";
import { fetchSemasEdu } from "@/lib/feeds/semasEdu";
import { SOURCE_TAG, type FeedDraft, type FeedSource } from "@/lib/feeds/types";

export interface CollectReport {
  /** 출처별로 새로 담은 개수, 또는 실패 사유 */
  perSource: { source: FeedSource; added: number; error?: string }[];
  added: number;
  notified: number;
  /** 알림을 받은 회원 수 */
  receivers: number;
  message: string;
}

const FETCHERS: Record<FeedSource, () => Promise<FeedDraft[]>> = {
  bizinfo: () => fetchBizinfo(),
  semas_edu: fetchSemasEdu,
  festival: () => fetchFestivals(),
};

/** 관리자가 꺼 둔 출처는 건너뛴다 */
export type SourceSwitches = Partial<Record<FeedSource, boolean>>;

async function saveNew(drafts: FeedDraft[]): Promise<number> {
  if (drafts.length === 0) return 0;

  const db = getAdminSupabase();

  // 이미 담아 둔 것을 먼저 확인한다. upsert 로 덮어쓰면 notified_at 이 지워져서
  // 같은 공고를 또 보내게 된다.
  const { data: existing } = await db
    .from("feed_items")
    .select("external_id")
    .eq("source", drafts[0].source)
    .in(
      "external_id",
      drafts.map((d) => d.externalId),
    );

  const known = new Set((existing ?? []).map((r) => r.external_id as string));
  const fresh = drafts.filter((d) => !known.has(d.externalId));

  if (fresh.length === 0) return 0;

  const { error } = await db.from("feed_items").insert(
    fresh.map((d) => ({
      source: d.source,
      external_id: d.externalId,
      title: d.title,
      summary: d.summary,
      link: d.link,
      organizer: d.organizer,
      category: d.category,
      starts_on: d.startsOn,
      ends_on: d.endsOn,
      published_on: d.publishedOn,
    })),
  );

  if (error) throw new Error(error.message);
  return fresh.length;
}

/** 텔레그램 한 통에 담을 글 */
function formatItem(row: Record<string, unknown>): string {
  const tag = SOURCE_TAG[row.source as FeedSource] ?? "📢 소식";
  const lines = [`${tag}`, `<b>${row.title as string}</b>`];

  if (row.organizer) lines.push(`주관 ${row.organizer as string}`);

  const from = row.starts_on as string | null;
  const to = row.ends_on as string | null;
  if (from || to) lines.push(`기간 ${from ?? ""} ~ ${to ?? ""}`.trim());

  const summary = (row.summary as string) ?? "";
  if (summary) lines.push("", summary.slice(0, 200));

  if (row.link) lines.push("", row.link as string);

  return lines.join("\n");
}

/**
 * 아직 안 보낸 소식을 회원들에게 보낸다.
 *
 * 한 번에 다섯 건까지만 보낸다. 처음 켰을 때 백 건이 한꺼번에 날아가면
 * 회원들이 봇을 차단한다. 나머지는 다음 차례에 나간다.
 */
export async function notifyPending(limit = 5): Promise<{ notified: number; receivers: number }> {
  if (!hasTelegram()) return { notified: 0, receivers: 0 };

  const db = getAdminSupabase();

  const { data: pending } = await db
    .from("feed_items")
    .select("*")
    .is("notified_at", null)
    .eq("hidden", false)
    .order("published_on", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!pending || pending.length === 0) return { notified: 0, receivers: 0 };

  const { data: members } = await db
    .from("members")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null);

  const chatIds = [...new Set((members ?? []).map((m) => m.telegram_chat_id as string))];

  // 받을 사람이 없어도 보낸 것으로 표시한다. 그러지 않으면 회원이 늘어난 날
  // 그동안 쌓인 옛날 공고가 한꺼번에 날아간다.
  const now = new Date().toISOString();

  for (const row of pending) {
    if (chatIds.length > 0) await broadcastTelegram(chatIds, formatItem(row));
    await db.from("feed_items").update({ notified_at: now }).eq("id", row.id as string);
  }

  return { notified: pending.length, receivers: chatIds.length };
}

export async function collectFeeds(
  switches: SourceSwitches = {},
  options: { notify?: boolean; notifyLimit?: number } = {},
): Promise<CollectReport> {
  const perSource: CollectReport["perSource"] = [];
  let added = 0;

  for (const source of Object.keys(FETCHERS) as FeedSource[]) {
    if (switches[source] === false) continue;

    try {
      const drafts = await FETCHERS[source]();
      const count = await saveNew(drafts);
      added += count;
      perSource.push({ source, added: count });
    } catch (e) {
      perSource.push({
        source,
        added: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const sent =
    options.notify === false
      ? { notified: 0, receivers: 0 }
      : await notifyPending(options.notifyLimit ?? 5);

  const failed = perSource.filter((s) => s.error);

  return {
    perSource,
    added,
    notified: sent.notified,
    receivers: sent.receivers,
    message:
      `새 소식 ${added}건을 담았습니다.` +
      (sent.notified > 0 ? ` ${sent.notified}건을 회원 ${sent.receivers}명에게 보냈습니다.` : "") +
      (failed.length > 0 ? ` (${failed.length}곳은 가져오지 못했습니다)` : ""),
  };
}
