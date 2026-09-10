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
                {/* 좁은 화면에서는 제목을 두 줄까지 쓰고 날짜를 아래로 내린다.
                    한 줄로 밀어 넣으면 제목이 거의 다 잘려 무슨 공지인지 알 수 없다. */}
                <Link
                  href={`/activities/${n.slug}`}
                  className="group block py-3.5 sm:flex sm:items-center sm:gap-3"
                >
                  <span className="flex items-start gap-2 sm:contents">
                    <Badge label={n.category ?? "공지"} className="mt-0.5 sm:mt-0" />
                    <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand sm:truncate sm:text-[14.5px]">
                      {n.title}
                    </span>
                  </span>
                  <span className="tnum mt-1.5 block pl-[52px] text-[12px] text-muted sm:mt-0 sm:block sm:shrink-0 sm:pl-0 sm:text-[12.5px]">
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

          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {activities.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/activities/${a.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.08)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
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

                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    {a.category && (
                      <Badge label={a.category} className="hidden self-start sm:inline-flex" />
                    )}
                    <h3 className="line-clamp-2 text-[13.5px] font-bold leading-snug transition-colors group-hover:text-brand sm:mt-2.5 sm:text-[15.5px]">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 hidden text-[13px] leading-[1.6] text-muted sm:block">
                      {a.summary}
                    </p>
                    <p className="tnum mt-auto pt-2 text-[11.5px] text-muted sm:pt-3 sm:text-[12.5px]">
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
