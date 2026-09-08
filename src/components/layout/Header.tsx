"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/common/Logo";
import { NAV } from "@/components/layout/nav";

interface Props {
  logo: string | null;
  phone: string;
}

export default function Header({ logo, phone }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // 라우트가 바뀌면 열려 있던 것들을 닫는다.
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // 모바일 메뉴가 열린 동안 뒤 배경이 스크롤되지 않게 한다.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/business?q=${encodeURIComponent(q)}` : "/business");
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center gap-4 px-5 md:h-[76px]">
        <Link href="/" aria-label="원주청년소상공인협회 메인홈" className="shrink-0">
          {/* 가로로 긴 로고를 기준으로 잡았다. 세로가 긴 파일이 들어와도
              높이는 그대로 두고 가로만 늘어난다. */}
          <Logo src={logo} height={40} className="max-h-[40px] w-auto max-w-[230px]" />
        </Link>

        {/* PC 메뉴 — 가운데 */}
        <nav aria-label="주요 메뉴" className="ml-auto hidden md:block">
          <ul className="flex items-center">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative block px-4 py-6 text-[15px] font-semibold transition-colors lg:px-5 ${
                    isActive(item.href) ? "text-brand" : "text-ink hover:text-brand"
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 bottom-[14px] h-[2px] rounded bg-brand"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen}
            aria-label="회원업장 검색"
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-mist"
          >
            <SearchIcon />
          </button>

          <Link
            href="/contact"
            className="hidden shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep sm:inline-flex"
          >
            <MailIcon />
            문의하기
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            className="grid h-10 w-10 place-items-center md:hidden"
          >
            <span className="relative block h-4 w-6">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute left-0 block h-[2px] w-6 rounded bg-ink transition-transform"
                  style={{
                    top: open ? 7 : i * 7,
                    transform: open
                      ? i === 0
                        ? "rotate(45deg)"
                        : i === 1
                          ? "scaleX(0)"
                          : "rotate(-45deg)"
                      : "none",
                  }}
                />
              ))}
            </span>
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      {searchOpen && (
        <div className="border-t border-line bg-white">
          <form onSubmit={submitSearch} className="mx-auto max-w-[1180px] px-5 py-4">
            <div className="flex gap-2">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="상호명, 업종, 서비스로 검색해보세요."
                className="min-w-0 flex-1 rounded-lg border border-line bg-mist px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand focus:bg-white"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-brand px-6 py-3 text-[14px] font-bold text-white"
              >
                검색
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 모바일 메뉴 */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="모바일 메뉴"
          className="fixed inset-x-0 bottom-0 top-[68px] overflow-y-auto border-t border-line bg-white md:hidden"
        >
          <ul className="px-5">
            {NAV.map((item) => (
              <li key={item.href} className="border-b border-line">
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center justify-between py-4 text-[17px] font-bold ${
                    isActive(item.href) ? "text-brand" : "text-ink"
                  }`}
                >
                  {item.label}
                  <span aria-hidden className="text-[15px] text-line-strong">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="space-y-2.5 px-5 py-6">
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand py-4 text-[16px] font-bold text-white"
            >
              <MailIcon />
              문의하기
            </Link>
            <a
              href={`tel:${phone.replace(/-/g, "")}`}
              className="block rounded-lg border border-line py-4 text-center text-[16px] font-bold text-ink"
            >
              협회 전화 {phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 4.5L8 8.5l5.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
