"use client";

import { useActionState, useState } from "react";
import {
  broadcastNotice,
  linkTelegramContacts,
  type ActionResult,
} from "@/lib/admin/actions";

/**
 * 텔레그램 알림 관리.
 *
 * 봇 토큰을 넣는 방법과, 회원을 연결하는 방법, 실제로 보내는 칸을 한자리에 둔다.
 * 봇 토큰이 없으면 준비 방법을 먼저 보여주고 나머지는 감춘다.
 */
export default function TelegramPanel({
  ready,
  linkedCount,
  totalCount,
  botName,
}: {
  /** 서버에 봇 토큰이 등록되어 있는지 */
  ready: boolean;
  linkedCount: number;
  totalCount: number;
  botName: string | null;
}) {
  const [linkState, setLinkState] = useState<ActionResult | null>(null);
  const [linking, setLinking] = useState(false);

  const [sendState, sendAction, sending] = useActionState<ActionResult | null, FormData>(
    broadcastNotice,
    null,
  );

  async function link() {
    setLinking(true);
    setLinkState(await linkTelegramContacts());
    setLinking(false);
  }

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">텔레그램 알림</h2>
        <span
          className={`rounded px-2 py-1 text-[11.5px] font-bold ${
            ready ? "bg-brand-tint text-brand-deep" : "bg-amber-tint text-amber"
          }`}
        >
          {ready ? "사용 중" : "준비 필요"}
        </span>
      </div>

      <p className="mt-1 text-[12.5px] leading-[1.7] text-muted">
        협회 공지와 행사 소식을 회원 휴대폰으로 바로 보냅니다. 문자와 달리 건당 비용이 없습니다.
        지금 <b className="tnum text-ink">{linkedCount}</b>명 연결됨 (전체 {totalCount}명)
      </p>

      {/* 준비 방법 — 토큰이 없을 때만 자세히 */}
      {!ready && (
        <div className="mt-4 rounded-lg bg-mist p-4">
          <p className="text-[13px] font-bold">봇 만들기 (한 번만 하면 됩니다)</p>
          <ol className="mt-2 space-y-2 text-[12.5px] leading-[1.75] text-ink-soft">
            <li>
              <b>1.</b> 텔레그램에서 <b>@BotFather</b> 를 찾아 대화를 시작합니다.
            </li>
            <li>
              <b>2.</b> <code className="rounded bg-white px-1.5 py-0.5">/newbot</code> 를 보내고,
              봇 이름과 아이디를 정합니다. (아이디는 <b>wjsosang_bot</b> 처럼 bot 으로 끝나야 합니다)
            </li>
            <li>
              <b>3.</b> BotFather 가 알려주는 <b>토큰</b>을 복사합니다.
              <br />
              <span className="text-muted">
                123456789:AAH... 처럼 생긴 긴 글자입니다. 남에게 보여주면 안 됩니다.
              </span>
            </li>
            <li>
              <b>4.</b> Vercel → 이 프로젝트 → Settings → Environment Variables 에서
              <br />
              <code className="rounded bg-white px-1.5 py-0.5">TELEGRAM_BOT_TOKEN</code> 이름으로
              그 토큰을 넣습니다. Production·Preview·Development 모두 체크해 주세요.
            </li>
            <li>
              <b>5.</b> 저장한 뒤 <b>Redeploy</b> 하면 이 화면이 &quot;사용 중&quot;으로 바뀝니다.
            </li>
          </ol>
        </div>
      )}

      {/* 무엇을 받아야 하나 */}
      <div className="mt-4 rounded-lg bg-brand-tint-2 p-4">
        <p className="text-[13px] font-bold">회원에게 무엇을 받아야 하나요?</p>
        <p className="mt-1.5 text-[12.5px] leading-[1.8] text-ink-soft">
          <b className="text-ink">받을 것이 없습니다.</b> 회원이 봇에게 말을 걸면 번호가
          자동으로 잡힙니다. 전화번호나 아이디를 따로 물어보지 않으셔도 됩니다.
        </p>
        <p className="mt-2.5 text-[12px] leading-[1.8] text-muted">
          회원이 /start 를 보내는 순간 텔레그램이 그 사람의 <b>대화 번호</b>를 알려주는데,
          그 번호로 알림을 보냅니다. 이렇게 생겼습니다 —{" "}
          <code className="rounded bg-white px-1.5 py-0.5">812345678</code>{" "}
          (숫자 9~10자리). 회원이 볼 일도, 적을 일도 없습니다.
        </p>
        <p className="mt-2.5 text-[12px] leading-[1.8] text-muted">
          한글은 그대로 잘 갑니다. 제목·본문·이모지 모두 됩니다. 글자 수는 한 번에
          4,096자까지입니다.
        </p>
      </div>

      {/* 회원 연결 */}
      <div className="mt-4 rounded-lg border border-line p-4">
        <p className="text-[13px] font-bold">회원 연결하기</p>
        <p className="mt-1.5 text-[12.5px] leading-[1.75] text-ink-soft">
          회원분들께 이렇게 안내해 주세요.
        </p>
        <p className="mt-2 rounded-lg bg-brand-tint-2 p-3 text-[12.5px] leading-[1.8]">
          텔레그램에서 <b>{botName ? `@${botName}` : "협회 봇"}</b> 을 찾아 들어간 뒤,
          <br />
          <code className="rounded bg-white px-1.5 py-0.5">/start 홍길동</code> 처럼{" "}
          <b>본인 이름을 함께</b> 보내주세요.
          <br />
          <span className="text-muted">
            이름을 같이 보내야 명부와 맞춰서 연결됩니다. 그냥 /start 만 보내면 텔레그램에
            등록된 이름으로 맞춰봅니다.
          </span>
        </p>

        <button
          type="button"
          onClick={link}
          disabled={!ready || linking}
          className="mt-3 rounded-lg border border-line px-5 py-2.5 text-[13.5px] font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
        >
          {linking ? "확인 중…" : "봇에게 온 메시지 확인해서 연결하기"}
        </button>

        {linkState && (
          <p
            role="status"
            className={`mt-2 text-[12.5px] font-semibold ${
              linkState.ok ? "text-brand" : "text-coral"
            }`}
          >
            {linkState.message}
          </p>
        )}
      </div>

      {/* 보내기 */}
      <form action={sendAction} className="mt-4 rounded-lg border border-line p-4">
        <label htmlFor="tg-message" className="text-[13px] font-bold">
          알림 보내기
        </label>
        <p className="mt-1 text-[12.5px] text-muted">
          연결된 회원 {linkedCount}명 모두에게 갑니다. 긴급 공지나 행사 안내에 쓰세요.
        </p>

        <textarea
          id="tg-message"
          name="message"
          rows={4}
          required
          placeholder={
            "[원청협] 9월 정기모임 안내\n\n일시: 9월 30일(화) 저녁 7시\n장소: 협회 사무국\n\n참석 여부를 사무국장에게 알려주세요."
          }
          className="mt-2.5 w-full resize-y rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand"
        />

        <details className="mt-2.5 rounded-lg bg-mist p-3.5">
          <summary className="cursor-pointer text-[12.5px] font-bold">
            이렇게 쓰면 좋습니다 (예시)
          </summary>

          <div className="mt-2 space-y-3 text-[12px] leading-[1.8] text-ink-soft">
            <p>
              <b>공지</b>
              <br />
              [원청협] 9월 회비 납부 안내
              <br />
              9월 회비 납부 기간입니다. 신협 131-020-556458 로 입금해 주세요.
              <br />
              입금자명은 (성함)(업체명)연회비 로 부탁드립니다.
            </p>

            <p>
              <b>행사</b>
              <br />
              [원청협] 웰니스 운동회 안내
              <br />
              10월 12일(일) 오전 10시, 원주생명과학고등학교
              <br />
              가족과 함께 오셔도 됩니다. 참석 여부를 알려주세요.
            </p>

            <p>
              <b>긴급</b>
              <br />
              [원청협] 오늘 모임 장소 변경
              <br />
              사무국 공사로 오늘 모임은 카페인중독 원주시청점에서 합니다.
            </p>

            <p className="text-muted">
              맨 앞에 <b>[원청협]</b> 을 붙이면 회원이 알림창에서 바로 알아봅니다. 첫 줄은
              제목처럼 짧게, 그 아래에 자세한 내용을 적으면 읽기 편합니다.
            </p>
          </div>
        </details>

        <button
          type="submit"
          disabled={!ready || sending || linkedCount === 0}
          className="mt-2.5 rounded-lg bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {sending ? "보내는 중…" : `${linkedCount}명에게 보내기`}
        </button>

        {sendState && (
          <p
            role="status"
            className={`mt-2 text-[12.5px] font-semibold ${
              sendState.ok ? "text-brand" : "text-coral"
            }`}
          >
            {sendState.message}
          </p>
        )}
      </form>
    </section>
  );
}
