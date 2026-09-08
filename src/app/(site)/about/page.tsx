import type { Metadata } from "next";
import OrgChart from "@/components/about/OrgChart";
import PeopleGroups from "@/components/about/PeopleGroups";
import PageHero from "@/components/common/PageHero";
import { Icon } from "@/components/common/Icons";
import { accentAt } from "@/lib/accents";
import { publicFileExists } from "@/lib/assets";
import {
  getHistory,
  getMembers,
  getOrgGroupOrder,
  getOrgMembers,
  getPartners,
  getPresidentMessage,
  getPrograms,
  getPublicBusinesses,
  getSiteInfo,
  getStory,
} from "@/lib/repo";

export const metadata: Metadata = { title: "협회소개" };
export const revalidate = 86400;

export default async function AboutPage() {
  const [
    site,
    story,
    president,
    programs,
    history,
    partners,
    org,
    businesses,
    members,
    groupOrder,
  ] = await Promise.all([
      getSiteInfo(),
      getStory(),
      getPresidentMessage(),
      getPrograms(),
      getHistory(),
      getPartners(),
      getOrgMembers(),
      getPublicBusinesses(),
    getMembers(),
    getOrgGroupOrder(),
  ]);

  const chair = org.find((o) => o.title === "회장") ?? null;

  // 임원 카드에서 업장명·업종·링크를 보여주기 위한 매핑
  const businessById = Object.fromEntries(
    businesses.map((b) => [b.id, { slug: b.slug, name: b.name, category: b.category }]),
  );

  // 로고 파일이 아직 없는 기관은 이름만 보여준다.
  const partnerList = partners.map((p) => ({
    ...p,
    logo: p.logo && publicFileExists(p.logo) ? p.logo : null,
  }));

  return (
    <>
      <PageHero
        eyebrow="원주청년소상공인협회"
        title={story.heading}
        highlight={["원주", "청년", "소상공인"]}
        description={story.lead}
        note={story.note}
        ctas={[
          { label: "협회 소개 영상 보기", href: "/activities" },
          { label: "함께하는 더 큰 원주", href: "/contact", variant: "outline" },
        ]}
      />

      {/* 회장 소개 */}
      {chair && (
        <section className="px-5 py-12 md:py-16">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">회장 소개</h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,3fr)]">
              <div className="overflow-hidden rounded-2xl bg-mist">
                {chair.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chair.photo}
                    alt={`${chair.name} 회장`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div aria-hidden className="ph h-full min-h-[320px] w-full" />
                )}
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-[13px] font-semibold text-muted">{site.name} 회장</p>
                <p className="mt-2 text-[30px] font-bold tracking-[0.06em] md:text-[34px]">
                  {chair.name}
                </p>

                <p className="mt-6 whitespace-pre-line text-[16px] font-bold leading-[1.6] text-brand-deep md:text-[17px]">
                  “{president.quote}”
                </p>

                <p className="mt-5 whitespace-pre-line text-[13.5px] leading-[1.9] text-ink-soft md:text-[14.5px]">
                  {president.body}
                </p>

                <p className="mt-6 text-[13px] text-muted">
                  {site.name} 회장{" "}
                  <b className="ml-1 text-[15px] font-bold text-ink">{chair.name}</b>
                </p>
              </div>

              <div className="relative isolate hidden overflow-hidden rounded-2xl lg:block">
                <div aria-hidden className="ph absolute inset-0 -z-10" />
                <div aria-hidden className="absolute inset-0 -z-10 bg-white/55" />
                <div className="flex h-full flex-col justify-between p-6">
                  <p className="hand whitespace-pre-line text-[24px] leading-[1.5]">
                    {president.note}
                  </p>
                  <p className="mt-8 rounded-xl bg-white/85 p-4 text-center text-[13.5px] font-bold leading-[1.7]">
                    “{president.plaque.replace(/\n/g, " ")}”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 협회 이야기 */}
      <section className="bg-mist px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[200px_1fr] lg:gap-10">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">협회 이야기</h2>
          <div className="space-y-4">
            {story.paragraphs.map((p, i) => (
              <p key={i} className="text-[14.5px] leading-[1.95] text-ink-soft md:text-[15.5px]">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      <OrgChart org={org} />

      <PeopleGroups
        org={org}
        members={members}
        businessById={businessById}
        groupOrder={groupOrder}
      />

      {/* 주요사업 */}
      <section className="px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[200px_1fr] lg:gap-10">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">주요사업</h2>
            <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
              청년 소상공인의 오늘과
              <br />
              내일을 함께합니다.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {programs.map((p, i) => (
              <li key={p.id} className="rounded-xl border border-line bg-white p-5 text-center">
                <span
                  aria-hidden
                  className={`mx-auto grid h-11 w-11 place-items-center rounded-full ${accentAt(i).chip}`}
                >
                  <Icon name={p.icon} className="h-[22px] w-[22px]" />
                </span>
                <h3 className="mt-3.5 text-[15px] font-bold">{p.title}</h3>
                <p className="mt-2 text-[12.5px] leading-[1.7] text-ink-soft">{p.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 걸어온 길 */}
      <section className="bg-mist px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[200px_1fr] lg:gap-10">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">걸어온 길</h2>
            <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
              지금까지의 발걸음이
              <br />더 큰 내일로 이어집니다.
            </p>
          </div>

          <ol className="no-scrollbar flex gap-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible">
            {history.map((h, i) => (
              <li key={h.id} className="w-[210px] shrink-0 lg:w-auto">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`block h-3 w-3 shrink-0 rounded-full ${accentAt(i).fill}`}
                  />
                  <span aria-hidden className="h-px flex-1 bg-line-strong" />
                </div>
                <p
                  className={`tnum mt-3 text-[19px] font-bold ${
                    h.upcoming ? "text-brand" : "text-ink"
                  }`}
                >
                  {h.year}
                  {h.upcoming && (
                    <span className="ml-1.5 align-middle text-[12px] font-semibold">(예정)</span>
                  )}
                </p>
                <p className="mt-1.5 text-[14px] font-bold">{h.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-[1.65] text-ink-soft">{h.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 함께하는 기관 */}
      <section className="px-5 py-12 md:py-14">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[200px_1fr] lg:items-center lg:gap-10">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">
              함께하는 기관
            </h2>
            <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
              좋은 파트너십이
              <br />더 나은 원주를 만듭니다.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {partnerList.map((p) => (
              <li key={p.id}>
                <PartnerTile partner={p} />
              </li>
            ))}
          </ul>
        </div>

        <p className="mx-auto mt-5 max-w-[1180px] text-[11.5px] leading-relaxed text-muted">
          기관 로고는 각 기관의 자산이며, 협력 관계 안내 목적으로만 사용합니다.
        </p>
      </section>
    </>
  );
}

function PartnerTile({
  partner,
}: {
  partner: { name: string; logo: string | null; url: string | null };
}) {
  const inner = (
    <>
      {partner.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logo} alt={partner.name} className="h-9 w-auto shrink-0" />
      ) : (
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-[10px] font-bold text-city"
        >
          CI
        </span>
      )}
      <span className="truncate text-[13px] font-bold">{partner.name}</span>
    </>
  );

  const className =
    "flex h-full items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-4 transition-colors hover:border-line-strong";

  return partner.url ? (
    <a href={partner.url} target="_blank" rel="noreferrer noopener" className={className}>
      {inner}
    </a>
  ) : (
    <span className={className}>{inner}</span>
  );
}
