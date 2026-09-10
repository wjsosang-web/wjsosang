"use client";

import { useActionState } from "react";
import { saveNotifyRoutes, type ActionResult } from "@/lib/admin/actions";

/**
 * 문의 종류마다 알림 받을 직책을 정한다.
 *
 * 사람 이름이 아니라 직책으로 적는다. 임기가 바뀌어 사람이 달라져도
 * 조직도만 고치면 알림이 새 담당자에게 따라간다.
 * 여러 명을 적을 수 있다. 한 명만 두면 그분이 자리를 비웠을 때 문의가 묻힌다.
 */
export default function NotifyRoutesForm({
  routes,
  kinds,
  /** 지금 조직도에 있는 직책들 — 오타를 막으려고 보여준다 */
  availableTitles,
  /** 그 직책 중 텔레그램을 등록한 사람 수 */
  reachable,
}: {
  routes: Record<string, string[]>;
  kinds: string[];
  availableTitles: string[];
  reachable: Record<string, boolean>;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveNotifyRoutes,
    null,
  );

  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-bold">문의 알림 받을 사람</h2>
      <p className="mt-1 text-[12.5px] leading-[1.75] text-muted">
        홈페이지로 문의가 들어오면 여기 적힌 직책의 담당자에게 텔레그램이 갑니다.
        <b className="text-ink"> 쉼표로 여러 명</b>을 적을 수 있습니다. 사람 이름이 아니라
        직책으로 적어두면, 임기가 바뀌어도 조직도만 고치면 알림이 새 담당자에게
        따라갑니다.
      </p>

      <ul className="mt-4 space-y-3">
        {kinds.map((kind) => (
          <li key={kind}>
            <label
              htmlFor={`kind-${kind}`}
              className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-bold"
            >
              {kind}
              {reachable[kind] === false && (
                <span className="rounded bg-amber-tint px-1.5 py-0.5 text-[11px] font-bold text-amber">
                  텔레그램 등록자 없음
                </span>
              )}
            </label>
            <input
              id={`kind-${kind}`}
              name={`kind:${kind}`}
              defaultValue={(routes[kind] ?? []).join(", ")}
              placeholder="사무국장, 회장"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand"
            />
          </li>
        ))}
      </ul>

      {availableTitles.length > 0 && (
        <details className="mt-3.5 rounded-lg bg-mist p-3.5">
          <summary className="cursor-pointer text-[12.5px] font-bold">
            지금 조직도에 있는 직책 보기
          </summary>
          <p className="mt-2 text-[12px] leading-[1.9] text-ink-soft">
            {availableTitles.join(" · ")}
          </p>
          <p className="mt-2 text-[11.5px] text-muted">
            여기 없는 직책을 적으면 아무에게도 가지 않습니다. 그대로 옮겨 적어 주세요.
          </p>
        </details>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        {state && (
          <span
            role="status"
            className={`text-[13px] font-semibold ${state.ok ? "text-brand" : "text-coral"}`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
