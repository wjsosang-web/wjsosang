"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PopupNotice } from "@/lib/types";

const dismissKey = (id: string) => `wjsosang:popup:${id}`;

/**
 * 메인 팝업 공지.
 * 내용·기간·공개여부는 전부 관리자 데이터에서 온다.
 * "오늘 하루 보지 않기"는 브라우저 localStorage 에만 저장한다(개인 편의값).
 */
export default function SitePopup({ popups }: { popups: PopupNotice[] }) {
  // 서버 렌더 시점에는 아무것도 그리지 않는다. localStorage 를 읽어야 하기 때문.
  const [visible, setVisible] = useState<PopupNotice[]>([]);

  useEffect(() => {
    const today = new Date().toDateString();
    const remaining = popups.filter((p) => {
      try {
        return window.localStorage.getItem(dismissKey(p.id)) !== today;
      } catch {
        // 사생활 보호 모드 등에서 접근이 막히면 그냥 보여준다.
        return true;
      }
    });
    setVisible(remaining);
  }, [popups]);

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
  const popup = visible[0];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-forest/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl">
        {popup.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div aria-hidden className="ph aspect-[16/7] w-full" />
        )}

        <div className="p-6">
          <h2 id="popup-title" className="text-[19px] font-bold tracking-tight">
            {popup.title}
          </h2>
          {popup.body && (
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{popup.body}</p>
          )}

          {popup.linkUrl && (
            <Link
              href={popup.linkUrl}
              onClick={() => close(popup.id, false)}
              className="mt-5 block bg-brand py-3.5 text-center text-[15px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              {popup.linkLabel ?? "자세히 보기"}
            </Link>
          )}
        </div>

        <div className="flex border-t border-line text-[14px]">
          <button
            type="button"
            onClick={() => close(popup.id, true)}
            className="flex-1 py-3.5 font-medium text-muted transition-colors hover:bg-mist"
          >
            오늘 하루 보지 않기
          </button>
          <span className="w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={() => close(popup.id, false)}
            className="flex-1 py-3.5 font-bold text-ink transition-colors hover:bg-mist"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
