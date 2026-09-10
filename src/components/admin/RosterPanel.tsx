"use client";

import { useActionState, useState } from "react";
import {
  addMember,
  applyRoster,
  exportRoster,
  previewRoster,
  type ApplyResult,
  type RosterPreview,
} from "@/lib/admin/rosterActions";

/**
 * 회원 명단 엑셀 올리기 · 내려받기 · 직접 추가.
 *
 * 엑셀은 바로 반영하지 않는다. 먼저 무엇이 어떻게 바뀌는지 보여주고,
 * 확인한 뒤 두 번째 버튼을 눌러야 저장된다.
 * 명단을 통째로 바꾸는 일이라 되돌리기가 어렵기 때문이다.
 */
export default function RosterPanel() {
  const [preview, previewAction, previewing] = useActionState<RosterPreview | null, FormData>(
    previewRoster,
    null,
  );
  const [applied, applyAction, applying] = useActionState<ApplyResult | null, FormData>(
    applyRoster,
    null,
  );
  const [addState, addAction, adding] = useActionState<ApplyResult | null, FormData>(
    addMember,
    null,
  );

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function download() {
    setDownloading(true);
    setDownloadError(null);

    const result = await exportRoster();

    if (!result.ok || !result.file) {
      setDownloadError(result.message);
      setDownloading(false);
      return;
    }

    // base64 로 받은 엑셀을 파일로 저장한다
    const bytes = Uint8Array.from(atob(result.file), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `원청협_회원명단_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloading(false);
  }

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">회원 명단 관리</h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg border border-line px-4 py-2 text-[13px] font-bold transition-colors hover:border-brand hover:text-brand"
          >
            + 한 명 추가
          </button>
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="rounded-lg border border-line px-4 py-2 text-[13px] font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          >
            {downloading ? "만드는 중…" : "엑셀 내려받기"}
          </button>
        </div>
      </div>

      {downloadError && (
        <p className="mt-2 text-[12.5px] font-semibold text-coral">{downloadError}</p>
      )}

      {/* 한 명 추가 */}
      {showAdd && (
        <form action={addAction} className="mt-4 rounded-lg border border-line p-4">
          <p className="text-[13px] font-bold">회원 한 명 추가</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
            <input name="name" required placeholder="이름" className={field} />
            <input name="phone" placeholder="연락처" className={field} />
            <input name="email" type="email" placeholder="이메일 (선택)" className={field} />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="mt-2.5 rounded-lg bg-brand px-5 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
          >
            {adding ? "넣는 중…" : "명부에 넣기"}
          </button>
          {addState && (
            <p
              role="status"
              className={`mt-2 text-[12.5px] font-semibold ${
                addState.ok ? "text-brand" : "text-coral"
              }`}
            >
              {addState.message}
            </p>
          )}
        </form>
      )}

      {/* 엑셀 올리기 */}
      <form action={previewAction} className="mt-4 rounded-lg border border-line p-4">
        <p className="text-[13px] font-bold">엑셀로 한 번에 올리기</p>
        <p className="mt-1.5 text-[12.5px] leading-[1.75] text-ink-soft">
          관리국에서 쓰시는 엑셀을 그대로 올리시면 됩니다. 칸 순서는 상관없고,
          머리글에 <b className="text-ink">이름</b>이 들어간 표면 읽습니다.
          연락처·업장명·업종·법정동·이메일도 있으면 함께 읽습니다.
        </p>
        <p className="mt-2 text-[12.5px] leading-[1.75] text-muted">
          올리면 <b className="text-ink">먼저 무엇이 바뀌는지 보여드립니다.</b> 확인하신 뒤에
          적용 버튼을 눌러야 실제로 저장됩니다.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            required
            className="block min-w-0 flex-1 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-mist file:px-3 file:py-2 file:text-[12.5px] file:font-bold"
          />
          <button
            type="submit"
            disabled={previewing}
            className="shrink-0 rounded-lg border border-line px-5 py-2.5 text-[13.5px] font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          >
            {previewing ? "읽는 중…" : "읽어보기"}
          </button>
        </div>

        {preview && !preview.ok && (
          <p className="mt-2 text-[12.5px] font-semibold text-coral">{preview.message}</p>
        )}
      </form>

      {/* 확인 화면 */}
      {preview?.ok && (
        <form action={applyAction} className="mt-3 rounded-lg border-2 border-brand p-4">
          <input type="hidden" name="payload" value={preview.payload ?? ""} />
          <input
            type="hidden"
            name="withdrawIds"
            value={(preview.missing ?? []).map((m) => m.id).join(",")}
          />

          <p className="text-[13.5px] font-bold">{preview.message} 이렇게 바뀝니다.</p>

          {preview.mapping && Object.keys(preview.mapping).length > 0 && (
            <p className="mt-1.5 text-[12px] text-muted">
              읽은 칸:{" "}
              {Object.entries(preview.mapping)
                .map(([k, v]) => `${v}`)
                .join(" · ")}
            </p>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-brand-tint p-3.5">
              <p className="tnum text-[22px] font-bold text-brand-deep">
                {preview.added?.length ?? 0}
              </p>
              <p className="text-[12.5px] font-semibold">새로 들어옴</p>
            </div>
            <div className="rounded-lg bg-mist p-3.5">
              <p className="tnum text-[22px] font-bold">{preview.kept ?? 0}</p>
              <p className="text-[12.5px] font-semibold">그대로 유지</p>
            </div>
            <div className="rounded-lg bg-amber-tint p-3.5">
              <p className="tnum text-[22px] font-bold text-amber">
                {preview.missing?.length ?? 0}
              </p>
              <p className="text-[12.5px] font-semibold">엑셀에 없음</p>
            </div>
          </div>

          {(preview.added?.length ?? 0) > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[12.5px] font-bold">
                새로 들어오는 분 보기
              </summary>
              <p className="mt-1.5 text-[12px] leading-[1.9] text-ink-soft">
                {preview.added?.map((a) => a.name).join(" · ")}
              </p>
            </details>
          )}

          {(preview.missing?.length ?? 0) > 0 && (
            <div className="mt-3 rounded-lg bg-amber-tint p-3.5">
              <p className="text-[12.5px] font-bold text-amber">
                엑셀에 없는 기존 회원 {preview.missing?.length}명
              </p>
              <p className="mt-1 text-[12px] leading-[1.8] text-ink-soft">
                {preview.missing
                  ?.slice(0, 40)
                  .map((m) => (m.isOfficer ? `${m.name}(임원)` : m.name))
                  .join(" · ")}
                {(preview.missing?.length ?? 0) > 40 && " …"}
              </p>

              {preview.missing?.some((m) => m.isOfficer) && (
                <p className="mt-2 text-[12px] font-semibold text-coral">
                  임원이 포함되어 있습니다. 엑셀에서 빠진 것은 아닌지 확인해 주세요.
                </p>
              )}

              <label className="mt-2.5 flex items-start gap-2 text-[12.5px] font-semibold">
                <input
                  type="checkbox"
                  name="withdrawMissing"
                  className="mt-0.5 h-4 w-4 accent-coral"
                />
                <span>
                  이분들을 탈퇴 처리합니다
                  <span className="block font-normal text-muted">
                    체크하지 않으면 명부에 그대로 남습니다. 갱신 때 나가신 분이 확실할 때만
                    체크해 주세요.
                  </span>
                </span>
              </label>
            </div>
          )}

          {(preview.warnings?.length ?? 0) > 0 && (
            <ul className="mt-3 space-y-1 text-[12px] text-muted">
              {preview.warnings?.slice(0, 5).map((w, i) => (
                <li key={i}>· {w}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={applying}
            className="mt-3.5 rounded-lg bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
          >
            {applying ? "저장 중…" : "이대로 명부에 반영하기"}
          </button>

          {applied && (
            <p
              role="status"
              className={`mt-2 text-[12.5px] font-semibold ${
                applied.ok ? "text-brand" : "text-coral"
              }`}
            >
              {applied.message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
