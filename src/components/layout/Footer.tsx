import Link from "next/link";
import { NAV } from "@/components/layout/nav";
import type { PartnerOrg, SiteInfo } from "@/lib/types";

/**
 * 짙은 배경의 하단 바 (시안 기준).
 * 메뉴 / 주소·대표메일 / 함께하는 기관(원주시) / SNS / 카피라이트.
 */
export default function Footer({
  site,
  partner,
}: {
  site: SiteInfo;
  /** 함께하는 기관 중 대표 한 곳(원주시). 로고 파일이 없으면 이름만 나온다. */
  partner: (PartnerOrg & { logo: string | null }) | null;
}) {
  return (
    <footer className="bg-forest text-white/75">
      <div className="mx-auto max-w-[1180px] px-5 py-8">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="푸터 메뉴">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-semibold text-white/90">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <span>{site.address}</span>
            <span aria-hidden className="hidden h-3 w-px bg-white/20 sm:block" />
            <span>
              대표메일{" "}
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </span>
          </p>

          {partner && (
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-white/55">함께하는 기관</span>
              {partner.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-8 w-auto brightness-0 invert"
                />
              ) : (
                <span className="rounded bg-white/10 px-2.5 py-1 text-[13px] font-semibold text-white">
                  {partner.name}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 text-[12.5px] text-white/50">
            <span>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </span>
            <Link href="/admin/login" className="text-white/35 transition-colors hover:text-white/70">
              관리자
            </Link>
          </p>

          <div className="flex items-center gap-4">
            {site.instagramUrl && (
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="인스타그램"
                className="text-white/60 transition-colors hover:text-white"
              >
                <InstagramIcon />
              </a>
            )}
            {site.youtubeUrl && (
              <a
                href={site.youtubeUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="유튜브"
                className="text-white/60 transition-colors hover:text-white"
              >
                <YoutubeIcon />
              </a>
            )}
            <span className="text-[12.5px] text-white/50">{site.tagline}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="15" height="15" rx="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.4" cy="4.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="17" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 6.8v4.4L12.3 9 8.5 6.8Z" fill="currentColor" />
    </svg>
  );
}
