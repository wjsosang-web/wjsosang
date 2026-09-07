"use client";

import Link from "next/link";
import { useState } from "react";
import Badge from "@/components/common/Badge";
import SectionHead from "@/components/common/SectionHead";
import { CameraIcon, PinIcon } from "@/components/common/Icons";
import type { Post } from "@/lib/types";

const formatDate = (iso: string) => iso.replace(/-/g, ".");

const TABS = ["전체", "공지사항", "협회활동", "행사"] as const;
type Tab = (typeof TABS)[number];

/**
 * 협회활동 — 공지사항 / 활동소식 / 행사를 한 메뉴 안에서 탭으로 본다 (기획안 27조).
 * 갤러리를 별도 메뉴로 만들지 않는다. 사진은 활동 게시글에 딸린다.
 */
export default function ActivityTabs({
  notices,
  activities,
  events,
  year,
}: {
  notices: Post[];
  activities: Post[];
  events: Post[];
  year: number;
}) {
  const [tab, setTab] = useState<Tab>("전체");

  // 전체 탭에서는 대표 활동 하나를 크게 보여준다.
  const featured = activities[0] ?? null;
  const rest = activities.slice(1);

  return (
    <>
      {/* 탭 */}
      <div className="px-5">
        <div
          role="tablist"
          aria-label="협회활동 분류"
          className="mx-auto grid max-w-[1180px] grid-cols-4 gap-1 rounded-xl bg-mist p-1.5"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-lg py-3 text-[14px] font-bold transition-colors md:text-[15px] ${
                tab === t ? "bg-brand text-white" : "text-ink-soft hover:bg-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 전체 — 공지 + 주요활동 */}
      {tab === "전체" && (
        <section className="px-5 pt-10">
          <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-10">
            <div>
              <SectionHead title="공지사항" moreHref="#" moreLabel="더보기" />
              <ul className="mt-5">
                {notices.slice(0, 5).map((n) => (
                  <li key={n.id} className="border-b border-line first:border-t">
                    <Link
                      href={`/activities/${n.slug}`}
                      className="group flex items-center gap-3 py-3.5"
                    >
                      <Badge label={n.category ?? "공지"} />
                      <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold transition-colors group-hover:text-brand">
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

            {featured && (
              <Link
                href={`/activities/${featured.slug}`}
                className="group block overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.08)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  {featured.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div aria-hidden className="ph h-full w-full" />
                  )}
                  <Badge label="주요활동" className="absolute left-3 top-3" />
                </div>

                <div className="p-5">
                  <h3 className="text-[17px] font-bold leading-snug transition-colors group-hover:text-brand md:text-[19px]">
                    {featured.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-3 text-[13.5px] leading-[1.7] text-muted">
                    {featured.summary}
                  </p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
                    <span className="tnum">{formatDate(featured.date)}</span>
                    {featured.place && (
                      <span className="flex items-center gap-1">
                        <PinIcon className="h-[13px] w-[13px] shrink-0" />
                        {featured.place}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* 공지사항 탭 — 전체 목록 */}
      {tab === "공지사항" && (
        <section className="px-5 pt-10">
          <div className="mx-auto max-w-[1180px]">
            <SectionHead title="공지사항" description="협회의 소식과 안내를 확인하세요." />
            <ul className="mt-5">
              {notices.map((n) => (
                <li key={n.id} className="border-b border-line first:border-t">
                  <Link
                    href={`/activities/${n.slug}`}
                    className="group flex items-center gap-3 py-4"
                  >
                    <Badge label={n.category ?? "공지"} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold transition-colors group-hover:text-brand">
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
        </section>
      )}

      {/* 활동 카드 — 전체 / 협회활동 탭 */}
      {(tab === "전체" || tab === "협회활동") && (
        <section className="px-5 pt-12">
          <div className="mx-auto max-w-[1180px]">
            <SectionHead
              title="협회활동 이야기"
              description="원주청년소상공인협회의 다양한 활동 소식을 만나보세요."
            />
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(tab === "전체" ? rest : activities).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/activities/${a.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.08)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
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
                      {a.category && (
                        <Badge label={a.category} className="absolute left-3 top-3 bg-white/95" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <p className="tnum text-[12.5px] text-muted">{formatDate(a.date)}</p>
                      <h3 className="mt-2 text-[15.5px] font-bold leading-snug transition-colors group-hover:text-brand">
                        {a.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-muted">
                        {a.summary}
                      </p>
                      {a.photos.length > 0 && (
                        <p className="mt-auto flex items-center gap-1.5 pt-3 text-[12px] font-semibold text-muted">
                          <CameraIcon className="h-[14px] w-[14px] shrink-0" />
                          사진 {a.photos.length}장
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 행사 탭 */}
      {tab === "행사" && (
        <section className="px-5 pt-10">
          <div className="mx-auto max-w-[1180px]">
            <SectionHead title={`${year}년 행사`} description="한 해의 협회 행사 일정입니다." />
            <ul className="mt-5 overflow-hidden rounded-xl border border-line">
              {events.map((e, i) => (
                <li key={e.id} className={i > 0 ? "border-t border-line" : ""}>
                  <Link
                    href={`/activities/${e.slug}`}
                    className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-mist md:px-6"
                  >
                    <span className="grid h-14 w-14 shrink-0 place-content-center rounded-xl bg-brand-tint text-center text-brand-deep">
                      <span className="tnum block text-[10.5px] font-semibold">
                        {Number((e.startDate ?? e.date).slice(5, 7))}월
                      </span>
                      <span className="tnum block text-[20px] font-bold leading-none">
                        {Number((e.startDate ?? e.date).slice(8, 10))}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-bold transition-colors group-hover:text-brand">
                        {e.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
                        {e.time && <span className="tnum">{e.time}</span>}
                        {e.place && (
                          <span className="flex items-center gap-1">
                            <PinIcon className="h-[12px] w-[12px] shrink-0" />
                            {e.place}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
