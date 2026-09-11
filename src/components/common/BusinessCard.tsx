import Link from "next/link";
import Badge from "@/components/common/Badge";
import { PinIcon } from "@/components/common/Icons";
import type { BusinessCard as CardData } from "@/lib/search";

/**
 * 회원업장 카드 (시안 기준).
 * 사진 → 업종 배지 → 상호 → 한 줄 소개 → 지역.
 * 사진은 회원이 올린 것이 없으면 플레이스 대표사진이 들어온다.
 *
 * 좁은 화면에서는 한 줄에 세 칸이 들어가서 칸 하나가 100px 남짓이 된다.
 * 그 폭에 소개글과 버튼까지 넣으면 카드가 사진보다 네 배 길어져서,
 * 작은 화면에서는 사진·상호·지역만 남기고 나머지는 접는다.
 */
export default function BusinessCard({
  business,
  variant = "default",
}: {
  business: CardData;
  /** large = 사진 크게, compact = 목록 그리드 */
  variant?: "default" | "large" | "compact";
}) {
  const aspect = variant === "large" ? "aspect-[16/10]" : "aspect-[4/3]";
  const compact = variant === "compact";

  return (
    <Link
      href={`/business/${business.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.08)]"
    >
      <div className={`relative overflow-hidden ${aspect}`}>
        {business.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          /* 플레이스에 사진이 없는 업장. 빈 칸으로 두면 허전해서 협회 로고를 넣는다. */
          <div aria-hidden className="ph h-full w-full">
            <span className="ph-logo" />
          </div>
        )}

        {variant === "large" && (
          <Badge label={business.category} className="absolute left-3 top-3 bg-white/95" />
        )}

        {/* 임원·신입 배지. 둘 다 있으면 나란히 붙는다. */}
        <span className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1 sm:right-2 sm:top-2">
          {business.officerTitle && (
            <span className="rounded bg-brand px-1.5 py-0.5 text-[9.5px] font-bold text-white sm:rounded-md sm:px-2 sm:py-1 sm:text-[10.5px]">
              {business.officerTitle}
            </span>
          )}
          {business.isNew && (
            <span className="rounded bg-amber px-1.5 py-0.5 text-[9.5px] font-bold text-white sm:rounded-md sm:px-2 sm:py-1 sm:text-[10.5px]">
              신입회원
            </span>
          )}
        </span>
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-2 sm:p-3.5" : "p-3 sm:p-4"}`}>
        <h3
          className={`font-bold leading-snug transition-colors group-hover:text-brand ${
            variant === "large"
              ? "text-[17px]"
              : compact
                ? "line-clamp-2 text-[12.5px] sm:text-[15px]"
                : "text-[13.5px] sm:text-[15px]"
          }`}
        >
          {business.name}
        </h3>

        {variant !== "large" && (
          <Badge label={business.category} className="mt-1.5 self-start sm:mt-2" />
        )}

        {/* 소개글은 칸이 넉넉할 때만 보여준다.
            목록 그리드는 넓은 화면에서도 한 칸이 180px 안팎이라 넣지 않는다. */}
        {!compact && (
          <p className="mt-2 hidden line-clamp-2 text-[13px] leading-[1.6] text-muted sm:block">
            {business.tagline}
          </p>
        )}

        <p
          className={`mt-auto flex items-center gap-1 text-muted ${
            compact ? "pt-1.5 text-[11px] sm:pt-3 sm:text-[12.5px]" : "pt-2 text-[12px] sm:pt-3 sm:text-[12.5px]"
          }`}
        >
          <PinIcon className="h-[11px] w-[11px] shrink-0 sm:h-[13px] sm:w-[13px]" />
          <span className="truncate">원주시 {business.district}</span>
        </p>


      </div>
    </Link>
  );
}
