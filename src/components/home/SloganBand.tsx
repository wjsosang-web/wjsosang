import Link from "next/link";
import type { SiteInfo } from "@/lib/types";

/**
 * 슬로건 띠.
 *
 * 흰 구간이 계속 이어지면 화면이 밋밋해져서, 중간에 진한 색 띠를 하나 넣어
 * 위아래를 끊어준다. 문구는 협회 정보(site_settings)에서 가져오므로
 * 관리자에서 슬로건을 고치면 여기도 같이 바뀐다.
 */
export default function SloganBand({ site }: { site: SiteInfo }) {
  if (!site.slogan) return null;

  return (
    <section className="relative isolate overflow-hidden bg-forest px-5 py-14 md:py-20">
      {/* 배경 무늬 — 로고의 초록을 옅게 겹쳐 깊이를 준다 */}
      <span
        aria-hidden
        className="absolute -right-24 -top-24 -z-10 block h-[320px] w-[320px] rounded-full bg-brand/25 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-32 -left-20 -z-10 block h-[280px] w-[280px] rounded-full bg-leaf/20 blur-3xl"
      />

      <div className="mx-auto max-w-[900px]">
        <p className="text-[12.5px] font-bold tracking-[0.16em] text-brand-light">
          {site.shortName}
        </p>

        <p className="mt-5 text-[19px] font-bold leading-[1.7] tracking-[-0.02em] text-white md:text-[26px] md:leading-[1.65]">
          {site.slogan}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          <Link
            href="/about"
            className="rounded-lg bg-white px-6 py-3 text-[14.5px] font-bold text-forest transition-colors hover:bg-brand-light"
          >
            협회 알아보기
          </Link>
          <Link
            href="/activities"
            className="rounded-lg border border-white/40 px-6 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-white/10"
          >
            협회활동 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
