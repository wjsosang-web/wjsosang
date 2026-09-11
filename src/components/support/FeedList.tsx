"use client";

import { useMemo, useState } from "react";
import { SOURCE_LABEL, SOURCE_TAG, type FeedItem, type FeedSource } from "@/lib/feeds/types";

/**
 * 지원사업·교육·행사 목록.
 *
 * 회원이 제일 먼저 보고 싶은 것은 "며칠 남았나" 다.
 * 그래서 남은 날짜를 제목 옆에 크게 두고, 사흘 이하면 색을 바꾼다.
 */

const SOURCES = Object.keys(SOURCE_LABEL) as FeedSource[];

/** 오늘(한국 시간) 기준 남은 날 수. 마감일이 없으면 null. */
function daysLeft(endsOn: string | null): number | null {
  if (!endsOn) return null;

  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate());
  const [y, m, d] = endsOn.split("-").map(Number);
  if (!y || !m || !d) return null;

  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}

export default function FeedList({ items }: { items: FeedItem[] }) {
  const [source, setSource] = useState<FeedSource | "all">("all");

  const shown = useMemo(
    () => (source === "all" ? items : items.filter((i) => i.source === source)),
    [items, source],
  );

  return (
    <section className="px-5 py-10 md:py-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="text-[21px] font-bold tracking-[-0.02em] md:text-[24px]">
            지금 신청할 수 있는 소식
          </h2>
          <p className="text-[13.5px] text-muted">
            마감이 가까운 것부터 보여 드립니다. 마감이 지난 공고는 자동으로 내려갑니다.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip active={source === "all"} onClick={() => setSource("all")}>
            전체 {items.length}
          </Chip>
          {SOURCES.map((s) => {
            const count = items.filter((i) => i.source === s).length;
            if (count === 0) return null;
            return (
              <Chip key={s} active={source === s} onClick={() => setSource(s)}>
                {SOURCE_LABEL[s]} {count}
              </Chip>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-mist px-6 py-16 text-center">
            <p className="text-[15px] font-bold">지금은 올라온 소식이 없습니다.</p>
            <p className="mt-2 text-[14px] leading-[1.8] text-muted">
              새 공고는 매일 아침에 모입니다. 협회 텔레그램을 등록해 두시면
              <br />
              올라오는 즉시 알림으로 받아보실 수 있습니다.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-2.5">
            {shown.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Card({ item }: { item: FeedItem }) {
  const left = daysLeft(item.endsOn);
  const urgent = left !== null && left <= 3;

  return (
    <li>
      <a
        href={item.link || "#"}
        target="_blank"
        rel="noreferrer"
        className="group flex gap-4 rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.08)] md:p-5"
      >
        {/* 남은 날짜 */}
        <div
          className={`grid w-[68px] shrink-0 place-items-center rounded-xl px-2 py-3 text-center ${
            left === null
              ? "bg-mist text-muted"
              : urgent
                ? "bg-coral text-white"
                : "bg-brand-tint text-brand-deep"
          }`}
        >
          {left === null ? (
            <span className="text-[12px] font-bold leading-tight">상시</span>
          ) : (
            <span className="leading-tight">
              <span className="block text-[10.5px] font-bold opacity-80">마감</span>
              <span className="tnum block text-[20px] font-bold">
                {left <= 0 ? "오늘" : `D-${left}`}
              </span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-bold">
            <span className="rounded bg-mist px-2 py-1 text-ink-soft">
              {SOURCE_TAG[item.source]}
            </span>
            {item.organizer && <span className="text-muted">{item.organizer}</span>}
          </p>

          <h3 className="mt-1.5 text-[15.5px] font-bold leading-snug tracking-[-0.01em] transition-colors group-hover:text-brand md:text-[16.5px]">
            {item.title}
          </h3>

          {item.summary && (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.7] text-ink-soft">
              {item.summary}
            </p>
          )}

          {(item.startsOn || item.endsOn) && (
            <p className="tnum mt-2 text-[12.5px] text-muted">
              신청 {item.startsOn ?? ""} ~ {item.endsOn ?? ""}
            </p>
          )}
        </div>

        <span
          aria-hidden
          className="hidden shrink-0 self-center text-[18px] text-muted transition-colors group-hover:text-brand sm:block"
        >
          ↗
        </span>
      </a>
    </li>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        active ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-line hover:ring-brand/50"
      }`}
    >
      {children}
    </button>
  );
}
