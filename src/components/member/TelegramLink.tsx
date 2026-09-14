"use client";

import { useState } from "react";
import {
  confirmTelegramLink,
  startTelegramLink,
  unlinkTelegram,
  type MemberActionResult,
} from "@/lib/member/actions";

/**
 * 회원이 스스로 텔레그램을 잇는다.
 *
 * chat_id 는 그 사람이 봇에게 먼저 말을 걸어야 생기는 값이라 홈페이지에
 * 적어 넣을 수가 없다. 그래서 짧은 코드를 주고, 그 코드를 봇에게 보내면
 * 홈페이지가 찾아서 잇는다.
 *
 * 세 단계를 한 화면에 다 보여준다. 다음 단계가 뭔지 몰라 멈추는 일이 없도록.
 */
export default function TelegramLink({
  linked,
  username,
}: {
  linked: boolean;
  username: string | null;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<MemberActionResult | null>(null);
  const [busy, setBusy] = useState<"start" | "confirm" | "unlink" | null>(null);

  const run = async (which: "start" | "confirm" | "unlink") => {
    setBusy(which);
    setNotice(null);

    if (which === "start") {
      const result = await startTelegramLink();
      setNotice(result);
      if (result.ok && result.code) {
        setCode(result.code);
        setBotUrl(result.botUrl ?? null);
      }
    } else if (which === "confirm") {
      const result = await confirmTelegramLink();
      setNotice(result);
      if (result.ok) setCode(null);
    } else {
      const result = await unlinkTelegram();
      setNotice(result);
      if (result.ok) setCode(null);
    }

    setBusy(null);
  };

  if (linked) {
    return (
      <div className="mt-5">
        <p className="rounded-xl bg-brand-tint px-4 py-3 text-[13.5px] font-semibold text-brand-deep">
          연결되어 있습니다{username && ` (@${username})`}. 새 소식이 올라오면 알림이 갑니다.
        </p>
        <button
          type="button"
          onClick={() => run("unlink")}
          disabled={busy !== null}
          className="mt-2.5 text-[12.5px] font-semibold text-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
        >
          연결 끊기
        </button>
        {notice && (
          <p className={`mt-2 text-[13px] ${notice.ok ? "text-brand" : "text-coral"}`}>
            {notice.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5">
      {!code ? (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => run("start")}
            disabled={busy !== null}
            className="rounded-lg bg-brand px-6 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
          >
            {busy === "start" ? "코드 만드는 중…" : "텔레그램 연결하기"}
          </button>
          {/* 텔레그램은 화면이 영어라 처음 쓰는 분이 멈춘다.
              누르면 사진처럼 따라 할 수 있는 안내로 간다. */}
          <a
            href="/help/telegram"
            className="rounded-lg border border-line px-5 py-3 text-[13.5px] font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand"
          >
            처음이신가요? 따라하기 →
          </a>
        </div>
      ) : (
        <ol className="space-y-3">
          <Step no={1} title="협회 봇 대화창 열기">
            {botUrl ? (
              <a
                href={botUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-[#229ED9] px-5 py-2.5 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
              >
                협회 봇 열기 ↗
              </a>
            ) : (
              <span className="text-[13px] text-muted">
                텔레그램에서 협회 봇을 찾아 대화창을 열어 주세요.
              </span>
            )}
          </Step>

          <Step no={2} title="이 코드를 그대로 보내기">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="tnum rounded-lg bg-forest px-5 py-2.5 text-[20px] font-bold tracking-[0.2em] text-white">
                {code}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(code)}
                className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-semibold text-muted hover:border-ink hover:text-ink"
              >
                복사
              </button>
            </div>
            <p className="mt-2 text-[12.5px] leading-[1.7] text-muted">
              코드만 보내시면 됩니다. 이름·전화번호는 적지 않으셔도 됩니다.
              <br />
              10분이 지나면 만료되니 그때는 다시 받아 주세요.
            </p>
          </Step>

          <Step no={3} title="보내셨으면 아래를 누르기">
            <button
              type="button"
              onClick={() => run("confirm")}
              disabled={busy !== null}
              className="rounded-lg bg-brand px-6 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
            >
              {busy === "confirm" ? "확인하는 중…" : "보냈습니다"}
            </button>
          </Step>

          <li className="pt-1">
            <a
              href="/help/telegram"
              target="_blank"
              rel="noreferrer"
              className="text-[12.5px] font-semibold text-brand underline underline-offset-2"
            >
              화면이 영어로 나와 헷갈리시나요? 따라하기 안내 보기 ↗
            </a>
          </li>
        </ol>
      )}

      {notice && (
        <p
          className={`mt-3 rounded-lg px-4 py-3 text-[13px] leading-[1.7] ${
            notice.ok ? "bg-brand-tint text-brand-deep" : "bg-coral-tint text-coral"
          }`}
        >
          {notice.message}
        </p>
      )}
    </div>
  );
}

function Step({
  no,
  title,
  children,
}: {
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-bold text-white"
      >
        {no}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold">{title}</p>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  );
}
