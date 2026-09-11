/**
 * 모아 둔 소식 읽기.
 *
 * 목록은 늘 "아직 신청할 수 있는 것" 이 먼저다.
 * 마감이 지난 공고를 위에 두면 목록을 열자마자 쓸모없는 글부터 보게 된다.
 */

import { getAdminSupabase } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/date";
import type { FeedItem, FeedSource } from "@/lib/feeds/types";

type Row = Record<string, unknown>;

function toItem(r: Row): FeedItem {
  return {
    id: r.id as string,
    source: r.source as FeedSource,
    externalId: r.external_id as string,
    title: r.title as string,
    summary: (r.summary as string) ?? "",
    link: (r.link as string) ?? "",
    organizer: (r.organizer as string | null) ?? null,
    category: (r.category as string | null) ?? null,
    startsOn: (r.starts_on as string | null) ?? null,
    endsOn: (r.ends_on as string | null) ?? null,
    publishedOn: (r.published_on as string | null) ?? null,
    notifiedAt: (r.notified_at as string | null) ?? null,
    hidden: Boolean(r.hidden),
  };
}

/** 마감이 지났는지. 마감일이 없는 공고는 지나지 않은 것으로 본다. */
export function isClosed(item: FeedItem, today = toDateKey(new Date())): boolean {
  return Boolean(item.endsOn) && item.endsOn! < today;
}

export interface FeedQuery {
  source?: FeedSource;
  /** 마감이 지난 것도 포함할지 */
  includeClosed?: boolean;
  limit?: number;
  /** 관리자 화면에서는 감춘 것도 봐야 한다 */
  includeHidden?: boolean;
}

export async function getFeedItems(query: FeedQuery = {}): Promise<FeedItem[]> {
  const { source, includeClosed = false, limit = 60, includeHidden = false } = query;

  try {
    let q = getAdminSupabase().from("feed_items").select("*");

    if (source) q = q.eq("source", source);
    if (!includeHidden) q = q.eq("hidden", false);

    const { data, error } = await q
      .order("published_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit * 3);

    if (error || !data) return [];

    const today = toDateKey(new Date());
    const items = data.map(toItem);
    const open = includeClosed ? items : items.filter((i) => !isClosed(i, today));

    // 마감이 임박한 것부터. 마감일이 없는 것은 뒤로 보낸다.
    return open
      .sort((a, b) => {
        if (a.endsOn && b.endsOn) return a.endsOn.localeCompare(b.endsOn);
        if (a.endsOn) return -1;
        if (b.endsOn) return 1;
        return (b.publishedOn ?? "").localeCompare(a.publishedOn ?? "");
      })
      .slice(0, limit);
  } catch {
    // 표가 아직 만들어지지 않았을 수 있다. 그때는 빈 목록으로 둔다.
    return [];
  }
}

/** 메인 화면에 몇 건만 미리 보여줄 때 */
export async function getOpenFeedCount(): Promise<number> {
  const items = await getFeedItems({ limit: 200 });
  return items.length;
}
