"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClockIcon, PinIcon } from "@/components/common/Icons";
import type { Post } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  /** 연도별 행사. 서버에서 미리 묶어서 넘긴다. */
  eventsByYear: Record<number, Post[]>;
  years: number[];
  /** 오늘 날짜(YYYY-MM-DD). 서버에서 계산해 넘겨 하이드레이션 불일치를 막는다. */
  todayKey: string;
}

/**
 * 협회 연간일정 — 달력 형식.
 *
 * 처음에는 오늘이 속한 달을 보여준다.
 * 일정이 있는 날은 강조하고, 오른쪽에 그 달의 일정을 나열한다.
 * 날짜가 아직 안 정해진 행사는 달력에 찍지 않고 "○월 중"으로 목록에만 넣는다.
 */
export default function EventCalendar({ eventsByYear, years, todayKey }: Props) {
  const [y, m, d] = todayKey.split("-").map(Number);
  const [cursor, setCursor] = useState({ year: y, month: m });

  const events = useMemo(() => eventsByYear[cursor.year] ?? [], [eventsByYear, cursor.year]);

  /** 이번 달 행사 (날짜 확정 + 미정 모두) */
  const monthEvents = useMemo(
    () =>
      events
        .filter((e) => Number((e.startDate ?? e.date).slice(5, 7)) === cursor.month)
        .sort((a, b) => {
          // 날짜 미정은 아래로 내린다
          if (a.dateTbd !== b.dateTbd) return a.dateTbd ? 1 : -1;
          return (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date);
        }),
    [events, cursor.month],
  );

  /** 날짜 → 그날 행사들 (미정 제외) */
  const byDay = useMemo(() => {
    const map = new Map<number, Post[]>();
    for (const e of monthEvents) {
      if (e.dateTbd) continue;
      const day = Number((e.startDate ?? e.date).slice(8, 10));
      map.set(day, [...(map.get(day) ?? []), e]);
    }
    return map;
  }, [monthEvents]);

  const first = new Date(cursor.year, cursor.month - 1, 1);
  const daysInMonth = new Date(cursor.year, cursor.month, 0).getDate();
  const leading = first.getDay();
  const cells: (number | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) => cursor.year === y && cursor.month === m && day === d;

  const move = (delta: number) => {
    const next = new Date(cursor.year, cursor.month - 1 + delta, 1);
    const year = next.getFullYear();
    if (!years.includes(year) && !eventsByYear[year]) {
      // 데이터가 없는 연도로는 넘어가지 않는다
      if (year < Math.min(...years) || year > Math.max(...years)) return;
    }
    setCursor({ year, month: next.getMonth() + 1 });
  };

  const goToday = () => setCursor({ year: y, month: m });

  return (
    <section className="px-5 py-10 md:py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="text-[21px] font-bold tracking-[-0.02em] md:text-[24px]">
            협회 연간일정
          </h2>
          <p className="text-[14px] text-muted">
            한 해 동안 예정된 협회 행사를 미리 확인하실 수 있습니다.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {/* 달력 */}
          <div className="rounded-2xl border border-line bg-white p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="이전 달"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line transition-colors hover:border-brand hover:text-brand"
              >
                ‹
              </button>

              <p className="tnum text-[17px] font-bold">
                {cursor.year}년 {cursor.month}월
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold transition-colors hover:border-brand hover:text-brand"
                >
                  오늘
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="다음 달"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line transition-colors hover:border-brand hover:text-brand"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={`pb-2 text-[12px] font-bold ${
                    i === 0 ? "text-coral" : i === 6 ? "text-sky" : "text-muted"
                  }`}
                >
                  {w}
                </div>
              ))}

              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;

                const dayEvents = byDay.get(day) ?? [];
                const has = dayEvents.length > 0;
                const today = isToday(day);
                const weekday = i % 7;

                return (
                  <div
                    key={day}
                    className={`relative aspect-square rounded-lg p-1 ${
                      today
                        ? "bg-brand text-white"
                        : has
                          ? "bg-brand-tint"
                          : "hover:bg-mist"
                    }`}
                    title={has ? dayEvents.map((e) => e.title).join(", ") : undefined}
                  >
                    <span
                      className={`tnum block pt-1 text-[13px] font-semibold ${
                        today
                          ? "text-white"
                          : weekday === 0
                            ? "text-coral"
                            : weekday === 6
                              ? "text-sky"
                              : "text-ink"
                      }`}
                    >
                      {day}
                    </span>

                    {has && (
                      <span
                        aria-hidden
                        className={`absolute bottom-1.5 left-1/2 block h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                          today ? "bg-white" : "bg-brand"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[12px] text-muted">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="block h-3 w-3 rounded bg-brand" /> 오늘
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="block h-3 w-3 rounded bg-brand-tint" /> 행사 있는 날
              </span>
            </p>
          </div>

          {/* 그 달의 일정 */}
          <div className="rounded-2xl border border-line bg-mist p-4 md:p-5">
            <h3 className="tnum text-[15px] font-bold">
              {cursor.month}월 일정
              <span className="ml-2 text-[13px] font-semibold text-muted">
                {monthEvents.length}건
              </span>
            </h3>

            {monthEvents.length === 0 ? (
              <p className="mt-8 text-center text-[13.5px] text-muted">
                이 달에는 등록된 일정이 없습니다.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {monthEvents.map((e) => {
                  const key = e.startDate ?? e.date;
                  const past = !e.dateTbd && key < todayKey;

                  return (
                    <li key={e.id}>
                      <Link
                        href={`/activities/${e.slug}`}
                        className={`group flex gap-3 rounded-xl bg-white p-3 transition-shadow hover:shadow-[0_4px_16px_rgba(22,36,31,0.08)] ${
                          past ? "opacity-55" : ""
                        }`}
                      >
                        <span
                          className={`grid h-12 w-12 shrink-0 place-content-center rounded-lg text-center ${
                            e.dateTbd
                              ? "bg-amber-tint text-amber"
                              : past
                                ? "bg-mist text-muted"
                                : "bg-brand-tint text-brand-deep"
                          }`}
                        >
                          {e.dateTbd ? (
                            <span className="text-[11px] font-bold leading-tight">
                              미정
                            </span>
                          ) : (
                            <>
                              <span className="tnum block text-[9.5px] font-semibold">
                                {Number(key.slice(5, 7))}월
                              </span>
                              <span className="tnum block text-[17px] font-bold leading-none">
                                {Number(key.slice(8, 10))}
                              </span>
                            </>
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-bold transition-colors group-hover:text-brand">
                            {e.title}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted">
                            {e.dateTbd ? (
                              <span className="font-semibold text-amber">
                                {cursor.month}월 중 · 일정 확정 후 안내
                              </span>
                            ) : (
                              e.time && (
                                <span className="tnum flex items-center gap-1">
                                  <ClockIcon className="h-[12px] w-[12px] shrink-0" />
                                  {e.time}
                                </span>
                              )
                            )}
                            {e.place && (
                              <span className="flex items-center gap-1 truncate">
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
        </div>
      </div>
    </section>
  );
}
