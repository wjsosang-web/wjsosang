import Link from "next/link";
import { Icon } from "@/components/common/Icons";
import type { SiteInfo } from "@/lib/types";

/**
 * 가입 안내 띠.
 *
 * 홈 아래쪽에서 "그래서 어떻게 함께하나"로 이어주는 자리다.
 * 전화번호와 담당자는 협회 정보에서 가져온다.
 */
export default function JoinBand({ site }: { site: SiteInfo }) {
  const tel = site.phone.replace(/-/g, "");

  return (
    <section className="px-5 py-8 md:py-10">
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-2xl bg-brand">
        <div className="grid gap-6 px-6 py-9 md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:px-10 md:py-11">
          <div className="text-white">
            <p className="text-[12.5px] font-bold tracking-[0.14em] text-white/70">
              함께하기
            </p>
            <p className="mt-3 text-[20px] font-bold leading-[1.5] tracking-[-0.02em] md:text-[25px]">
              원주에서 사업하는 청년이라면,
              <br />
              혼자 하지 않아도 됩니다.
            </p>
            <p className="mt-3 text-[13.5px] leading-[1.8] text-white/85 md:text-[14.5px]">
              가입 조건과 절차, 회원 혜택을 안내해 드립니다.
              {site.phoneOwner && ` 전화는 ${site.phoneOwner}에게 연결됩니다.`}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col md:min-w-[220px]">
            <Link
              href="/contact?kind=join"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-[14.5px] font-bold text-brand-deep transition-colors hover:bg-mist"
            >
              가입 문의하기 <span aria-hidden>→</span>
            </Link>
            <a
              href={`tel:${tel}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/45 px-6 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-white/10"
            >
              <Icon name="phone" className="h-[15px] w-[15px]" />
              {site.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
