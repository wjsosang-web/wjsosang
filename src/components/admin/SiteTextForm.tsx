"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/admin/actions";

export interface TextField {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  hint?: string;
  /** long = 여러 줄, half = 한 줄에 두 칸 */
  type?: "short" | "long" | "half";
  rows?: number;
  required?: boolean;
}

/**
 * 칸이 정해진 글 편집 화면.
 *
 * 협회 기본정보 · 협회 이야기 · 회장 인사말처럼 "항목이 정해진 한 벌"에 쓴다.
 * 저장 동작을 넘겨받으므로 화면마다 폼을 새로 만들지 않아도 된다.
 */
export default function SiteTextForm({
  title,
  description,
  fields,
  action: saveAction,
}: {
  title: string;
  description?: string;
  fields: TextField[];
  action: (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveAction,
    null,
  );

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";

  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {description && <p className="mt-1 text-[12.5px] text-muted">{description}</p>}

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.type === "half" ? undefined : "sm:col-span-2"}>
            <label htmlFor={f.name} className="mb-1.5 block text-[12.5px] font-bold">
              {f.label}
              {f.required && <span className="ml-1 text-brand">*</span>}
            </label>

            {f.type === "long" ? (
              <textarea
                id={f.name}
                name={f.name}
                rows={f.rows ?? 3}
                required={f.required}
                defaultValue={f.defaultValue ?? ""}
                placeholder={f.placeholder}
                className={`${field} resize-y`}
              />
            ) : (
              <input
                id={f.name}
                name={f.name}
                required={f.required}
                defaultValue={f.defaultValue ?? ""}
                placeholder={f.placeholder}
                className={field}
              />
            )}

            {f.hint && <p className="mt-1 text-[11.5px] text-muted">{f.hint}</p>}
          </div>
        ))}
      </div>

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
