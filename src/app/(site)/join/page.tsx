import type { Metadata } from "next";
import Link from "next/link";
import AccountCopy from "@/components/member/AccountCopy";
import { getJoinGuide, getSiteInfo } from "@/lib/repo";
import { getCurrentMember } from "@/lib/supabase/member";

export const metadata: Metadata = {
  title: "회원가입 안내",
  description: "원주청년소상공인협회 가입 자격과 회비를 안내합니다.",
};

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const [guide, site, current] = await Promise.all([
    getJoinGuide(),
    getSiteInfo(),
    getCurrentMember(),
  ]);

  const signedIn = Boolean(current);

  return (
    <article className="pb-16">
      {/* 머리말 */}
      <section className="relative isolate overflow-hidden bg-forest px-5 py-14 text-white md:py-20">
        <span
          aria-hidden
          className="absolute -right-24 -top-24 -z-10 block h-[320px] w-[320px] rounded-full bg-brand/25 blur-3xl"
        />
        <div className="mx-auto max-w-[880px]">
          <p className="text-[12.5px] font-bold tracking-[0.16em] text-brand-light">회원가입 안내</p>
          <h1 className="mt-4 text-[26px] font-bold leading-[1.35] tracking-[-0.02em] md:text-[36px]">
            {guide.heading}
          </h1>
          <p className="mt-5 max-w-[640px] text-[14.5px] leading-[1.9] text-white/85 md:text-[16px]">
            {guide.lead}
          </p>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-[880px] space-y-8 px-5 md:mt-14">
        {/* 가입 자격 */}
        <section className="rounded-2xl border-2 border-brand bg-brand-tint-2 p-6 md:p-7">
          <p className="text-[12.5px] font-bold tracking-[0.1em] text-brand">가입 자격</p>
          <p className="mt-2.5 text-[18px] font-bold leading-[1.55] tracking-[-0.01em] md:text-[21px]">
            {guide.eligibility}
          </p>
        </section>

        {/* 회비 */}
        <section>
          <h2 className="flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.02em]">
            <span aria-hidden className="block h-[19px] w-[3px] rounded bg-brand" />
            회비
          </h2>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {guide.fees.map((fee) => (
              <li key={fee.label} className="rounded-xl border border-line bg-white p-5">
                <p className="text-[13px] font-bold text-muted">{fee.label}</p>
                <p className="tnum mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-brand-deep md:text-[30px]">
                  {fee.amount}
                </p>
                {fee.note && (
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">{fee.note}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <AccountCopy
              bankName={guide.bankName}
              accountNumber={guide.accountNumber}
              accountHolder={guide.accountHolder}
            />
          </div>

          {/* 입금자명 — 여기서 틀리면 재무국이 사람을 못 찾는다 */}
          <div className="mt-3 rounded-xl border border-amber/40 bg-amber-tint p-5">
            <p className="text-[13px] font-bold text-amber">입금자명을 꼭 바꿔주세요</p>
            <p className="mt-2 text-[15px] font-bold leading-[1.6] md:text-[16px]">
              {guide.depositNameRule}
            </p>
            {guide.depositExample && (
              <p className="mt-1.5 text-[13.5px] text-ink-soft">예) {guide.depositExample}</p>
            )}
          </div>
        </section>

        {/* 꼭 알아두실 것 */}
        {guide.notices.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.02em]">
              <span aria-hidden className="block h-[19px] w-[3px] rounded bg-coral" />
              꼭 알아두실 것
            </h2>

            <ul className="mt-4 space-y-2.5">
              {guide.notices.map((notice, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-xl border border-line bg-white px-5 py-4"
                >
                  <span
                    aria-hidden
                    className="tnum mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-coral-tint text-[11px] font-bold text-coral"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[14.5px] font-semibold leading-[1.75] md:text-[15.5px]">
                    {notice}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 입금 뒤 */}
        {guide.afterPayment && (
          <section className="rounded-2xl bg-mist p-6 text-center md:p-7">
            <p className="text-[12.5px] font-bold tracking-[0.1em] text-brand">입금하신 뒤</p>
            <p className="mt-2.5 text-[16px] font-bold leading-[1.65] md:text-[18px]">
              {guide.afterPayment}
            </p>
          </section>
        )}

        {/* 가입 절차 */}
        <section>
          <h2 className="flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.02em]">
            <span aria-hidden className="block h-[19px] w-[3px] rounded bg-brand" />
            가입 절차
          </h2>

          <ol className="mt-4 space-y-2.5">
            {[
              { step: "문의", text: "아래 버튼으로 가입 문의를 남기시면 인사국에서 연락드립니다." },
              { step: "가입 승인", text: "인사국에서 가입 자격을 확인하고 회비 입금을 안내드립니다." },
              {
                step: "홈페이지 계정 만들기",
                text: "승인이 끝나면 홈페이지에서 회원 로그인을 만들어 주세요. 인사국이 확인 후 열어드립니다.",
              },
            ].map((row, i) => (
              <li key={row.step} className="flex gap-3.5 rounded-xl border border-line bg-white px-5 py-4">
                <span
                  aria-hidden
                  className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-white"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[15px] font-bold">{row.step}</span>
                  <span className="mt-1 block text-[13.5px] leading-[1.7] text-ink-soft">
                    {row.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* 문의 */}
        <section className="rounded-2xl bg-brand p-6 text-white md:p-8">
          <p className="text-[18px] font-bold leading-[1.5] md:text-[21px]">준비되셨나요?</p>
          <p className="mt-2 text-[14px] leading-[1.8] text-white/85 md:text-[15px]">
            가입 문의를 남겨주시면 인사국에서 연락드립니다.
            {site.phoneOwner && ` 급하시면 ${site.phone} (${site.phoneOwner}) 로 전화 주셔도 됩니다.`}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/contact?kind=join"
              className="rounded-lg bg-white px-7 py-3.5 text-[15px] font-bold text-brand-deep transition-colors hover:bg-mist"
            >
              가입 문의하기 <span aria-hidden>→</span>
            </Link>
            <Link
              href={signedIn ? "/my" : "/login"}
              className="rounded-lg border border-white/50 px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
            >
              {signedIn ? "내 정보 보기" : "가입 승인받으셨나요? 로그인"}
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
