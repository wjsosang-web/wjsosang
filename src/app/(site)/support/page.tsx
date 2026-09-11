import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import { Icon } from "@/components/common/Icons";
import FeedList from "@/components/support/FeedList";
import { getPageHero } from "@/lib/repo";
import { getFeedItems } from "@/lib/feeds/repo";

export const metadata: Metadata = {
  title: "지원사업 소식",
  description:
    "원주 소상공인이 신청할 수 있는 지원사업·정책자금 공고, 소상공인 교육, 원주 행사 소식을 한곳에 모았습니다.",
};

/**
 * 지원사업·교육·행사 소식.
 *
 * 매일 아침 저절로 모이므로 한 시간에 한 번만 다시 그려도 충분하다.
 * 관리자가 감추거나 직접 모아 왔을 때는 그 자리에서 다시 그린다.
 */
export const revalidate = 3600;

const GUIDE = [
  {
    icon: "megaphone",
    title: "매일 아침 자동으로",
    body: "중앙부처·강원도·원주시가 올리는 공고를 매일 아침 모읍니다. 사람이 찾아다니지 않아도 됩니다.",
  },
  {
    icon: "chat",
    title: "텔레그램으로 바로",
    body: "협회 텔레그램을 등록해 두시면 새 공고가 올라온 날 바로 알림이 갑니다. 회원 전용입니다.",
  },
  {
    icon: "check-user",
    title: "마감 임박한 것부터",
    body: "신청 기간이 얼마 안 남은 공고가 위에 옵니다. 마감이 지난 공고는 목록에서 내려갑니다.",
  },
];

export default async function SupportPage() {
  const [hero, items] = await Promise.all([getPageHero("support"), getFeedItems({ limit: 80 })]);

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        highlight={hero.highlight}
        description={hero.description}
        note={hero.note}
        image={hero.image}
        tone={hero.tone}
        size={hero.size}
        ctas={hero.ctas}
      />

      {/* 어떻게 쓰는지 */}
      <section className="px-5 pt-10 md:pt-12">
        <ul className="mx-auto grid max-w-[1180px] gap-3 md:grid-cols-3">
          {GUIDE.map((g) => (
            <li key={g.title} className="rounded-2xl border border-line bg-white p-5">
              <span
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-xl bg-brand-tint text-brand"
              >
                <Icon name={g.icon} className="h-[19px] w-[19px]" />
              </span>
              <p className="mt-3 text-[15px] font-bold">{g.title}</p>
              <p className="mt-1.5 text-[13px] leading-[1.75] text-ink-soft">{g.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <FeedList items={items} />

      {/* 알림 받기 안내 */}
      <section className="px-5 pb-14">
        <div className="mx-auto max-w-[1180px] rounded-2xl bg-gradient-to-br from-forest to-brand-deep px-6 py-8 text-white md:px-10 md:py-10">
          <p className="text-[12px] font-bold tracking-[0.18em] text-brand-light">TELEGRAM</p>
          <h2 className="mt-2.5 text-[22px] font-bold leading-snug tracking-[-0.02em] md:text-[26px]">
            새 공고가 뜨면 휴대폰으로 바로 알려 드립니다.
          </h2>
          <p className="mt-3 max-w-[620px] text-[14px] leading-[1.8] text-white/75">
            지원금을 못 받는 가장 흔한 이유는 자격이 안 돼서가 아니라, 공고가 올라온 줄 몰라서입니다.
            신청 기간은 보통 2~3주뿐입니다. 협회 텔레그램을 한 번만 등록해 두시면 그 뒤로는
            챙기지 않으셔도 됩니다.
          </p>
          <Link
            href="/contact?kind=join"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3.5 text-[14.5px] font-bold text-forest transition-colors hover:bg-white/90"
          >
            알림 받기 문의하기
          </Link>
        </div>
      </section>
    </>
  );
}
