"use client";

import { useState } from "react";

/**
 * 사무국이 보는 텔레그램 사용법.
 *
 * 회원에게 안내할 문장을 그대로 복사할 수 있게 둔다. 말을 매번 새로 지어내면
 * 사람마다 다르게 안내되고, 그러면 "나는 그렇게 들었는데" 하는 문의가 생긴다.
 */
export default function TelegramGuide({
  ready,
  botName,
  siteUrl,
}: {
  ready: boolean;
  botName: string | null;
  siteUrl: string;
}) {
  const guideUrl = `${siteUrl}/help/telegram`;

  const kakaoText = [
    "[원주청년소상공인협회]",
    "",
    "지원금 공고와 협회 소식을 휴대폰으로 바로 받아보실 수 있습니다.",
    "아래 안내대로 한 번만 해두시면 됩니다. 3분이면 끝납니다.",
    "",
    guideUrl,
    "",
    "잘 안 되시면 사무국 010-2777-0093 으로 연락 주세요.",
  ].join("\n");

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-bold">텔레그램 사용법</h2>
      <p className="mt-1 text-[12.5px] leading-[1.7] text-muted">
        회원에게 어떻게 안내하면 되는지, 회원 화면에 무엇이 뜨는지 정리했습니다.
      </p>

      {/* 1. 회원이 하는 일 */}
      <div className="mt-4 rounded-lg bg-mist p-4">
        <p className="text-[13px] font-bold">회원이 하는 일 (5단계)</p>
        <ol className="mt-2.5 space-y-2 text-[12.5px] leading-[1.75] text-ink-soft">
          <li>
            <b>1.</b> 텔레그램 앱 설치 (없는 분만)
          </li>
          <li>
            <b>2.</b> 협회 홈페이지 <b>[내 정보]</b> → <b>[텔레그램 연결하기]</b>
            <br />
            <span className="text-muted">A7K2M9 처럼 생긴 여섯 글자 코드가 나옵니다.</span>
          </li>
          <li>
            <b>3.</b> 협회 봇 {botName ? <b>@{botName}</b> : "대화창"} 열고 파란{" "}
            <code className="rounded bg-white px-1.5 py-0.5">START</code> 누르기
            <br />
            <span className="text-muted">
              텔레그램 화면이 영어라 여기서 많이 멈춥니다. START = 시작 입니다.
            </span>
          </li>
          <li>
            <b>4.</b> 대화창에 <b>코드만</b> 적어서 보내기
            <br />
            <span className="text-muted">이름·전화번호는 적지 않습니다. 코드만 보냅니다.</span>
          </li>
          <li>
            <b>5.</b> 홈페이지로 돌아와 <b>[보냈습니다]</b> 누르기 → 끝
          </li>
        </ol>
      </div>

      {/* 2. 협회가 받을 것 */}
      <div className="mt-4 rounded-lg bg-brand-tint-2 p-4">
        <p className="text-[13px] font-bold">협회가 회원에게 받아야 할 것</p>
        <p className="mt-1.5 text-[13px] font-bold text-brand-deep">없습니다.</p>
        <p className="mt-1.5 text-[12.5px] leading-[1.8] text-ink-soft">
          전화번호도, 텔레그램 아이디도 물어보지 않으셔도 됩니다. 회원이 코드를 봇에게
          보내면 홈페이지가 알아서 찾아 연결합니다.
        </p>
        <p className="mt-2.5 text-[12px] leading-[1.8] text-muted">
          연결이 끝나면 <b>회원 관리</b> 목록에서 그 회원에게 텔레그램 표시가 붙습니다.
          연결된 인원수는 아래 &ldquo;텔레그램 알림&rdquo; 칸에서 확인하실 수 있습니다.
        </p>
      </div>

      {/* 3. 안내문 복사 */}
      <div className="mt-4 rounded-lg border border-line p-4">
        <p className="text-[13px] font-bold">회원에게 보낼 안내문</p>
        <p className="mt-1.5 text-[12.5px] leading-[1.7] text-muted">
          카톡 단톡방에 그대로 붙여 넣으시면 됩니다. 회원은 링크만 누르면
          사진처럼 따라 할 수 있는 화면이 휴대폰으로 열립니다.
        </p>

        <pre className="mt-2.5 whitespace-pre-wrap rounded-lg bg-mist p-3.5 text-[12.5px] leading-[1.8] text-ink">
          {kakaoText}
        </pre>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <CopyButton text={kakaoText} label="안내문 복사" />
          <CopyButton text={guideUrl} label="링크만 복사" />
          <a
            href="/help/telegram"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line px-4 py-2 text-[12.5px] font-bold text-muted transition-colors hover:border-brand hover:text-brand"
          >
            안내 화면 미리보기 ↗
          </a>
        </div>
      </div>

      {/* 4. 알아두면 좋은 것 */}
      <div className="mt-4 rounded-lg border border-line p-4">
        <p className="text-[13px] font-bold">알아두시면 좋은 것</p>
        <ul className="mt-2 space-y-1.5 text-[12.5px] leading-[1.8] text-ink-soft">
          <li>· 한글·이모지 모두 그대로 갑니다. 한 번에 4,096자까지입니다.</li>
          <li>
            · 보내는 사람은 항상 <b>원주청년소상공인협회</b>로 표시됩니다. 따로 적지 않으셔도
            자동으로 붙습니다.
          </li>
          <li>· 문자와 달리 건당 비용이 없습니다.</li>
          <li>· 코드는 10분만 살아 있습니다. 지나면 회원이 다시 받으면 됩니다.</li>
          <li>
            · 회원이 봇을 차단하면 그 사람에게만 안 갑니다. 나머지 발송에는 영향이 없습니다.
          </li>
        </ul>
      </div>

      {!ready && (
        <p className="mt-4 rounded-lg bg-amber-tint px-4 py-3 text-[12.5px] leading-[1.75] text-amber">
          <b>아직 봇 토큰이 등록되지 않아 연결이 되지 않습니다.</b> 아래 &ldquo;텔레그램
          알림&rdquo; 칸의 준비 방법을 먼저 끝내 주세요.
        </p>
      )}
    </section>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* 복사가 막혀 있으면 위 글을 직접 긁어 쓰면 된다 */
        }
      }}
      className="rounded-lg bg-brand px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-brand-deep"
    >
      {done ? "복사했습니다" : label}
    </button>
  );
}
