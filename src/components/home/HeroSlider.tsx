"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Highlighted } from "@/components/common/PageHero";
import type { HeroLink, HeroSlide } from "@/lib/types";

/**
 * 메인 히어로 슬라이드.
 * 슬라이드 장수와 문구는 전부 데이터에서 온다.
 */
const AUTOPLAY_MS = 7000;

/** 슬라이드에 버튼을 정해두지 않았을 때 쓰는 기본값 */
const DEFAULT_LINKS: HeroLink[] = [
  { label: "협회 알아보기", href: "/about" },
  { label: "회원업장 둘러보기", href: "/business" },
];

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = slides.length;
  const go = useCallback((next: number) => setIndex(((next % total) + total) % total), [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [index, paused, total, go]);

  // 사용자가 화면 움직임을 줄이도록 설정했으면 자동 재생을 멈춘다.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) setPaused(true);
  }, []);

  if (total === 0) return null;
  const slide = slides[index];

  return (
    <section
      className="relative isolate overflow-hidden bg-forest"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="캐러셀"
      aria-label="협회 소개 슬라이드"
    >
      {slide.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.id}
          src={slide.image}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <div aria-hidden className="ph-dark absolute inset-0 -z-10" />
      )}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-forest/92 via-forest/68 to-forest/20"
      />

      <div className="mx-auto max-w-[1180px] px-5 py-12 md:py-16">
        <div className="flex items-center justify-between gap-8">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[12.5px] font-semibold text-white/80">
              {slide.eyebrow}
              <span aria-hidden className="block h-px w-8 bg-white/40" />
            </p>

            <h1 className="mt-3.5 whitespace-pre-line text-[28px] font-bold leading-[1.28] tracking-[-0.02em] text-white sm:text-[34px] md:text-[42px]">
              <Highlighted text={slide.title} words={slide.highlight} tone="dark" />
            </h1>

            <p className="mt-4 whitespace-pre-line text-[14px] leading-[1.75] text-white/85 md:text-[15.5px]">
              {slide.description}
            </p>

            {/* 슬라이드마다 다른 곳으로 보낼 수 있다. 정해둔 것이 없으면 기본 두 개. */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {(slide.links?.length ? slide.links : DEFAULT_LINKS)
                .slice(0, 2)
                .map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14.5px] font-bold transition-colors ${
                      i === 0
                        ? "bg-brand text-white hover:bg-brand-deep"
                        : "border border-white/50 text-white hover:bg-white hover:text-forest"
                    }`}
                  >
                    {link.label} <span aria-hidden>→</span>
                  </Link>
                ))}
            </div>

            {/* 모바일·태블릿용 컨트롤 */}
            {total > 1 && (
              <div className="mt-7 flex items-center gap-3 lg:hidden">
                <Progress index={index} total={total} />
                <Counter index={index} total={total} />
                <span className="flex gap-1.5">
                  <ArrowButton label="이전 슬라이드" onClick={() => go(index - 1)} dir="prev" />
                  <ArrowButton label="다음 슬라이드" onClick={() => go(index + 1)} dir="next" />
                </span>
              </div>
            )}
          </div>

          <div className="hidden shrink-0 flex-col items-end gap-8 lg:flex">
            <p className="hand whitespace-pre-line text-right text-[26px] leading-[1.6] text-white/90">
              {slide.note}
            </p>

            {total > 1 && (
              <div className="flex items-center gap-4">
                <Progress index={index} total={total} />
                <Counter index={index} total={total} />
                <span className="flex gap-1.5">
                  <ArrowButton label="이전 슬라이드" onClick={() => go(index - 1)} dir="prev" />
                  <ArrowButton label="다음 슬라이드" onClick={() => go(index + 1)} dir="next" />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Progress({ index, total }: { index: number; total: number }) {
  return (
    <span className="block h-[3px] w-20 overflow-hidden rounded bg-white/25 md:w-24">
      <span
        className="block h-full rounded bg-brand-light transition-all duration-500"
        style={{ width: `${((index + 1) / total) * 100}%` }}
      />
    </span>
  );
}

function Counter({ index, total }: { index: number; total: number }) {
  return (
    <span className="tnum text-[12.5px] font-semibold text-white/80">
      {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </span>
  );
}

function ArrowButton({
  label,
  onClick,
  dir,
}: {
  label: string;
  onClick: () => void;
  dir: "prev" | "next";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-forest"
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d={dir === "prev" ? "M9 2 4 7l5 5" : "M5 2l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
