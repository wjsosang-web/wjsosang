"use client";

import { useActionState, useState } from "react";
import { saveSiteList, type ActionResult } from "@/lib/admin/actions";

export interface ListField {
  name: string;
  label: string;
  placeholder?: string;
  /** long = 여러 줄 입력칸 */
  type?: "short" | "long";
  /** 고를 수 있는 값이 정해져 있으면 */
  options?: string[];
}

type Row = Record<string, string | boolean>;

/**
 * 줄을 더하고 지우는 편집 화면.
 *
 * 주요사업 · 연혁 · 자주 묻는 질문처럼 "같은 모양이 여러 개"인 것에 쓴다.
 * 항목마다 화면을 따로 만들지 않아도 되도록 칸 정의만 받아서 그린다.
 */
export default function ListEditor({
  settingKey,
  title,
  description,
  fields,
  rows: initial,
  newRow,
}: {
  /** site_settings 의 키 — programs / history / faqs / stats */
  settingKey: string;
  title: string;
  description?: string;
  fields: ListField[];
  rows: Row[];
  /** 줄을 더할 때 넣을 기본값 */
  newRow: Row;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveSiteList,
    null,
  );

  const field =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-brand";

  function update(i: number, name: string, value: string | boolean) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [name]: value } : row)));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.length) return;
    const next = rows.slice();
    [next[from], next[to]] = [next[to], next[from]];
    setRows(next);
  }

  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5">
      <input type="hidden" name="key" value={settingKey} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold">{title}</h2>
          {description && <p className="mt-1 text-[12.5px] text-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, { ...newRow, id: `${settingKey}-${Date.now()}` }])}
          className="shrink-0 rounded-lg border border-line px-4 py-2 text-[13px] font-bold transition-colors hover:border-brand hover:text-brand"
        >
          + 줄 추가
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line py-8 text-center text-[13px] text-muted">
          아직 없습니다. [줄 추가]를 눌러 주세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((row, i) => (
            <li key={String(row.id ?? i)} className="rounded-lg border border-line p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="tnum grid h-5 w-5 place-items-center rounded bg-mist text-[11px] font-bold text-muted">
                  {i + 1}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label="위로"
                  className="h-7 w-7 rounded border border-line text-[12px] hover:border-brand hover:text-brand disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === rows.length - 1}
                  aria-label="아래로"
                  className="h-7 w-7 rounded border border-line text-[12px] hover:border-brand hover:text-brand disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                  className="rounded border border-line px-2.5 py-1 text-[12px] font-semibold text-muted hover:border-coral hover:text-coral"
                >
                  삭제
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {fields.map((f) => (
                  <label
                    key={f.name}
                    className={f.type === "long" ? "sm:col-span-2" : undefined}
                  >
                    <span className="mb-1 block text-[11.5px] font-semibold text-muted">
                      {f.label}
                    </span>

                    {f.options ? (
                      <select
                        value={String(row[f.name] ?? "")}
                        onChange={(e) => update(i, f.name, e.target.value)}
                        className={field}
                      >
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "long" ? (
                      <textarea
                        rows={2}
                        value={String(row[f.name] ?? "")}
                        onChange={(e) => update(i, f.name, e.target.value)}
                        placeholder={f.placeholder}
                        className={`${field} resize-y`}
                      />
                    ) : (
                      <input
                        value={String(row[f.name] ?? "")}
                        onChange={(e) => update(i, f.name, e.target.value)}
                        placeholder={f.placeholder}
                        className={field}
                      />
                    )}
                  </label>
                ))}

                {"upcoming" in newRow && (
                  <label className="flex items-center gap-2 text-[12.5px] sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={row.upcoming === true}
                      onChange={(e) => update(i, "upcoming", e.target.checked)}
                      className="h-4 w-4 accent-brand"
                    />
                    아직 오지 않은 계획 (연혁에서 다르게 표시됩니다)
                  </label>
                )}
              </div>
            </li>
          ))}
        </ul>
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
