"use client";

import { useEffect, useState } from "react";
import type { ServiceLink } from "@/lib/serviceLinks";

/**
 * 화면 양옆 여백에 붙는 공공 서비스 바로가기.
 *
 * 본문은 1180px 이라, 화면이 아주 넓을 때만 양옆이 비어 있다.
 * 좁은 화면에서 띄우면 본문을 가리므로 1480px 이상에서만 보여준다.
 * (작은 화면에서는 메인 아래쪽의 바로가기 구역이 같은 역할을 한다.)
 *
 * 닫으면 그 브라우저에서는 다시 뜨지 않는다. 늘 떠 있는 것이 거슬리는
 * 사람에게 끌 방법이 없으면, 그 사람은 홈페이지 자체를 덜 오게 된다.
 */

const HIDE_KEY = "wjsosang:rail:off";

export default function ServiceRail({
  links,
}: {
  /** 왼쪽 2개 + 오른쪽 2개로 나눠 붙는다 */
  links: (ServiceLink & { logo: string | null })[];
}) {
  // 서버와 첫 그림이 같아야 하므로, 숨김 여부는 화면이 뜬 뒤에 확인한다.
  const [off, setOff] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setOff(window.localStorage.getItem(HIDE_KEY) === "1");
    } catch {
      /* 저장소가 막혀 있으면 그냥 보여준다 */
    }
    setReady(true);
  }, []);

  const close = () => {
    setOff(true);
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* 못 저장해도 이번 방문에는 닫힌다 */
    }
  };

  if (!ready || off || links.length === 0) return null;

  const half = Math.ceil(links.length / 2);

  return (
    <div aria-label="공공 서비스 바로가기" className="hidden min-[1480px]:block">
      <Column side="left" links={links.slice(0, half)} onClose={close} />
      <Column side="right" links={links.slice(half)} onClose={close} />
    </div>
  );
}

function Column({
  side,
  links,
  onClose,
}: {
  side: "left" | "right";
  links: (ServiceLink & { logo: string | null })[];
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-1/2 z-40 -translate-y-1/2 ${
        side === "left" ? "left-5" : "right-5"
      }`}
    >
      <p className="mb-2 text-center text-[10.5px] font-bold tracking-[0.14em] text-muted">
        {side === "left" ? "자주 찾는 곳" : "바로가기"}
      </p>

      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              title={`${link.name} — ${link.hint}`}
              className="group flex w-[118px] flex-col items-center gap-2 rounded-xl border border-line bg-white px-3 py-3.5 text-center shadow-[0_4px_16px_rgba(22,36,31,0.06)] transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_8px_22px_rgba(22,36,31,0.12)]"
            >
              {/* 로고 파일이 없으면 이름만 둔다. 이름 앞 두 글자를 함께 넣으면
                  "소상 소상공인365" 처럼 같은 말이 두 번 보여서 더 어수선하다. */}
              {link.logo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={link.logo} alt="" className="h-7 w-auto max-w-full object-contain" />
              )}

              <span className="text-[12.5px] font-bold leading-tight transition-colors group-hover:text-brand">
                {link.short}
              </span>
              <span className="text-[10.5px] leading-tight text-muted">{link.hint}</span>
            </a>
          </li>
        ))}
      </ul>

      {side === "right" && (
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-lg py-1.5 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
        >
          바로가기 닫기 ✕
        </button>
      )}
    </div>
  );
}
