"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { linkMyAccount, type MemberActionResult } from "@/lib/member/actions";

/**
 * 로그인한 계정을 협회 명단의 내 이름과 잇는 본인 확인.
 *
 * 협회 명단은 관리국이 엑셀로 관리해 온 것이라 로그인 계정이 없다.
 * 카카오로 처음 로그인하면 이 화면을 한 번 거치고, 그 뒤로는 안 나온다.
 */
export default function LinkAccountForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<MemberActionResult | null, FormData>(
    linkMyAccount,
    null,
  );

  // 연결되면 화면을 다시 그려 내 정보가 나오게 한다
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  return (
    <div className="rounded-2xl border border-line bg-white p-6 md:p-7">
      <h2 className="text-[18px] font-bold tracking-[-0.01em]">본인 확인</h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.8] text-ink-soft">
        협회 명단에서 회원님을 찾겠습니다.
        <br />
        <b>협회에 등록하신 이름과 휴대폰 번호</b>를 적어 주세요. 처음 한 번만 하면 됩니다.
      </p>

      <form action={action} className="mt-5 space-y-3">
        <label className="block">
          <span className="text-[13px] font-bold">이름</span>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="홍길동"
            className="mt-1.5 w-full rounded-lg border border-line px-4 py-3 text-[15px] outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-bold">휴대폰 번호</span>
          <input
            name="phone"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-0000-0000"
            className="mt-1.5 w-full rounded-lg border border-line px-4 py-3 text-[15px] outline-none focus:border-brand"
          />
          <span className="mt-1.5 block text-[12px] text-muted">
            하이픈(-)은 있어도 없어도 됩니다.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
        >
          {pending ? "확인하는 중…" : "확인"}
        </button>
      </form>

      {state && !state.ok && (
        <p className="mt-4 rounded-lg bg-coral-tint px-4 py-3 text-[13px] leading-[1.7] text-coral">
          {state.message}
        </p>
      )}
    </div>
  );
}
