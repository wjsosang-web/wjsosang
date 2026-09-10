"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import { savePopup, type ActionResult } from "@/lib/admin/actions";
import type { PopupNotice } from "@/lib/types";

/** 팝업으로 띄울 수 있는 글 — 행사와 게시글 */
export interface PopupSource {
  id: string;
  type: "notice" | "activity" | "event";
  title: string;
  slug: string;
  date: string;
  place: string | null;
  time: string | null;
  summary: string;
}

const TYPE_LABEL: Record<PopupSource["type"], string> = {
  event: "행사",
  notice: "공지사항",
  activity: "활동소식",
};

/** 오늘 날짜를 yyyy-mm-dd 로 (브라우저 시간대 기준) */
function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * 올릴 때 자를 모양.
 *
 * 팝업 창은 어떤 사진이 와도 늘 같은 크기다(가로 4:3 자리).
 * 그래서 여기서 굳이 자르지 않아도 되고, 잘려서 안 보이는 부분은
 * 회원이 사진을 눌러 원본으로 볼 수 있다.
 * 그래도 팝업에 딱 맞게 보이길 원하면 가로형으로 잘라 올리면 된다.
 */
const SHAPES = [
  {
    label: "그대로 올리기",
    aspect: 0,
    hint: "만들어 오신 그대로 올립니다. 팝업에는 가운데가 보이고, 눌러서 전체를 봅니다.",
  },
  { label: "가로형 4:3", aspect: 4 / 3, hint: "팝업 사진 자리에 딱 맞습니다. 잘릴 걱정이 없습니다." },
  { label: "정사각형", aspect: 1, hint: "인스타그램에 올리던 카드 이미지에 맞습니다." },
  { label: "세로형 4:5", aspect: 4 / 5, hint: "포스터처럼 세로로 긴 이미지에 맞습니다." },
];

function toDateInput(iso: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export default function PopupForm({
  popup,
  sources,
}: {
  popup?: PopupNotice;
  /** 팝업으로 바로 띄울 수 있는 행사·게시글 목록 */
  sources: PopupSource[];
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(savePopup, null);

  // 글에서 가져오면 입력칸을 다시 그려야 해서 값을 상태로 들고 있는다.
  const [title, setTitle] = useState(popup?.title ?? "");
  const [body, setBody] = useState(popup?.body ?? "");
  const [linkUrl, setLinkUrl] = useState(popup?.linkUrl ?? "");
  const [linkLabel, setLinkLabel] = useState(popup?.linkLabel ?? "");
  const [startDate, setStartDate] = useState(popup ? toDateInput(popup.startAt) : today());
  const [endDate, setEndDate] = useState(popup ? toDateInput(popup.endAt) : today());
  const [shape, setShape] = useState(SHAPES[0]);

  const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";
  const label = "mb-1.5 block text-[13px] font-bold";

  /** 고른 글의 내용을 팝업 칸에 채운다. 채운 뒤에는 마음대로 고칠 수 있다. */
  function fillFrom(source: PopupSource) {
    setTitle(source.title);

    const lines = [
      source.date && `일시: ${source.date}${source.time ? ` ${source.time}` : ""}`,
      source.place && `장소: ${source.place}`,
      source.summary,
    ].filter(Boolean);
    setBody(lines.join("\n"));

    setLinkUrl(`/activities/${source.slug}`);
    setLinkLabel("자세히 보기");

    // 행사는 그날까지만 띄우는 게 자연스럽다.
    if (source.type === "event" && source.date >= today()) {
      setStartDate(today());
      setEndDate(source.date);
    }
  }

  return (
    <form action={action} className="space-y-6">
      {popup && <input type="hidden" name="id" value={popup.id} />}
      {popup?.imageUrl && <input type="hidden" name="imageUrl" value={popup.imageUrl} />}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">
          팝업 {popup ? "수정" : "만들기"}
        </h1>
        <Link
          href="/admin/popups"
          className="text-[13.5px] font-semibold text-muted hover:text-brand"
        >
          목록으로
        </Link>
      </div>

      {/* 글에서 가져오기 */}
      {!popup && sources.length > 0 && (
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold">행사·게시글에서 가져오기</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            고르면 제목·내용·링크가 자동으로 채워집니다. 채운 뒤 고쳐도 됩니다.
            직접 쓰시려면 건너뛰세요.
          </p>

          <ul className="mt-3 max-h-[240px] space-y-1.5 overflow-y-auto">
            {sources.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => fillFrom(s)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-line px-3.5 py-2.5 text-left transition-colors hover:border-brand hover:bg-brand-tint-2"
                >
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold ${
                      s.type === "event"
                        ? "bg-brand text-white"
                        : "bg-mist text-muted"
                    }`}
                  >
                    {TYPE_LABEL[s.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{s.title}</span>
                    <span className="tnum block text-[12px] text-muted">
                      {s.date}
                      {s.place && ` · ${s.place}`}
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-[12.5px] text-line-strong">
                    가져오기 →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4 rounded-xl border border-line bg-white p-5">
        <div>
          <label htmlFor="title" className={label}>
            제목 <span className="text-brand">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="9월 정기모임 안내"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="body" className={label}>
            내용
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"일시: 2026-09-20 19:00\n장소: 협회 사무국"}
            className={`${field} resize-y`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className={label}>
              띄우기 시작 <span className="text-brand">*</span>
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="endDate" className={label}>
              띄우기 끝 <span className="text-brand">*</span>
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={field}
            />
            <p className="mt-1 text-[11.5px] text-muted">
              끝나는 날까지 하루 종일 나옵니다. 지나면 저절로 사라집니다.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
          <div>
            <label htmlFor="linkUrl" className={label}>
              눌렀을 때 갈 곳 <span className="ml-1 font-normal text-muted">(선택)</span>
            </label>
            <input
              id="linkUrl"
              name="linkUrl"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/activities/2026-정기모임"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="linkLabel" className={label}>
              버튼 글자
            </label>
            <input
              id="linkLabel"
              name="linkLabel"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="자세히 보기"
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className={label}>
            공개 상태
          </label>
          <select
            id="status"
            name="status"
            defaultValue={popup?.status ?? "draft"}
            className={field}
          >
            <option value="draft">임시저장 (아직 안 띄움)</option>
            <option value="public">공개 (기간 안이면 바로 뜸)</option>
            <option value="private">비공개</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold">홍보 이미지 (선택)</h2>
        <p className="mt-1 text-[12.5px] leading-[1.75] text-muted">
          넣지 않아도 됩니다. 넣으면 제목 위에 나옵니다.
          <br />
          <b className="text-ink">팝업 창 크기는 사진과 상관없이 늘 같습니다.</b> 팝업이 두세
          개 떠도 크기가 제각각이 되지 않습니다.
          <br />
          사진 자리는 가로 4:3 이고, 넘치는 부분은 회원이{" "}
          <b className="text-ink">사진을 눌러 전체를</b> 볼 수 있습니다.
        </p>

        {/* 홍보 이미지는 만들어 온 모양이 제각각이다.
            가로 카드도 있고 정사각형도 있어서, 자를 모양을 고르게 한다. */}
        <div className="mt-3 flex flex-wrap gap-1 rounded-lg bg-mist p-1">
          {SHAPES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setShape(s)}
              className={`rounded-md px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                shape.label === s.label ? "bg-white text-brand-deep" : "text-muted hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted">{shape.hint}</p>

        <div className="mt-3">
          <ImageInput
            key={shape.label}
            name="imageFile"
            currentUrl={popup?.imageUrl}
            folder="popups"
            aspect={shape.aspect}
          />
        </div>
      </section>

      {state && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-[13.5px] ${
            state.ok ? "bg-brand-tint text-brand-deep" : "bg-coral-tint text-coral"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-8 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/popups"
          className="rounded-lg border border-line px-6 py-3.5 text-[15px] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
