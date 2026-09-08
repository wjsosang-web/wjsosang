"use client";

import { useMemo, useState } from "react";
import BusinessCard from "@/components/common/BusinessCard";
import { Icon } from "@/components/common/Icons";
import { filterBusinessCards, type BusinessCard as CardData } from "@/lib/search";

/** 업종 칩에 붙는 아이콘. 목록에 없는 업종은 기본 아이콘이 나온다. */
const CATEGORY_ICONS: Record<string, string> = {
  외식: "store",
  "카페·디저트": "chat",
  "미용·뷰티": "heart",
  자동차: "car",
  "휴대폰·통신": "phone",
  "건설·인테리어": "chart",
  "금융·보험": "chart",
  "세무·법무": "form",
  제조: "chart",
  교육: "form",
  유통: "store",
  생활서비스: "users",
  전문서비스: "camera",
  기타: "link",
};

/** 모바일 3열 × 5줄 = 15곳을 먼저 보여주고, 더보기로 같은 만큼씩 늘린다. */
const PAGE_SIZE = 15;

type SortKey = "recent" | "name";

export default function BusinessFinder({
  cards,
  categories,
  districts,
  initialQuery = "",
  featuredSlot,
}: {
  /** 서버에서 이미 정렬된 상태로 넘어온다 (우선순위 지정 → 나머지 랜덤). */
  cards: CardData[];
  categories: string[];
  districts: string[];
  initialQuery?: string;
  /** 필터와 결과 사이에 끼워 넣을 구간 (이달의 추천 회원업장) */
  featuredSlot?: React.ReactNode;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const [onlyNew, setOnlyNew] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const newCount = useMemo(() => cards.filter((c) => c.isNew).length, [cards]);

  const results = useMemo(() => {
    let filtered = filterBusinessCards(cards, { query, category, district });
    if (onlyNew) filtered = filtered.filter((c) => c.isNew);
    // 기본(recent)은 서버가 정한 순서를 그대로 쓴다.
    return sort === "name"
      ? filtered.slice().sort((a, b) => a.name.localeCompare(b.name, "ko"))
      : filtered;
  }, [cards, query, category, district, sort, onlyNew]);

  const shown = results.slice(0, visible);
  const isFiltered = query.trim() !== "" || category !== null || district !== null || onlyNew;

  const update = (fn: () => void) => {
    fn();
    setVisible(PAGE_SIZE);
  };

  const reset = () =>
    update(() => {
      setQuery("");
      setCategory(null);
      setDistrict(null);
      setOnlyNew(false);
    });

  return (
    <>
      {/* 검색바 — 히어로 아래에 겹쳐 놓는다 */}
      <div className="relative z-10 -mt-8 px-5 md:-mt-9">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto flex max-w-[860px] items-center gap-2 rounded-xl bg-white p-2 shadow-[0_10px_30px_rgba(22,36,31,0.14)]"
        >
          <label htmlFor="biz-search" className="sr-only">
            회원업장 검색
          </label>
          <span aria-hidden className="pl-3 text-muted">
            <SearchGlyph />
          </span>
          <input
            id="biz-search"
            type="search"
            value={query}
            onChange={(e) => update(() => setQuery(e.target.value))}
            placeholder="상호명, 업종, 서비스로 검색해보세요."
            className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none placeholder:text-muted"
          />
          <span className="hidden shrink-0 rounded-lg bg-brand px-6 py-3 text-[14px] font-bold text-white sm:block">
            검색하기 <span aria-hidden>→</span>
          </span>
        </form>
      </div>

      {/* 업종 / 지역 필터 */}
      <div className="px-5 pt-8">
        <div className="mx-auto max-w-[1180px] space-y-3 rounded-2xl border border-line bg-mist p-4 md:p-5">
          <FilterRow label="업종으로 찾기" icon="store">
            <Chip active={category === null} onClick={() => update(() => setCategory(null))}>
              전체
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => update(() => setCategory(category === c ? null : c))}
                icon={CATEGORY_ICONS[c] ?? "link"}
              >
                {c}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="지역으로 찾기" icon="pin">
            <Chip active={district === null} onClick={() => update(() => setDistrict(null))}>
              원주시 전체
            </Chip>
            {districts.map((d) => (
              <Chip
                key={d}
                active={district === d}
                onClick={() => update(() => setDistrict(district === d ? null : d))}
              >
                {d}
              </Chip>
            ))}
          </FilterRow>

          {newCount > 0 && (
            <div className="flex items-center gap-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => update(() => setOnlyNew(!onlyNew))}
                aria-pressed={onlyNew}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-bold transition-colors ${
                  onlyNew ? "bg-amber text-white" : "bg-white text-amber ring-1 ring-amber/40 hover:ring-amber"
                }`}
              >
                신입회원만 보기
                <span className="tnum opacity-80">{newCount}</span>
              </button>
              <span className="text-[12px] text-muted">최근 6개월 안에 가입한 회원사입니다.</span>
            </div>
          )}
        </div>
      </div>

      {featuredSlot}

      {/* 결과 */}
      <section className="px-5 py-10 md:py-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="text-[21px] font-bold tracking-[-0.02em] md:text-[24px]">
              {isFiltered ? "검색 결과" : "전체 회원업장"}
            </h2>
            <p className="text-[14px] text-muted">
              {isFiltered
                ? "조건에 맞는 회원업장입니다."
                : "원주청년소상공인협회와 함께하는 회원업장입니다."}
            </p>

            <div className="ml-auto flex items-center gap-3">
              <p className="text-[13.5px] text-muted">
                총 <b className="tnum font-bold text-ink">{results.length}</b>개의 업장이
                등록되어 있습니다.
              </p>
              <label className="sr-only" htmlFor="biz-sort">
                정렬 방식
              </label>
              <select
                id="biz-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-brand"
              >
                <option value="recent">최신 등록순</option>
                <option value="name">이름순</option>
              </select>
            </div>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="mt-3 text-[13px] font-semibold text-brand hover:underline"
            >
              조건 초기화
            </button>
          )}

          {results.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-mist px-6 py-16 text-center">
              <p className="text-[15px] font-bold">조건에 맞는 회원업장이 없습니다.</p>
              <p className="mt-2 text-[14px] text-muted">
                검색어를 줄이거나 업종·지역 조건을 바꿔서 다시 찾아보세요.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-6 rounded-lg bg-brand px-6 py-3 text-[14px] font-bold text-white"
              >
                조건 초기화
              </button>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {shown.map((b) => (
                <li key={b.id}>
                  <BusinessCard business={b} variant="compact" />
                </li>
              ))}
            </ul>
          )}

          {visible < results.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-lg border border-line-strong px-8 py-3.5 text-[14.5px] font-bold transition-colors hover:border-brand hover:text-brand"
              >
                회원업장 더보기{" "}
                <span className="tnum text-muted">({results.length - visible}곳 남음)</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function FilterRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
      <p className="flex shrink-0 items-center gap-2 text-[13.5px] font-bold text-ink-soft lg:w-[120px]">
        <Icon name={icon} className="h-[16px] w-[16px] text-brand" />
        {label}
      </p>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-brand text-white"
          : "bg-white text-ink-soft ring-1 ring-line hover:ring-brand/50"
      }`}
    >
      {icon && <Icon name={icon} className="h-[15px] w-[15px]" />}
      {children}
    </button>
  );
}

function SearchGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
