"use client";

import { useActionState, useState } from "react";
import {
  runCollect,
  saveSourceSwitches,
  sendOne,
  sendPending,
  toggleHidden,
} from "@/lib/admin/feedActions";
import type { SourceSwitches } from "@/lib/feeds/collect";
import { SOURCE_LABEL, SOURCE_TAG, type FeedItem, type FeedSource } from "@/lib/feeds/types";
import type { ActionResult } from "@/lib/admin/actions";

/**
 * 지원사업·교육·행사 소식 화면.
 *
 * 자동으로 매일 아침 한 번 돌지만, 여기서 직접 눌러 지금 모을 수도 있다.
 * 모으는 것과 보내는 것을 나눠 두었다. 모으기만 하면 홈페이지에 쌓이고,
 * 보내기를 눌러야 회원 휴대폰으로 간다. 그래야 실수로 백 건이 나가지 않는다.
 */

const SOURCES = Object.keys(SOURCE_LABEL) as FeedSource[];

export default function FeedPanel({
  items,
  switches,
  keys,
}: {
  items: FeedItem[];
  switches: SourceSwitches;
  /** 인증키가 등록돼 있는지. 없으면 그 출처는 아무것도 못 가져온다. */
  keys: { bizinfo: boolean; tour: boolean; telegram: boolean };
}) {
  const [filter, setFilter] = useState<FeedSource | "all">("all");
  const [busy, setBusy] = useState<"collect" | "send" | null>(null);
  const [notice, setNotice] = useState<ActionResult | null>(null);

  const [saveState, saveAction, saving] = useActionState(saveSourceSwitches, null);

  const shown = filter === "all" ? items : items.filter((i) => i.source === filter);
  const pending = items.filter((i) => !i.notifiedAt && !i.hidden).length;

  const run = async (which: "collect" | "send") => {
    setBusy(which);
    setNotice(null);
    const result = which === "collect" ? await runCollect() : await sendPending();
    setNotice(result);
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      {/* 인증키 안내 */}
      {(!keys.bizinfo || !keys.tour || !keys.telegram) && (
        <div className="rounded-xl border border-amber/40 bg-amber-tint px-4 py-3.5 text-[13px] leading-[1.75]">
          <p className="font-bold text-amber">아직 등록되지 않은 인증키가 있습니다</p>
          <ul className="mt-1.5 space-y-0.5 text-ink-soft">
            {!keys.bizinfo && (
              <li>
                · <b>BIZINFO_API_KEY</b> — 지원사업·정책자금을 가져오려면 필요합니다
                (bizinfo.go.kr 에서 발급)
              </li>
            )}
            {!keys.tour && (
              <li>
                · <b>TOUR_API_KEY</b> — 원주 행사·축제를 가져오려면 필요합니다 (공공데이터포털
                &ldquo;한국관광공사_국문 관광정보 서비스&rdquo;)
              </li>
            )}
            {!keys.telegram && (
              <li>
                · <b>TELEGRAM_BOT_TOKEN</b> — 회원에게 알림을 보내려면 필요합니다
              </li>
            )}
          </ul>
        </div>
      )}

      {/* 실행 */}
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => run("collect")}
            disabled={busy !== null}
            className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
          >
            {busy === "collect" ? "모으는 중…" : "지금 모아 오기"}
          </button>

          <button
            type="button"
            onClick={() => run("send")}
            disabled={busy !== null || pending === 0}
            className="rounded-lg border border-line-strong px-5 py-2.5 text-[14px] font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          >
            {busy === "send" ? "보내는 중…" : `안 보낸 소식 보내기 (${pending})`}
          </button>

          <p className="text-[12.5px] text-muted">
            매일 아침 9시에 저절로 모으고 보냅니다.
          </p>
        </div>

        {notice && (
          <p
            className={`mt-3 rounded-lg px-3.5 py-2.5 text-[13px] ${
              notice.ok ? "bg-brand-tint text-brand-deep" : "bg-coral-tint text-coral"
            }`}
          >
            {notice.message}
          </p>
        )}
      </div>

      {/* 가져올 곳 */}
      <form action={saveAction} className="rounded-xl border border-line bg-white p-4">
        <p className="text-[14px] font-bold">가져올 곳</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2.5">
          {SOURCES.map((source) => (
            <label key={source} className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                name={`on-${source}`}
                defaultChecked={switches[source] !== false}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              {SOURCE_TAG[source]} {SOURCE_LABEL[source]}
            </label>
          ))}
        </div>

        <div className="mt-3.5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border border-line-strong px-4 py-2 text-[13.5px] font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
          >
            저장
          </button>
          {saveState && (
            <span className={`text-[13px] ${saveState.ok ? "text-brand" : "text-coral"}`}>
              {saveState.message}
            </span>
          )}
        </div>
      </form>

      {/* 걸러 보기 */}
      <div className="flex flex-wrap gap-1.5">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          전체 {items.length}
        </Chip>
        {SOURCES.map((source) => (
          <Chip key={source} active={filter === source} onClick={() => setFilter(source)}>
            {SOURCE_LABEL[source]} {items.filter((i) => i.source === source).length}
          </Chip>
        ))}
      </div>

      {/* 목록 */}
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white py-16 text-center text-[14px] text-muted">
          아직 모아 온 소식이 없습니다. [지금 모아 오기] 를 눌러 보세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ item }: { item: FeedItem }) {
  const [sendState, sendAction, sending] = useActionState(sendOne, null);
  const [hideState, hideAction, hiding] = useActionState(toggleHidden, null);
  const result = sendState ?? hideState;

  return (
    <li
      className={`rounded-xl border border-line bg-white p-4 ${item.hidden ? "opacity-55" : ""}`}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span className="shrink-0 text-[12px] font-bold">{SOURCE_TAG[item.source]}</span>

        <a
          href={item.link || "#"}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 text-[14.5px] font-bold leading-snug hover:text-brand"
        >
          {item.title}
        </a>

        {item.notifiedAt ? (
          <span className="shrink-0 rounded bg-mist px-2 py-1 text-[11px] font-bold text-muted">
            보냄
          </span>
        ) : (
          <span className="shrink-0 rounded bg-amber px-2 py-1 text-[11px] font-bold text-white">
            안 보냄
          </span>
        )}
      </div>

      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted">
        {item.organizer && <span>{item.organizer}</span>}
        {item.endsOn && <span className="tnum">마감 {item.endsOn}</span>}
        {item.publishedOn && <span className="tnum">등록 {item.publishedOn}</span>}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {!item.notifiedAt && (
          <form action={sendAction}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              disabled={sending}
              className="rounded-md bg-brand px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-50"
            >
              {sending ? "보내는 중…" : "이것만 보내기"}
            </button>
          </form>
        )}

        <form action={hideAction}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="hide" value={item.hidden ? "0" : "1"} />
          <button
            type="submit"
            disabled={hiding}
            className="rounded-md border border-line px-3 py-1.5 text-[12.5px] font-semibold text-muted hover:border-line-strong disabled:opacity-50"
          >
            {item.hidden ? "다시 보이기" : "홈페이지에서 감추기"}
          </button>
        </form>

        {result && (
          <span className={`text-[12.5px] ${result.ok ? "text-brand" : "text-coral"}`}>
            {result.message}
          </span>
        )}
      </div>
    </li>
  );
}

function Chip({
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
      className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        active ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-line hover:ring-brand/50"
      }`}
    >
      {children}
    </button>
  );
}
