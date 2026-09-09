"use client";

import { useActionState } from "react";
import { saveMemberDoc, type ActionResult } from "@/lib/admin/actions";

/**
 * 회원 전용 자료 올리기 (협회 정관).
 *
 * 파일은 비공개 저장소에 들어가고, 코드를 맞힌 사람에게만 5분짜리 주소가 열린다.
 * 파일 자체는 20MB 아래이므로 폼으로 보내도 전송 한도에 걸리지 않는다.
 */
export default function MemberDocForm({
  doc,
}: {
  doc: { title: string; description: string; code: string; fileName: string | null } | null;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveMemberDoc,
    null,
  );

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";
  const label = "mb-1.5 block text-[12.5px] font-bold";

  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-bold">회원 전용 자료 (협회 정관)</h2>
      <p className="mt-1 text-[12.5px] leading-[1.7] text-muted">
        협회소개 화면에 나오고, <b className="text-ink">코드를 아는 사람만</b> 내려받을 수
        있습니다. 파일은 아무나 열 수 없는 곳에 저장되며, 코드가 맞을 때만 5분 동안
        열리는 주소가 만들어집니다.
      </p>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="doc-title" className={label}>
            자료 이름 <span className="text-brand">*</span>
          </label>
          <input
            id="doc-title"
            name="title"
            required
            defaultValue={doc?.title ?? "원주청년소상공인협회 정관"}
            className={field}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="doc-description" className={label}>
            설명
          </label>
          <textarea
            id="doc-description"
            name="description"
            rows={2}
            defaultValue={doc?.description ?? ""}
            placeholder="협회 운영의 기준이 되는 문서입니다."
            className={`${field} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="doc-code" className={label}>
            협회원 코드 <span className="text-brand">*</span>
          </label>
          <input
            id="doc-code"
            name="code"
            required
            autoComplete="off"
            defaultValue={doc?.code ?? ""}
            placeholder="회원에게 안내할 코드"
            className={field}
          />
          <p className="mt-1 text-[11.5px] text-muted">
            단톡방 공지 등으로 회원분들께 알려 주세요. 바꾸면 예전 코드는 바로 막힙니다.
          </p>
        </div>

        <div>
          <label htmlFor="doc-file" className={label}>
            파일 {!doc?.fileName && <span className="text-brand">*</span>}
          </label>
          <input
            id="doc-file"
            name="file"
            type="file"
            accept=".pdf,.hwp,.hwpx,.doc,.docx"
            className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-mist file:px-3 file:py-2 file:text-[12.5px] file:font-bold"
          />
          <p className="mt-1 text-[11.5px] text-muted">
            {doc?.fileName
              ? `지금 올라간 파일: ${doc.fileName} — 새로 고르면 바뀝니다.`
              : "PDF 를 권합니다. 20MB 이하."}
          </p>
        </div>
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
