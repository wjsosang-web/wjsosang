import type { ServiceLink } from "@/lib/serviceLinks";

/**
 * 소진공 지원사업 서비스 바로가기.
 *
 * 메인 맨 아래에 둔다. 휴대폰에서는 옆 여백이 없어 띠를 띄울 수 없으니,
 * 여기가 바로가기를 만나는 유일한 자리다. 그래서 좁은 화면에서도
 * 로고가 또렷하게 보이도록 두 칸씩 넉넉하게 놓는다.
 */
export default function ServiceLinks({
  links,
}: {
  links: (ServiceLink & { logo: string | null })[];
}) {
  return (
    <section className="bg-gradient-to-b from-[#fdf3ec] to-[#fbeadd] px-5 py-12 md:py-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="text-center">
          <h2 className="text-[23px] font-bold tracking-[-0.02em] md:text-[28px]">
            소상공인 지원사업 서비스 바로가기
          </h2>
          <p className="mt-2.5 text-[13.5px] leading-[1.7] text-ink-soft">
            정책자금 신청, 상권분석, 무료 교육까지.
            <br className="sm:hidden" />
            자주 찾는 곳을 한자리에 모았습니다.
          </p>
        </div>

        <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(22,36,31,0.1)]"
              >
                {link.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={link.logo}
                    alt={link.name}
                    loading="lazy"
                    className="h-9 w-auto max-w-[150px] object-contain"
                  />
                ) : (
                  <span className="text-[14.5px] font-bold leading-tight transition-colors group-hover:text-brand">
                    {link.name}
                  </span>
                )}

                <span className="text-[12px] leading-tight text-muted">{link.hint}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted">
          기관 로고는 각 기관의 자산이며, 바로가기 안내 목적으로만 사용합니다.
        </p>
      </div>
    </section>
  );
}
