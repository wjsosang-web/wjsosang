"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BusinessCard from "@/components/common/BusinessCard";
import { reshuffleForViewer, type BusinessCard as CardData } from "@/lib/search";

/**
 * 메인 화면의 회원업장 미리보기.
 *
 * 그려 보낸 화면은 모두에게 같은 것이 저장되기 때문에, 서버에서 고른 업장은
 * 누가 들어와도 같다. 그래서 화면이 뜬 뒤 브라우저에서 다시 섞어서 고른다.
 * 새로고침할 때마다, 보는 사람마다 다른 업장이 나온다.
 *
 * 검색은 여기서 처리하지 않고 회원업장 화면으로 넘긴다. 거기에 업종·지역
 * 거르기까지 다 있어서, 같은 기능을 두 곳에 두면 나중에 한쪽만 고치게 된다.
 */
export default function BusinessPreview({
  cards,
  count,
  total,
}: {
  cards: CardData[];
  count: number;
  /** 전체 업장 수. 더보기 버튼에 몇 곳이 더 있는지 적는다. */
  total: number;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(() => cards.slice(0, count));
  const [query, setQuery] = useState("");

  useEffect(() => setShown(reshuffleForViewer(cards).slice(0, count)), [cards, count]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/business?q=${encodeURIComponent(q)}` : "/business");
  };

  return (
    <>
      {/* 검색 */}
      <form
        onSubmit={search}
        className="mx-auto mt-5 flex max-w-[720px] items-center gap-2 rounded-xl bg-white p-2 shadow-[0_6px_20px_rgba(22,36,31,0.08)]"
      >
        <label htmlFor="home-biz-search" className="sr-only">
          회원업장 검색
        </label>
        <span aria-hidden className="pl-2.5 text-muted">
          <SearchGlyph />
        </span>
        <input
          id="home-biz-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="어떤 가게를 찾으세요?"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          검색
        </button>
      </form>

      <p className="mx-auto mt-2.5 max-w-[720px] text-center text-[12.5px] leading-[1.75] text-muted">
        업장명 · 업종 · 대표자명 · 동네 무엇으로든 찾으실 수 있습니다.
        <br />
        <span className="text-ink-soft">예) 픽카 · 자동차 · 이종현 · 반곡동</span>
      </p>

      {/* 업장 — 넓은 화면에서 다섯 칸씩 */}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {shown.map((b) => (
          <li key={b.id}>
            <BusinessCard business={b} variant="compact" />
          </li>
        ))}
      </ul>

      <div className="mt-7 text-center">
        <Link
          href="/business"
          className="inline-block rounded-lg border border-line-strong bg-white px-8 py-3.5 text-[14.5px] font-bold transition-colors hover:border-brand hover:text-brand"
        >
          회원업장 더보기{" "}
          {total > count && (
            <span className="tnum text-muted">({total - count}곳 더 있습니다)</span>
          )}
        </Link>
      </div>
    </>
  );
}

function SearchGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
