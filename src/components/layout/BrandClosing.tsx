import Link from "next/link";
import Logo from "@/components/common/Logo";
import type { SiteInfo } from "@/lib/types";

/**
 * 모든 페이지 하단에 공통으로 들어가는 마무리 띠 (시안 기준).
 * 산 배경 사진 위에 협회 문장 + 로고 + 이어지는 행동 버튼.
 */
export default function BrandClosing({
  site,
  logo,
  cta = { label: "지금, 함께하세요", href: "/contact" },
  background,
}: {
  site: SiteInfo;
  logo: string | null;
  cta?: { label: string; href: string };
  background?: string | null;
}) {
  return (
    <section className="relative isolate overflow-hidden border-t border-line">
      {background ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <div aria-hidden className="ph absolute inset-0 -z-10" />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-white/72" />

      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between md:py-16">
        <div>
          <p className="text-[24px] font-bold leading-[1.45] tracking-[-0.02em] sm:text-[28px] md:text-[32px]">
            혼자서는 작은 가게지만,
            <br />
            함께하면 <span className="text-brand">원주의 경제</span>가 됩니다.
          </p>
          <p className="mt-5 text-[14px] leading-[1.75] text-ink-soft md:text-[15px]">
            {site.name}는 청년 소상공인들의 도전과 성장을 응원하며,
            <br className="hidden sm:block" /> 더 좋은 원주, 더 나은 내일을 만들어갑니다.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-5 md:items-end">
          <Logo src={logo} height={46} />
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep"
          >
            {cta.label}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
