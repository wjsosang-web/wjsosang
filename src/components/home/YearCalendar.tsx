"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SectionHead from "@/components/common/SectionHead";
import { PinIcon } from "@/components/common/Icons";
import type { Post } from "@/lib/types";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

interface Props {
  /** 연도별 행사 목록. 서버에서 미리 묶어서 넘긴다. */
  eventsByYear: Record<number, Post[]>;
  years: number[];
  initialYear: number;
  /** 오늘 날짜(YYYY-MM-DD). 서버에서 계산해 넘겨 하이드레이션 불일치를 막는다. */
  todayKey: string;
}

/**
 * 협회 연간일정 — 1년치 행사를 한 화면에서 본다.
 * 월을 고르면 해당 월 일정만, 아무것도 안 고르면 그 해 전체를 보여준다.
 */
export default function YearCalendar({
  eventsByYear,
  years,
  initialYear,
  todayKey,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState<number | null>(null);

  const events = useMemo(() => eventsByYear[year] ?? [], [eventsByYear, year]);

  const countByMonth = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const e of events) {
      const m = Number((e.startDate ?? e.date).slice(5, 7));
      counts[m] = (counts[m] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  const listed = month
    ? events.filter((e) => Number((e.startDate ?? e.date).slice(5, 7)) === month)
    : events;

  const isPast = (e: Post) => (e.endDate ?? e.startDate ?? e.date) < todayKey;

  return (
    <section className="px-5 py-10 md:py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <SectionHead
            title="협회 연간일정"
            description="한 해 동안 예정된 협회 행사를 미리 확인하실 수 있습니다."
          />

          {years.length > 1 && (
            <div className="flex gap-1.5">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setYear(y);
                    setMonth(null);
                  }}
                  aria-pressed={y === year}
                  className={`tnum rounded-lg px-4 py-2 text-[13.5px] font-bold transition-colors ${
                    y === year
                      ? "bg-brand text-white"
                      : "border border-line text-muted hover:border-line-strong"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 12개월 */}
        <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
          {MONTHS.map((m) => {
            const count = countByMonth[m] ?? 0;
            const selected = month === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMonth(selected ? null : m)}
                aria-pressed={selected}
                aria-label={`${year}년 ${m}월 일정 ${count}건`}
                className={`rounded-xl border py-3 text-center transition-colors ${
                  selected
                    ? "border-brand bg-brand text-white"
                    : count > 0
                      ? "border-brand/25 bg-brand-tint-2 text-ink hover:border-brand"
                      : "border-line bg-white text-muted"
                }`}
              >
                <span className="tnum block text-[15px] font-bold leading-none">{m}</span>
                <span
                  className={`tnum mt-1.5 block text-[11px] font-semibold ${
                    selected ? "text-white/80" : count > 0 ? "text-brand" : "text-muted/50"
                  }`}
                >
                  {count > 0 ? `${count}건` : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* 일정 목록 */}
        {listed.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-line py-14 text-center text-[14.5px] text-muted">
            {month ? `${month}월에 등록된 일정이 없습니다.` : "등록된 일정이 없습니다."}
          </p>
        ) : (
          <ul className="mt-6 overflow-hidden rounded-xl border border-line">
            {listed.map((e, i) => {
              const key = e.startDate ?? e.date;
              const past = isPast(e);
              return (
                <li key={e.id} className={i > 0 ? "border-t border-line" : ""}>
                  <Link
                    href={`/activities/${e.slug}`}
                    className={`group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-mist md:gap-6 md:px-6 ${
                      past ? "opacity-55" : ""
                    }`}
                  >
                    <span
                      className={`grid h-14 w-14 shrink-0 place-content-center rounded-xl text-center ${
                        past ? "bg-mist text-muted" : "bg-brand-tint text-brand-deep"
                      }`}
                    >
                      <span className="tnum block text-[10.5px] font-semibold">
                        {Number(key.slice(5, 7))}월
                      </span>
                      <span className="tnum block text-[20px] font-bold leading-none">
                        {Number(key.slice(8, 10))}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15.5px] font-bold transition-colors group-hover:text-brand">
                          {e.title}
                        </span>
                        {past && (
                          <span className="shrink-0 rounded bg-mist px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                            종료
                          </span>
                        )}
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
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
