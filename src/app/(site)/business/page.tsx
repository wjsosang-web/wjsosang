import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import { Icon } from "@/components/common/Icons";
import BusinessFinder from "@/components/business/BusinessFinder";
import { getDistricts, getOrgMembers, getPublicBusinesses, toDateKey } from "@/lib/repo";
import { accentAt } from "@/lib/accents";
import { buildBusinessCards, orderBusinessCards, seedFromDateKey } from "@/lib/search";
import { BUSINESS_CATEGORIES } from "@/lib/types";

export const metadata: Metadata = { title: "회원업장" };
/**
 * 관리자가 저장하면 그 즉시 새로 만들어진다(refreshPublicPages).
 * 이 값은 혹시 그 갱신을 놓쳤을 때를 위한 안전망이다.
 * 하루로 두면 한 번 놓쳤을 때 꼬박 하루가 지나야 고쳐지므로 1분으로 둔다.
 */
export const revalidate = 60;

/** 플레이스 URL 간편등록 안내. 실제 등록 화면(관리자)은 2단계에서 붙인다. */
const REGISTER_STEPS = [
  {
    no: "01",
    icon: "link",
    title: "네이버 플레이스 URL 입력",
    body: "내 가게의 네이버 플레이스 URL을 입력해주세요.",
  },
  {
    no: "02",
    icon: "form",
    title: "업장정보 자동채움",
    body: "가게명, 주소, 사진 등 주요 정보가 자동으로 채워집니다.",
  },
  {
    no: "03",
    icon: "check-user",
    title: "관리자 확인 후 등록",
    body: "협회에서 확인 후 빠르게 등록해 드립니다.",
  },
];

export default async function BusinessListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const today = toDateKey(new Date());

  const [businesses, org, districts] = await Promise.all([
    getPublicBusinesses(),
    getOrgMembers(),
    getDistricts(),
  ]);

  // 우선순위 지정 → 임원 업장 → 나머지 랜덤 (하루마다 다시 섞임)
  const cards = orderBusinessCards(
    buildBusinessCards(businesses, org, today),
    seedFromDateKey(today),
  );

  return (
    <>
      <PageHero
        eyebrow="원주청년소상공인협회"
        title="원청협 회원업장을 찾아보세요."
        highlight={["원청협 회원업장"]}
        description={"원주의 청년 소상공인들이 만들어가는\n특별한 가게, 좋은 사람들과 연결됩니다."}
        note={"좋은 가게가\n좋은 마을을 만듭니다.\n:)"}
        size="sm"
      />

      <BusinessFinder
        cards={cards}
        categories={[...BUSINESS_CATEGORIES]}
        districts={districts}
        initialQuery={q ?? ""}
      />

      {/* 플레이스 URL로 간편 등록 */}
      <section className="px-5 pb-14">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-line bg-mist p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr_auto] lg:items-center lg:gap-8">
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.02em] md:text-[21px]">
                플레이스 URL로 간편 등록
              </h2>
              <p className="mt-2.5 text-[13.5px] leading-[1.7] text-ink-soft">
                네이버 플레이스 URL만 입력하면, 쉽고 빠르게 등록할 수 있습니다.
                <br />
                지금, 더 많은 원주의 청년 소상공인과 연결되어 보세요.
              </p>
            </div>

            <ol className="grid gap-2.5 sm:grid-cols-3">
              {REGISTER_STEPS.map((step, i) => (
                <li key={step.no} className="flex items-start gap-3 rounded-xl bg-white p-4">
                  <span
                    aria-hidden
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${accentAt(i).chip}`}
                  >
                    <Icon name={step.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className={`tnum block text-[11.5px] font-bold ${accentAt(i).text}`}>
                      {step.no}
                    </span>
                    <span className="mt-0.5 block text-[13.5px] font-bold leading-snug">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-[12px] leading-[1.6] text-muted">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <Link
              href="/contact?kind=%ED%9A%8C%EC%9B%90%EA%B0%80%EC%9E%85%20%EB%AC%B8%EC%9D%98#contact-form"
              className="shrink-0 justify-self-start rounded-lg bg-brand px-6 py-3.5 text-center text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep lg:justify-self-auto"
            >
              등록 문의하기
              <span className="mt-0.5 block text-[11.5px] font-normal opacity-80">
                사무국에서 대신 등록해 드립니다
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
