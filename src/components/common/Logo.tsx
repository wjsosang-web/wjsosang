/**
 * 협회 로고.
 *
 * public/logo 에 실제 파일이 있으면 그 이미지를 쓰고,
 * 아직 없으면 같은 자리에 임시 마크를 그린다.
 * (임시 마크는 협회 로고를 흉내 낸 것이 아니라 자리만 지키는 용도다.)
 */

interface Props {
  /** getLogoAssets() 로 얻은 경로. 없으면 null. */
  src: string | null;
  /** horizontal: 심볼+글자 가로조합 / symbol: 심볼 단독 */
  variant?: "horizontal" | "symbol";
  /** 짙은 배경 위에 올릴 때 글자색을 흰색으로 바꾼다. */
  tone?: "light" | "dark";
  /** 로고 높이(px) */
  height?: number;
  className?: string;
}

export default function Logo({
  src,
  variant = "horizontal",
  tone = "light",
  height = 40,
  className = "",
}: Props) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="원주청년소상공인협회"
        style={{ height }}
        className={`w-auto ${className}`}
      />
    );
  }

  const onDark = tone === "dark";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <FallbackMark size={height} />
      {variant === "horizontal" && (
        <span className="flex flex-col leading-none">
          <span
            className={`text-[15px] font-bold tracking-tight md:text-[16px] ${
              onDark ? "text-white" : "text-ink"
            }`}
          >
            원주청년소상공인협회
          </span>
          <span
            className={`mt-1 text-[9px] font-semibold tracking-[0.08em] ${
              onDark ? "text-white/60" : "text-muted"
            }`}
          >
            WONJU JUNIOR SMALL BUSINESS ASSOCIATION
          </span>
        </span>
      )}
    </span>
  );
}

/** 로고 파일이 들어오기 전까지 자리를 지키는 새싹 마크 */
function FallbackMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="40" height="40" rx="9" fill="var(--color-brand-tint)" />
      <path
        d="M20 30V19.5c0-3.6 2.6-6.6 6.1-7.2"
        stroke="var(--color-brand)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M19.9 20.4c-3.3.5-6.2-1.6-6.7-4.8 3.3-.5 6.2 1.6 6.7 4.8Z"
        fill="var(--color-brand)"
      />
      <path
        d="M20.6 18.2c.6-3.3 3.6-5.4 6.8-4.7-.6 3.3-3.6 5.4-6.8 4.7Z"
        fill="var(--color-leaf)"
      />
    </svg>
  );
}
