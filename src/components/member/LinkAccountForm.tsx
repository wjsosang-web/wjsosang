"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyForMembership,
  linkMyAccount,
  type MemberActionResult,
} from "@/lib/member/actions";

/**
 * 로그인은 했는데 협회 명단에 아직 이어지지 않은 사람이 보는 화면.
 *
 * 두 종류가 온다.
 *   이미 회원인 분  — 관리국 엑셀 명단에는 있는데 로그인 계정이 없다.
 *                    이름·휴대폰으로 본인 확인만 하면 된다.
 *   처음 오신 분    — 명단에 없다. 가입 신청을 해야 한다.
 *
 * 둘을 한 화면에 두고 고르게 한다. 화면을 나누면 "나는 어느 쪽이지" 하고
 * 멈추는 사람이 생긴다. 기본은 본인 확인이다. 134명이 이미 회원이라
 * 그쪽이 훨씬 많다.
 */

type Tab = "link" | "apply";

export default function LinkAccountForm() {
  const [tab, setTab] = useState<Tab>("link");

  return (
    <div className="rounded-2xl border border-line bg-white p-6 md:p-7">
      <div className="flex gap-1.5 rounded-xl bg-mist p-1.5">
        <TabButton active={tab === "link"} onClick={() => setTab("link")}>
          이미 회원이에요
        </TabButton>
        <TabButton active={tab === "apply"} onClick={() => setTab("apply")}>
          가입 신청할게요
        </TabButton>
      </div>

      {tab === "link" ? <LinkPanel /> : <ApplyPanel />}
    </div>
  );
}

function LinkPanel() {
  const router = useRouter();
  const [state, action, pending] = useActionState<MemberActionResult | null, FormData>(
    linkMyAccount,
    null,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  return (
    <>
      <h2 className="mt-6 text-[18px] font-bold tracking-[-0.01em]">본인 확인</h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.8] text-ink-soft">
        협회 명단에서 회원님을 찾겠습니다.
        <br />
        <b>협회에 등록하신 이름과 휴대폰 번호</b>를 적어 주세요. 처음 한 번만 하면 됩니다.
      </p>

      <form action={action} className="mt-5 space-y-3">
        <Field name="name" label="이름" placeholder="홍길동" autoComplete="name" />
        <Field
          name="phone"
          label="휴대폰 번호"
          placeholder="010-0000-0000"
          type="tel"
          autoComplete="tel"
          hint="하이픈(-)은 있어도 없어도 됩니다."
        />
        <Submit pending={pending}>확인</Submit>
      </form>

      <Notice state={state} />

      <p className="mt-4 text-[12.5px] leading-[1.7] text-muted">
        찾지 못했다고 나오면 위쪽 <b>[가입 신청할게요]</b> 를 눌러 주세요.
      </p>
    </>
  );
}

function ApplyPanel() {
  const router = useRouter();
  const [state, action, pending] = useActionState<MemberActionResult | null, FormData>(
    applyForMembership,
    null,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  return (
    <>
      <h2 className="mt-6 text-[18px] font-bold tracking-[-0.01em]">가입 신청</h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.8] text-ink-soft">
        세 가지만 적어 주시면 됩니다. 인사국에서 확인 후 연락드립니다.
      </p>

      <form action={action} className="mt-5 space-y-3">
        <Field name="name" label="이름" placeholder="홍길동" autoComplete="name" />
        <Field name="shopName" label="업장명" placeholder="원청협 커피" autoComplete="organization" />
        <Field
          name="phone"
          label="연락처"
          placeholder="010-0000-0000"
          type="tel"
          autoComplete="tel"
        />
        <Submit pending={pending}>가입 신청하기</Submit>
      </form>

      <Notice state={state} />

      <div className="mt-5 rounded-xl bg-mist p-4 text-[12.5px] leading-[1.8] text-ink-soft">
        <p className="font-bold text-ink">알아두실 것</p>
        <p className="mt-1.5">
          · 만 45세 이하 원주 소상공인이 대상입니다.
          <br />· 신청하신다고 바로 회원이 되는 것은 아닙니다. 인사국 승인이 필요합니다.
          <br />· 입회비·연회비 안내는 승인 과정에서 따로 드립니다.
        </p>
        <a
          href="/join"
          className="mt-2.5 inline-block font-bold text-brand underline underline-offset-2"
        >
          가입 안내 자세히 보기 →
        </a>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-lg py-2.5 text-[13.5px] font-bold transition-colors ${
        active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  hint,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold">{label}</span>
      <input
        name={name}
        type={type}
        required
        inputMode={type === "tel" ? "numeric" : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-line px-4 py-3 text-[15px] outline-none focus:border-brand"
      />
      {hint && <span className="mt-1.5 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
    >
      {pending ? "보내는 중…" : children}
    </button>
  );
}

function Notice({ state }: { state: MemberActionResult | null }) {
  if (!state) return null;

  return (
    <p
      className={`mt-4 rounded-lg px-4 py-3 text-[13px] leading-[1.7] ${
        state.ok ? "bg-brand-tint text-brand-deep" : "bg-coral-tint text-coral"
      }`}
    >
      {state.message}
    </p>
  );
}
