import Link from "next/link";
import Badge from "@/components/common/Badge";
import { PinIcon } from "@/components/common/Icons";
import type { BusinessCard as CardData } from "@/lib/search";

/**
 * 회원업장 카드 (시안 기준).
 * 사진 → 업종 배지 → 상호 → 한 줄 소개 → 지역.
 * 사진은 회원이 올린 것이 없으면 플레이스 대표사진이 들어온다.
 */
export default function BusinessCard({
  business,
  variant = "default",
  showMemberBadge = false,
}: {
  business: CardData;
  /** large = 이달의 추천 (사진 크게), compact = 목록 그리드 */
  variant?: "default" | "large" | "compact";
  /** 카드 상단에 "원주청년소상공인협회 회원사" 띠를 붙일지 */
  showMemberBadge?: boolean;
}) {
  const aspect = variant === "large" ? "aspect-[16/10]" : "aspect-[4/3]";

  return (
    <Link
      href={`/business/${business.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.08)]"
    >
      {showMemberBadge && (
        <p className="flex items-center gap-1.5 border-b border-line bg-brand-tint-2 px-3 py-2 text-[10.5px] font-bold text-brand-deep">
          <span aria-hidden className="grid h-4 w-4 place-items-center rounded-sm bg-brand text-[8px] text-white">
            wj
          </span>
          원주청년소상공인협회 회원사
        </p>
      )}

      <div className={`relative overflow-hidden ${aspect}`}>
        {business.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div aria-hidden className="ph h-full w-full" />
        )}

        {variant === "large" && (
          <Badge label={business.category} className="absolute left-3 top-3 bg-white/95" />
        )}

        {business.isNew && (
          <span className="absolute right-2 top-2 rounded-md bg-amber px-2 py-1 text-[10.5px] font-bold text-white">
            신입회원
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${variant === "compact" ? "p-3.5" : "p-4"}`}>
        <h3
          className={`font-bold leading-snug transition-colors group-hover:text-brand ${
            variant === "large" ? "text-[17px]" : "text-[15px]"
          }`}
        >
          {business.name}
        </h3>

        {variant !== "large" && (
          <Badge label={business.category} className="mt-2 self-start" />
        )}

        <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-muted">
          {business.tagline}
        </p>

        <p className="mt-auto flex items-center gap-1 pt-3 text-[12.5px] text-muted">
          <PinIcon className="h-[13px] w-[13px] shrink-0" />
          원주시 {business.district}
        </p>

        {variant === "compact" && (
          <span className="mt-3 block rounded-md border border-line py-2 text-center text-[12.5px] font-bold text-ink transition-colors group-hover:border-brand group-hover:text-brand">
            업장 보기 →
          </span>
        )}
      </div>
    </Link>
  );
}
