"use client";

import { useActionState } from "react";
import { requestMemberDoc } from "@/lib/admin/actions";

type Result = { ok: boolean; message: string; url?: string };

/**
 * 회원 전용 자료 내려받기 (협회 정관).
 *
 * 아직 회원 로그인이 없어서, 협회원에게만 알려 준 코드로 문을 연다.
 * 파일은 비공개 저장소에 있고, 코드가 맞을 때만 5분짜리 주소가 만들어진다.
 * 주소를 퍼뜨려도 오래 쓰이지 않는다.
 */
export default function MemberDocDownload({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [state, action, pending] = useActionState<Result | null, FormData>(
    async (prev, form) => {
      const result = await requestMemberDoc(prev, form);
      // 코드가 맞으면 바로 내려받기가 시작된다
      if (result.ok && result.url) window.location.href = result.url;
      return result;
    },
    null,
  );

  return (
    <div className="rounded-2xl border border-line bg-white p-6 md:p-7">
      <p className="inline-flex items-center gap-1.5 rounded-md bg-brand-tint px-2.5 py-1 text-[11.5px] font-bold text-brand-deep">
        회원 전용
      </p>

      <h3 className="mt-3 text-[17px] font-bold tracking-[-0.01em]">{title}</h3>
      {description && (
        <p className="mt-2 text-[13.5px] leading-[1.75] text-ink-soft">{description}</p>
      )}

      <form action={action} className="mt-4 flex flex-wrap items-start gap-2">
        <label className="sr-only" htmlFor="member-code">
          협회원 코드
        </label>
        <input
          id="member-code"
          name="code"
          required
          autoComplete="off"
          placeholder="협회원 코드"
          className="min-w-[160px] flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {pending ? "확인 중…" : "내려받기"}
        </button>
      </form>

      {state && (
        <p
          role="status"
          className={`mt-2.5 text-[13px] font-semibold ${state.ok ? "text-brand" : "text-coral"}`}
        >
          {state.message}
        </p>
      )}

      <p className="mt-3 text-[11.5px] leading-[1.7] text-muted">
        코드는 협회원에게만 안내됩니다. 모르시면 협회 사무국으로 문의해 주세요.
      </p>
    </div>
  );
}
