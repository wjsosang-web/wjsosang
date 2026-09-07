import Link from "next/link";

/**
 * 섹션 제목 줄.
 * 시안처럼 제목 옆에 설명이 나란히 붙고, 오른쪽 끝에 "더보기 →" 가 온다.
 */
export default function SectionHead({
  title,
  description,
  moreHref,
  moreLabel = "더보기",
  className = "",
}: {
  title: string;
  description?: string;
  moreHref?: string;
  moreLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-2 ${className}`}>
      <h2 className="text-[21px] font-bold tracking-[-0.02em] md:text-[24px]">{title}</h2>
      {description && (
        <p className="text-[14px] text-muted md:text-[14.5px]">{description}</p>
      )}
      {moreHref && (
        <Link
          href={moreHref}
          className="ml-auto shrink-0 text-[13.5px] font-semibold text-muted transition-colors hover:text-brand"
        >
          {moreLabel} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
