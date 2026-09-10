"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClockIcon, PinIcon } from "@/components/common/Icons";
import type { PopupNotice, Post } from "@/lib/types";

/**
 * 메인 팝업.
 *
 * 두 종류를 같은 모양으로 보여준다.
 *  1. 오늘 행사 알림 — 오늘 날짜에 행사가 있으면 자동으로 뜬다
 *  2. 관리자가 등록한 팝업 공지
 *
 * 오늘 행사가 있으면 그것을 먼저 보여준다.
 * 모든 팝업에 [오늘 하루 보지 않기] 와 [닫기] 두 버튼이 있다.
 * "오늘 하루 보지 않기"는 브라우저 localStorage 에만 저장한다(개인 편의값).
 */

const dismissKey = (id: string) => `wjsosang:popup:${id}`;

interface Item {
  id: string;
  kind: "event" | "notice";
  title: string;
  body: string;
  time: string | null;
  place: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
}

export default function SitePopup({
  popups,
  todayEvents = [],
}: {
  popups: PopupNotice[];
  /** 오늘 열리는 행사. 있으면 가장 먼저 보여준다. */
  todayEvents?: Post[];
}) {
  const [visible, setVisible] = useState<Item[]>([]);

  useEffect(() => {
    const items: Item[] = [
      ...todayEvents.map((e) => ({
        id: `event-${e.id}`,
        kind: "event" as const,
        title: e.title,
        body: e.summary || e.body,
        time: e.time,
        place: e.place,
        imageUrl: e.coverImage,
        linkUrl: `/activities/${e.slug}`,
        linkLabel: "행사 자세히 보기",
      })),
      ...popups.map((p) => ({
        id: p.id,
        kind: "notice" as const,
        title: p.title,
        body: p.body,
        time: null,
        place: null,
        imageUrl: p.imageUrl,
        linkUrl: p.linkUrl,
        linkLabel: p.linkLabel,
      })),
    ];

    const today = new Date().toDateString();
    setVisible(
      items.filter((item) => {
        try {
          return window.localStorage.getItem(dismissKey(item.id)) !== today;
        } catch {
          // 사생활 보호 모드 등에서 접근이 막히면 그냥 보여준다.
          return true;
        }
      }),
    );
  }, [popups, todayEvents]);

  const close = (id: string, forToday: boolean) => {
    if (forToday) {
      try {
        window.localStorage.setItem(dismissKey(id), new Date().toDateString());
      } catch {
        /* 저장이 막혀도 닫기는 동작해야 한다 */
      }
    }
    setVisible((list) => list.filter((p) => p.id !== id));
  };

  // Esc 로 닫기
  useEffect(() => {
    if (visible.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible((list) => list.slice(1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible.length]);

  if (visible.length === 0) return null;
  const item = visible[0];
  const isEvent = item.kind === "event";

  return (
    <div
      // 어두운 바깥을 눌러도 닫힌다.
      // 좁은 화면에서는 팝업이 아래쪽에 붙고 위쪽은 어두운 막이 덮는데,
      // 그 자리가 하필 헤더의 메뉴 버튼 자리다. 닫을 방법이 버튼뿐이면
      // 메뉴가 눌리지 않는 것처럼 보인다.
      onClick={() => close(item.id, false)}
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-hidden bg-forest/60 p-4 pt-[80px] sm:items-center sm:pt-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full w-full max-w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-[400px]"
      >
        {/* 닫는 방법이 눈에 보이게 ✕ 를 둔다 */}
        <button
          type="button"
          onClick={() => close(item.id, false)}
          aria-label="닫기"
          className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-forest/45 text-[14px] text-white backdrop-blur transition-colors hover:bg-forest/70"
        >
          ✕
        </button>

        {isEvent ? (
          <p className="shrink-0 bg-brand px-5 py-2.5 text-[12px] font-bold text-white">
            오늘 열리는 협회 행사입니다
          </p>
        ) : item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          /* 관리자가 자른 그대로 보여준다.
             여기서 비율을 다시 정하면 홍보 이미지가 두 번 잘려서 글자가 날아간다.
             아주 긴 세로 이미지만 화면을 다 먹지 않도록 높이를 제한한다. */
          <img
            src={item.imageUrl}
            alt=""
            className="max-h-[42vh] w-full shrink-0 bg-mist object-contain"
          />
        ) : (
          <div aria-hidden className="ph aspect-[16/7] w-full shrink-0" />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <h2 id="popup-title" className="text-[17.5px] font-bold leading-snug tracking-[-0.02em]">
            {item.title}
          </h2>

          {(item.time || item.place) && (
            <dl className="mt-3 space-y-1.5 rounded-xl bg-mist p-3.5 text-[13px]">
              {item.time && (
                <div className="flex items-center gap-2.5">
                  <dt className="flex w-12 shrink-0 items-center gap-1.5 text-muted">
                    <ClockIcon className="h-[15px] w-[15px] shrink-0 text-brand" />
                    시간
                  </dt>
                  <dd className="tnum font-bold">{item.time}</dd>
                </div>
              )}
              {item.place && (
                <div className="flex items-center gap-2.5">
                  <dt className="flex w-12 shrink-0 items-center gap-1.5 text-muted">
                    <PinIcon className="h-[15px] w-[15px] shrink-0 text-brand" />
                    장소
                  </dt>
                  <dd className="font-bold">{item.place}</dd>
                </div>
              )}
            </dl>
          )}

          {item.body && (
            <p className="mt-3 whitespace-pre-line text-[13px] leading-[1.75] text-ink-soft">
              {item.body}
            </p>
          )}

          {item.linkUrl && (
            <Link
              href={item.linkUrl}
              onClick={() => close(item.id, false)}
              className="mt-4 block rounded-lg bg-brand py-3 text-center text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              {item.linkLabel ?? "자세히 보기"}
            </Link>
          )}
        </div>

        <div className="flex shrink-0 border-t border-line text-[13.5px]">
          <button
            type="button"
            onClick={() => close(item.id, true)}
            className="flex-1 py-3 font-medium text-muted transition-colors hover:bg-mist"
          >
            오늘 하루 보지 않기
          </button>
          <span className="w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={() => close(item.id, false)}
            className="flex-1 py-3 font-bold transition-colors hover:bg-mist"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
