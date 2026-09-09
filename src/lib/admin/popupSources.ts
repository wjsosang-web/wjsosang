import { listPosts } from "@/lib/admin/queries";
import { toDateKey } from "@/lib/date";
import type { PopupSource } from "@/components/admin/PopupForm";

/**
 * 팝업으로 바로 띄울 수 있는 글 목록.
 *
 * 앞으로 열릴 행사를 먼저 보여주고, 그다음 최근 공지·활동 순으로 담는다.
 * 지난 행사를 팝업으로 띄울 일은 거의 없어서 넣지 않는다.
 */
export async function listPopupSources(now = new Date()): Promise<PopupSource[]> {
  const today = toDateKey(now);
  const posts = await listPosts();

  const upcomingEvents = posts
    .filter((p) => p.type === "event" && p.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const recentPosts = posts
    .filter((p) => p.type !== "event")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);

  return [...upcomingEvents, ...recentPosts].map((p) => ({
    id: p.id,
    type: p.type,
    title: p.title,
    slug: p.slug,
    date: p.date,
    place: p.place ?? null,
    time: p.time ?? null,
    summary: p.summary ?? "",
  }));
}
