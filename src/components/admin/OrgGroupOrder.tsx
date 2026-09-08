"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveOrgGroupOrder, type ActionResult } from "@/lib/admin/actions";
import type { OrgGroup } from "@/lib/types";

/**
 * 협회소개에서 분류(회장단·이사회·운영진·역대 회장)가 나오는 순서를 정한다.
 * 위/아래로 옮긴 뒤 저장하면 조직도 탭 순서가 바뀐다.
 */
export default function OrgGroupOrder({ current }: { current: OrgGroup[] }) {
  const [order, setOrder] = useState(current);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveOrgGroupOrder,
    null,
  );

  const changed = order.join("|") !== current.join("|");

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = order.slice();
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
  }

  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5">
      <input type="hidden" name="order" value={order.join(",")} />

      <h2 className="text-[15px] font-bold">분류 표시 순서</h2>
      <p className="mt-1 text-[12.5px] text-muted">
        협회소개 화면에서 이 순서대로 탭이 나옵니다. 사람 순서는 각 임원의 &quot;표시
        순서&quot;로 정합니다.
      </p>

      <ol className="mt-3 space-y-1.5">
        {order.map((g, i) => (
          <li
            key={g}
            className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-2.5"
          >
            <span className="tnum w-5 shrink-0 text-center text-[12.5px] font-bold text-muted">
              {i + 1}
            </span>
            <span className="flex-1 text-[14px] font-semibold">{g}</span>

            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={`${g} 위로`}
                className="h-8 w-8 rounded-md border border-line text-[13px] transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === order.length - 1}
                aria-label={`${g} 아래로`}
                className="h-8 w-8 rounded-md border border-line text-[13px] transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-3.5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !changed}
          className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {pending ? "저장 중…" : "순서 저장"}
        </button>

        {changed && !pending && (
          <button
            type="button"
            onClick={() => setOrder(current)}
            className="text-[13px] font-semibold text-muted hover:text-brand"
          >
            되돌리기
          </button>
        )}

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
