import Link from "next/link";

/**
 * 서브페이지 상단 히어로 (시안 기준).
 * 사진 배경 + 왼쪽 텍스트 + 오른쪽 손글씨 포인트 문구.
 */
export interface HeroCta {
  label: string;
  href: string;
  variant?: "solid" | "outline";
}

/** 바탕색 — 관리자에서 고른다 */
const TONES: Record<string, { bg: string; scrim: string }> = {
  forest: { bg: "bg-forest", scrim: "from-forest/90 via-forest/65 to-forest/25" },
  brand: { bg: "bg-brand-deep", scrim: "from-brand-deep/92 via-brand-deep/70 to-brand-deep/30" },
  city: { bg: "bg-city", scrim: "from-city/92 via-city/70 to-city/30" },
  ink: { bg: "bg-ink", scrim: "from-ink/92 via-ink/70 to-ink/30" },
};

export default function PageHero({
  eyebrow,
  title,
  highlight = [],
  description,
  note,
  image,
  ctas = [],
  children,
  size = "md",
  tone = "forest",
}: {
  eyebrow?: string;
  /** 줄바꿈(\n)을 그대로 살린다 */
  title: string;
  /** 초록으로 강조할 단어들 */
  highlight?: string[];
  description?: string;
  note?: string;
  image?: string | null;
  ctas?: HeroCta[];
  /** 히어로 하단에 겹쳐 놓을 것(회원업장 검색바 등) */
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: string;
}) {
  // 배너가 너무 높으면 정작 볼 내용이 아래로 밀린다. 전체적으로 낮게 잡았다.
  const pad =
    size === "lg"
      ? "pt-12 pb-14 md:pt-16 md:pb-20"
      : size === "sm"
        ? "pt-8 pb-9 md:pt-10 md:pb-11"
        : "pt-10 pb-12 md:pt-12 md:pb-14";

  const palette = TONES[tone] ?? TONES.forest;

  return (
    <section className={`relative isolate overflow-hidden ${palette.bg}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <div aria-hidden className="ph-dark absolute inset-0 -z-10" />
      )}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 bg-gradient-to-r ${palette.scrim}`}
      />

      <div className={`mx-auto max-w-[1180px] px-5 ${pad}`}>
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="flex items-center gap-3 text-[13px] font-semibold text-white/80">
                {eyebrow}
                <span aria-hidden className="block h-px w-8 bg-white/40" />
              </p>
            )}

            <h1 className="mt-4 whitespace-pre-line text-[28px] font-bold leading-[1.28] tracking-[-0.02em] text-white sm:text-[36px] md:text-[44px]">
              <Highlighted text={title} words={highlight} tone="dark" />
            </h1>

            {description && (
              <p className="mt-5 whitespace-pre-line text-[14.5px] leading-[1.8] text-white/85 md:text-[16px]">
                {description}
              </p>
            )}

            {ctas.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2.5">
                {ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-[15px] font-bold transition-colors ${
                      cta.variant === "outline"
                        ? "border border-white/50 text-white hover:bg-white hover:text-forest"
                        : "bg-brand text-white hover:bg-brand-deep"
                    }`}
                  >
                    {cta.label}
                    <span aria-hidden>→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {note && (
            <p className="hand hidden shrink-0 whitespace-pre-line text-right text-[26px] leading-[1.6] text-white/90 lg:block">
              {note}
            </p>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}

/** 제목 안의 특정 단어만 초록으로 칠한다. */
export function Highlighted({
  text,
  words,
  tone = "light",
}: {
  text: string;
  words: string[];
  /** dark = 짙은 배경 위 (밝은 초록), light = 흰 배경 위 (브랜드 초록) */
  tone?: "dark" | "light";
}) {
  if (words.length === 0) return <>{text}</>;
  const color = tone === "dark" ? "text-brand-light" : "text-brand";

  // 긴 단어부터 찾아야 부분 문자열이 먼저 잡히지 않는다.
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "g"));

  return (
    <>
      {parts.map((part, i) =>
        sorted.includes(part) ? (
          <span key={i} className={color}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
