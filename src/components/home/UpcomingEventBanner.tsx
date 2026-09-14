import Link from "next/link";
import { CalendarIcon, ClockIcon, PinIcon } from "@/components/common/Icons";
import type { Post } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 예정 행사 배너 (시안 기준).
 * 예정된 행사가 없으면 page.tsx 에서 아예 렌더하지 않는다 (기획안 9조).
 */
export default function UpcomingEventBanner({ event }: { event: Post }) {
  const key = event.startDate ?? event.date;
  const date = new Date(`${key}T00:00:00`);

  /**
   * 날짜 미정 행사는 저장된 날짜가 "그 달" 을 가리킬 뿐 실제 날이 아니다.
   * 그대로 "9월 30일" 이라고 적으면 정해지지도 않은 날을 알려주는 셈이라,
   * 그날 헛걸음하는 회원이 생긴다. 달까지만 적는다.
   */
  const label = event.dateTbd
    ? `${date.getMonth() + 1}월 중 · 일정 확정 후 안내`
    : `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;

  return (
    <section className="px-5 py-8 md:py-10">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 rounded-2xl bg-brand-tint px-6 py-6 md:flex-row md:items-center md:gap-8 md:px-8">
        <div className="flex shrink-0 items-center gap-3.5">
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-brand"
          >
            <CalendarIcon className="h-[22px] w-[22px]" />
          </span>
          <span>
            <span className="block text-[16px] font-bold">예정 행사</span>
            <span className="mt-0.5 block text-[12.5px] text-ink-soft">
              다가오는 행사에서 또 만나요!
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1 md:border-l md:border-brand/20 md:pl-8">
          <h3 className="text-[17px] font-bold leading-snug md:text-[18px]">{event.title}</h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-ink-soft">
            <span
              className={`flex items-center gap-1.5 ${
                event.dateTbd ? "font-semibold text-amber" : "tnum"
              }`}
            >
              <ClockIcon className="h-[14px] w-[14px] shrink-0 text-brand" />
              {label}
              {/* 날짜가 미정이면 시각도 정해진 것이 아니다 */}
              {!event.dateTbd && event.time ? ` ${event.time}` : ""}
            </span>
            {!event.dateTbd && event.place && (
              <span className="flex items-center gap-1.5">
                <PinIcon className="h-[14px] w-[14px] shrink-0 text-brand" />
                {event.place}
              </span>
            )}
          </p>
        </div>

        <Link
          href={`/activities/${event.slug}`}
          className="shrink-0 self-start rounded-lg bg-brand px-6 py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep md:self-auto"
        >
          자세히 보기 <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
