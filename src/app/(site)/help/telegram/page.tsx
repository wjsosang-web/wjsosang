import type { Metadata } from "next";
import Link from "next/link";
import { botUrl, botUsername } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "텔레그램 알림 받는 법",
  description:
    "원주청년소상공인협회 알림을 텔레그램으로 받는 방법입니다. 화면 그대로 따라 하시면 3분이면 끝납니다.",
};

export const dynamic = "force-dynamic";

/**
 * 회원에게 보내는 안내 화면.
 *
 * 사무국이 카톡으로 이 주소 하나만 보내면 되도록 만든다.
 * 텔레그램은 화면이 영어라서, 영어로 뭐라고 쓰여 있는지까지 같이 적는다.
 * 대부분 휴대폰으로 볼 화면이라 글자와 버튼을 크게 잡았다.
 */

const FAQ = [
  {
    q: "협회에 제 전화번호나 아이디를 알려줘야 하나요?",
    a: "아니요. 아무것도 알려주지 않으셔도 됩니다. 코드를 봇에게 보내시면 홈페이지가 알아서 찾아 연결합니다.",
  },
  {
    q: "텔레그램이 영어로 나오는데 괜찮나요?",
    a: "괜찮습니다. 협회에서 보내는 알림은 전부 한글로 갑니다. 앱 화면만 영어일 뿐입니다.",
  },
  {
    q: "카카오톡처럼 광고가 오나요?",
    a: "협회 공지와 지원금 공고만 갑니다. 보내는 사람은 항상 '원주청년소상공인협회'로 표시됩니다.",
  },
  {
    q: "그만 받고 싶으면요?",
    a: "홈페이지 [내 정보]에서 [연결 끊기]를 누르시면 바로 멈춥니다. 언제든 다시 연결하실 수 있습니다.",
  },
  {
    q: "텔레그램 앱이 없는데요?",
    a: "앱스토어나 플레이스토어에서 '텔레그램'을 받으시면 됩니다. 무료이고, 전화번호로 가입합니다.",
  },
];

export default function TelegramHelpPage() {
  const name = botUsername();
  const url = botUrl();

  return (
    <article className="px-5 py-10 md:py-14">
      <div className="mx-auto w-full max-w-[640px]">
        <p className="text-[12.5px] font-bold tracking-[0.14em] text-brand">GUIDE</p>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.35] tracking-[-0.02em] md:text-[32px]">
          텔레그램으로
          <br />
          협회 알림 받는 법
        </h1>
        <p className="mt-3 text-[14.5px] leading-[1.85] text-ink-soft">
          지원금 공고, 협회 공지, 행사 안내를 휴대폰으로 바로 받아보실 수 있습니다.
          <br />
          <b className="text-ink">한 번만 해두시면 됩니다. 3분이면 끝납니다.</b>
        </p>

        <div className="mt-8 space-y-3">
          <Step no={1} title="텔레그램 앱 설치하기">
            <p>
              이미 쓰고 계시면 넘어가세요. 없으시면 앱스토어(아이폰) 또는
              플레이스토어(안드로이드)에서 <b>텔레그램</b>을 검색해 받으시면 됩니다.
            </p>
            <p className="mt-2 text-muted">무료이고, 전화번호로 가입합니다.</p>
          </Step>

          <Step no={2} title="홈페이지에서 연결 코드 받기">
            <p>
              협회 홈페이지에 로그인하고 <b>[내 정보]</b> 화면에서{" "}
              <b>[텔레그램 연결하기]</b>를 누르세요.
            </p>
            <p className="mt-2">
              <b className="text-ink">A7K2M9</b> 처럼 생긴 <b>여섯 글자 코드</b>가 나옵니다.
            </p>
            <Link
              href="/my"
              className="mt-3 inline-block rounded-lg bg-brand px-5 py-3 text-[14.5px] font-bold text-white"
            >
              내 정보 열기 →
            </Link>
          </Step>

          <Step no={3} title="협회 봇 대화창 열기">
            {url ? (
              <>
                <p>
                  아래 버튼을 누르면 텔레그램이 열립니다. 협회 봇 아이디는{" "}
                  <b>@{name}</b> 입니다.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-lg bg-[#229ED9] px-5 py-3 text-[14.5px] font-bold text-white"
                >
                  협회 봇 열기 ↗
                </a>
              </>
            ) : (
              <p>
                텔레그램 위쪽 <b>돋보기(검색)</b>를 누르고 협회 봇 아이디를 검색해 들어가세요.
                아이디는 사무국에서 알려드립니다.
              </p>
            )}

            <div className="mt-4 rounded-xl bg-mist p-4">
              <p className="text-[13px] font-bold">화면에 영어로 이렇게 보입니다</p>
              <p className="mt-2 text-[13px] leading-[1.8]">
                아래쪽에 파란 <Chip>START</Chip> 버튼이 하나 있습니다.
                <br />
                <span className="text-muted">
                  &ldquo;시작&rdquo;이라는 뜻입니다. 한 번 눌러 주세요.
                </span>
              </p>
            </div>
          </Step>

          <Step no={4} title="받은 코드를 그대로 보내기">
            <p>
              대화창 아래 <b>메시지 입력칸</b>에 홈페이지에서 받은 <b>여섯 글자 코드</b>를
              적고 보내세요.
            </p>
            <div className="mt-3 rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold text-muted">이렇게 보내시면 됩니다</p>
              <p className="tnum mt-1.5 text-[20px] font-bold tracking-[0.18em]">A7K2M9</p>
              <p className="mt-2 text-[12.5px] leading-[1.7] text-muted">
                코드만 보내시면 됩니다. 이름이나 전화번호는 적지 않으셔도 됩니다.
              </p>
            </div>
            <p className="mt-3 text-[13px] text-coral">
              코드는 10분이 지나면 만료됩니다. 늦으셨으면 홈페이지에서 다시 받으세요.
            </p>
          </Step>

          <Step no={5} title="홈페이지로 돌아와 [보냈습니다] 누르기">
            <p>
              <b>[내 정보]</b> 화면으로 돌아와 <b>[보냈습니다]</b>를 누르면 연결이 끝납니다.
            </p>
            <p className="mt-2 rounded-xl bg-brand-tint p-3.5 text-[13.5px] font-semibold text-brand-deep">
              &ldquo;연결되었습니다&rdquo; 라고 나오면 성공입니다. 이제 협회 알림이 휴대폰으로
              옵니다.
            </p>
          </Step>
        </div>

        {/* 무엇이 오는지 미리보기 */}
        <section className="mt-10">
          <h2 className="text-[19px] font-bold tracking-[-0.02em]">이런 알림이 옵니다</h2>
          <div className="mt-3 rounded-2xl bg-[#e7f0f7] p-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[13px] font-bold text-brand-deep">원주청년소상공인협회</p>
              <p className="mt-2 text-[13.5px] leading-[1.8]">
                💰 지원사업
                <br />
                <b>2026년 소상공인 시설개선 지원사업</b>
                <br />
                주관 원주시
                <br />
                마감 2026-10-15
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-[1.8] text-muted">
            보내는 사람은 항상 <b className="text-ink">원주청년소상공인협회</b>로 표시됩니다.
            내용은 전부 한글입니다.
          </p>
        </section>

        {/* 자주 묻는 것 */}
        <section className="mt-10">
          <h2 className="text-[19px] font-bold tracking-[-0.02em]">자주 묻는 것</h2>
          <dl className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white px-5">
            {FAQ.map((row) => (
              <div key={row.q} className="py-4">
                <dt className="text-[14.5px] font-bold">{row.q}</dt>
                <dd className="mt-1.5 text-[13.5px] leading-[1.8] text-ink-soft">{row.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-8 rounded-2xl bg-mist p-5 text-[13.5px] leading-[1.85] text-ink-soft">
          잘 안 되시면 <b className="text-ink">사무국 010-2777-0093 (이종현 사무국장)</b> 으로
          연락 주세요. 전화로 같이 해드립니다.
        </p>
      </div>
    </article>
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
    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[14px] font-bold text-white"
        >
          {no}
        </span>
        <h2 className="text-[16.5px] font-bold tracking-[-0.01em] md:text-[18px]">{title}</h2>
      </div>
      <div className="mt-3.5 text-[14px] leading-[1.85] text-ink-soft">{children}</div>
    </section>
  );
}

/** 텔레그램 화면에 영어로 나오는 버튼을 그대로 흉내 낸다 */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 rounded-md bg-[#229ED9] px-2 py-0.5 text-[12px] font-bold text-white">
      {children}
    </span>
  );
}
