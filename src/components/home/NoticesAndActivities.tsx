import Link from "next/link";
import Badge from "@/components/common/Badge";
import SectionHead from "@/components/common/SectionHead";
import type { Post } from "@/lib/types";

const formatDate = (iso: string) => iso.replace(/-/g, ".");

/**
 * 공지사항(좌) + 최근 활동(우) — 시안 기준.
 * 공지사항을 메인 하단 구석에 숨기지 않는다 (기획안 33조).
 */
export default function NoticesAndActivities({
  notices,
  activities,
}: {
  notices: Post[];
  activities: Post[];
}) {
  if (notices.length === 0 && activities.length === 0) return null;

  return (
    <section className="px-5 py-8 md:py-10">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-12">
        {/* 공지사항 */}
        <div>
          <SectionHead title="공지사항" moreHref="/activities" />

          <ul className="mt-5">
            {notices.map((n) => (
              <li key={n.id} className="border-b border-line first:border-t">
                <Link
                  href={`/activities/${n.slug}`}
                  className="group flex items-center gap-3 py-3.5"
                >
                  <Badge label={n.category ?? "공지"} />
                  <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink transition-colors group-hover:text-brand">
                    {n.title}
                  </span>
                  <span className="tnum shrink-0 text-[12.5px] text-muted">
                    {formatDate(n.date)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 최근 활동 */}
        <div>
          <SectionHead title="최근 활동" moreHref="/activities" />

          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {activities.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/activities/${a.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.08)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {a.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.coverImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div aria-hidden className="ph h-full w-full" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    {a.category && <Badge label={a.category} className="self-start" />}
                    <h3 className="mt-2.5 text-[15.5px] font-bold leading-snug transition-colors group-hover:text-brand">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-muted">
                      {a.summary}
                    </p>
                    <p className="tnum mt-auto pt-3 text-[12.5px] text-muted">
                      {formatDate(a.date)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
