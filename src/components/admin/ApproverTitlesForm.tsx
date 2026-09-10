"use client";

import { useActionState } from "react";
import { saveApproverTitles, type ActionResult } from "@/lib/admin/actions";

/**
 * 어떤 직책에 회원 승인 권한을 줄지 정한다.
 *
 * 회장이 바뀌면 부회장·이사회·임원진이 통째로 바뀌는데, 사람마다 권한을
 * 다시 매기면 빠뜨리기 쉽고 그만둔 분의 권한이 남는다.
 * 직책으로 정해두면 조직도만 고쳐도 권한이 따라 움직인다.
 */
export default function ApproverTitlesForm({ titles }: { titles: string[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveApproverTitles,
    null,
  );

  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-bold">승인 권한을 갖는 직책</h2>
      <p className="mt-1 text-[12.5px] leading-[1.7] text-muted">
        여기 적힌 직책을 맡은 분은 조직도에 등록되는 즉시 회원 승인을 할 수 있습니다.
        임기가 끝나 직책이 바뀌면 권한도 자동으로 따라 옮겨갑니다.
        <br />
        쉼표로 구분해 주세요. 운영자는 직책과 상관없이 언제나 할 수 있습니다.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          name="titles"
          defaultValue={titles.join(", ")}
          placeholder="회장, 부회장, 사무국장, 인사국장, 인사부국장"
          className="min-w-[280px] flex-1 rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>

      {state && (
        <p
          role="status"
          className={`mt-2.5 text-[13px] font-semibold ${state.ok ? "text-brand" : "text-coral"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
