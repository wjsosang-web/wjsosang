"use client";

import { useState } from "react";

/**
 * 공유 버튼.
 *
 * 휴대폰에서는 기기의 공유 기능을 그대로 부른다. 카카오톡·문자·인스타그램이
 * 한 번에 나오므로 카카오 SDK 를 따로 붙이지 않아도 되고, 앱 키를 관리할
 * 일도 없다. 공유했을 때 뜨는 사진과 설명은 각 페이지의 공유 카드 정보를 따른다.
 *
 * 기기 공유 기능이 없는 컴퓨터 브라우저에서는 주소를 복사해 준다.
 */
export default function ShareButton({
  title,
  text,
  className = "",
}: {
  title: string;
  /** 공유창에 함께 담을 한 줄 설명 */
  text?: string;
  className?: string;
}) {
  const [done, setDone] = useState<"copied" | null>(null);

  async function share() {
    const url = window.location.href;

    // 기기 공유 기능이 있으면 그것을 쓴다 (휴대폰 대부분)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // 사용자가 취소한 경우다. 아무 일도 하지 않는다.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setDone("copied");
      setTimeout(() => setDone(null), 2000);
    } catch {
      // 클립보드도 막혀 있으면 알려줄 방법이 없다. 조용히 넘어간다.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-[13.5px] font-bold text-ink transition-colors hover:border-brand hover:text-brand ${className}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      </svg>
      {done === "copied" ? "주소를 복사했습니다" : "공유하기"}
    </button>
  );
}
