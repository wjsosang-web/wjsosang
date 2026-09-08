import type { Metadata } from "next";
import Link from "next/link";
import FaqList from "@/components/contact/FaqList";
import InquiryForm from "@/components/contact/InquiryForm";
import PageHero from "@/components/common/PageHero";
import {
  BusIcon,
  CarIcon,
  ClockIcon,
  Icon,
  MailIcon,
  PhoneIcon,
  PinIcon,
} from "@/components/common/Icons";
import { accentAt } from "@/lib/accents";
import { getFaqs, getSiteInfo } from "@/lib/repo";

export const metadata: Metadata = { title: "협회문의" };
export const revalidate = 86400;

/** 회원가입 안내 패널의 3가지 포인트 */
const JOIN_POINTS = [
  {
    icon: "users",
    title: "함께하는 네트워크",
    body: "같은 고민을 가진 청년 사장님들과 연결됩니다.",
  },
  {
    icon: "chart",
    title: "성장하는 기회",
    body: "교육, 컨설팅, 행사 등 다양한 지원을 받을 수 있습니다.",
  },
  {
    icon: "heart",
    title: "더 나은 지역, 더 밝은 내일",
    body: "청년 소상공인의 성장이 곧 원주의 성장입니다.",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const [{ kind }, site, faqs] = await Promise.all([
    searchParams,
    getSiteInfo(),
    getFaqs(),
  ]);

  const contacts = [
    {
      icon: PhoneIcon,
      label: "협회 연락처",
      value: site.phone,
      href: `tel:${site.phone.replace(/-/g, "")}`,
      note: "궁금한 점이 있다면\n언제든지 전화주세요.",
    },
    {
      icon: MailIcon,
      label: "이메일",
      value: site.email,
      href: `mailto:${site.email}`,
      note: "빠른 답변을 위해\n이메일로도 문의하실 수 있습니다.",
    },
    {
      icon: PinIcon,
      label: "주소",
      value: site.address,
      href: null,
      note: site.addressDetail,
    },
    {
      icon: ClockIcon,
      label: "운영시간",
      value: site.officeHours,
      href: null,
      note: "더 나은 소통을 위해\n항상 열린 마음으로 기다립니다.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="원주청년소상공인협회"
        title={"원청협과\n연결되고 싶으신가요?"}
        highlight={["원청협", "연결"]}
        description={
          "청년 소상공인의 오늘이 더 나은 내일로 이어지도록\n원주청년소상공인협회가 언제나 함께하겠습니다.\n궁금한 점이 있다면, 편하게 문의해주세요."
        }
        note={"좋은 질문이\n더 좋은 변화를\n만듭니다. :)"}
        size="sm"
      />

      {/* 연락처 */}
      <section className="bg-mist px-5 py-10 md:py-12">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {contacts.map((c, i) => (
              <div key={c.label} className="rounded-xl bg-white p-5">
                <span
                  aria-hidden
                  className={`grid h-11 w-11 place-items-center rounded-full ${accentAt(i).chip}`}
                >
                  <c.icon className="h-[22px] w-[22px]" />
                </span>
                <dt className="mt-3.5 text-[13.5px] font-bold">{c.label}</dt>
                <dd className="mt-1.5 text-[15px] font-bold leading-snug">
                  {c.href ? (
                    <a href={c.href} className="text-brand hover:underline">
                      {c.value}
                    </a>
                  ) : (
                    c.value
                  )}
                </dd>
                <p className="mt-2.5 whitespace-pre-line text-[12px] leading-[1.6] text-muted">
                  {c.note}
                </p>
              </div>
            ))}
          </dl>

          <div className="relative isolate hidden overflow-hidden rounded-xl lg:block">
            <div aria-hidden className="ph absolute inset-0 -z-10" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-forest/55" />
            <p className="absolute inset-x-0 bottom-0 p-5 text-[13.5px] font-bold leading-[1.6] text-white">
              원주 청년 소상공인의
              <br />
              든든한 파트너, 원청협입니다.
            </p>
          </div>
        </div>
      </section>

      {/* 문의하기 + 회원가입 문의 */}
      <section className="px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-2 lg:gap-8">
          <div id="contact-form" className="scroll-mt-24">
            <p className="text-[12px] font-bold tracking-[0.12em] text-brand">CONTACT US</p>
            <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] md:text-[28px]">
              문의하기
            </h2>
            <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
              궁금한 점이나 제안이 있으신가요?
              <br />
              아래 양식을 작성해 주시면, 빠르고 성실하게 답변드리겠습니다.
            </p>

            <InquiryForm email={site.email} initialKind={kind ?? ""} />
          </div>

          <div className="relative isolate overflow-hidden rounded-2xl bg-brand-tint p-6 md:p-8">
            <p className="text-[12px] font-bold tracking-[0.12em] text-brand">JOIN US</p>
            <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] md:text-[28px]">
              회원가입 문의
            </h2>

            <p className="mt-6 text-[18px] font-bold leading-[1.5] md:text-[20px]">
              원주의 청년 소상공인,
              <br />
              혼자가 아닙니다.
            </p>

            <p className="hand absolute right-6 top-24 hidden text-right text-[22px] leading-[1.5] text-brand-deep xl:block">
              함께여서
              <br />더 멀리 갈 수 있습니다.
            </p>

            <p className="mt-4 text-[13.5px] leading-[1.8] text-ink-soft">
              함께하는 순간, 더 큰 기회가 시작됩니다.
              <br />
              원주청년소상공인협회는 지역의 청년 소상공인들이 서로 연결되고, 성장할 수
              있도록 다양한 지원과 네트워크를 제공합니다.
            </p>

            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              회원가입 안내 보기 <span aria-hidden>→</span>
            </Link>

            <ul className="mt-8 space-y-4">
              {JOIN_POINTS.map((p, i) => (
                <li key={p.title} className="flex gap-3.5">
                  <span
                    aria-hidden
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white ${accentAt(i).text}`}
                  >
                    <Icon name={p.icon} className="h-[20px] w-[20px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold">{p.title}</span>
                    <span className="mt-1 block text-[12.5px] leading-[1.6] text-ink-soft">
                      {p.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 오시는 길 */}
      <section className="bg-mist px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,4fr)_minmax(0,2.5fr)] lg:gap-8">
          <div>
            <p className="text-[12px] font-bold tracking-[0.12em] text-brand">LOCATION</p>
            <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] md:text-[28px]">
              오시는 길
            </h2>
            <p className="mt-4 text-[13.5px] leading-[1.8] text-ink-soft">
              원주청년소상공인협회는 항상 여러분을 기다립니다.
              <br />
              방문 전 미리 연락주시면 더 친절히 안내해 드리겠습니다.
            </p>
            <a
              href={site.mapUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-brand"
            >
              <PinIcon className="h-[16px] w-[16px]" />
              네이버 지도에서 보기 <span aria-hidden>→</span>
            </a>
          </div>

          {/* 지도는 좌표·지도 API 연동과 함께 2단계에서 붙인다 */}
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-line bg-white text-center">
            <p className="px-6 text-[13px] leading-[1.7] text-muted">
              지도는 다음 단계에서 표시됩니다.
              <br />
              <span className="font-semibold text-ink">{site.address}</span>
            </p>
          </div>

          <ul className="space-y-3">
            {[
              { icon: PinIcon, label: "주소", body: `${site.address}\n${site.addressDetail}` },
              { icon: BusIcon, label: "대중교통", body: site.transport },
              { icon: CarIcon, label: "주차안내", body: site.parking },
            ].map((row) => (
              <li key={row.label} className="flex gap-3 rounded-xl bg-white p-4">
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-brand"
                >
                  <row.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold">{row.label}</span>
                  <span className="mt-1 block whitespace-pre-line text-[12.5px] leading-[1.65] text-ink-soft">
                    {row.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 자주 묻는 질문 */}
      <section className="px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <p className="text-[12px] font-bold tracking-[0.12em] text-brand">FAQ</p>
            <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] md:text-[28px]">
              자주 묻는 질문
            </h2>
            <p className="mt-4 text-[13.5px] leading-[1.8] text-ink-soft">
              자주 문의주시는 내용을 모았습니다.
              <br />더 궁금한 점이 있다면 언제든지 문의해주세요.
            </p>
          </div>

          <FaqList faqs={faqs} />
        </div>
      </section>
    </>
  );
}
