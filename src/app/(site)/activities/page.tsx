import type { Metadata } from "next";
import Link from "next/link";
import ActivityTabs from "@/components/activities/ActivityTabs";
import PageHero from "@/components/common/PageHero";
import { CalendarIcon, ClockIcon, PinIcon } from "@/components/common/Icons";
import { getActivities, getEventsByYear, getNextEvent, getNotices } from "@/lib/repo";

export const metadata: Metadata = { title: "협회활동" };
/**
 * 관리자가 저장하면 그 즉시 새로 만들어진다(refreshPublicPages).
 * 이 값은 혹시 그 갱신을 놓쳤을 때를 위한 안전망이다.
 * 하루로 두면 한 번 놓쳤을 때 꼬박 하루가 지나야 고쳐지므로 1분으로 둔다.
 */
export const revalidate = 60;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function ActivitiesPage() {
  const now = new Date();
  const year = now.getFullYear();

  const [notices, activities, events, nextEvent] = await Promise.all([
    getNotices(),
    getActivities(),
    getEventsByYear(year),
    getNextEvent(now),
  ]);

  return (
    <>
      <PageHero
        eyebrow="원주청년소상공인협회"
        title={"협회활동\n원청협은 지금도 움직이고 있습니다."}
        highlight={["원청협"]}
        description={"좋은 사람들과, 더 좋은 원주를 만들어가는\n원주청년소상공인협회의 다양한 이야기를 만나보세요."}
        note={"좋은 일이,\n좋은 사람들과\n원주에서 :)"}
        size="sm"
      />

      <div className="pt-8" />

      <ActivityTabs
        notices={notices}
        activities={activities}
        events={events}
        year={year}
      />

      {/* 다가오는 행사 */}
      {nextEvent && <UpcomingBanner event={nextEvent} />}
    </>
  );
}

function UpcomingBanner({
  event,
}: {
  event: Awaited<ReturnType<typeof getNextEvent>> & object;
}) {
  const key = event.startDate ?? event.date;
  const date = new Date(`${key}T00:00:00`);
  const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;

  return (
    <section className="px-5 py-12">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 rounded-2xl bg-brand-tint px-6 py-6 md:flex-row md:items-center md:gap-8 md:px-8">
        <div className="flex shrink-0 items-center gap-3.5">
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-brand"
          >
            <CalendarIcon className="h-[22px] w-[22px]" />
          </span>
          <span>
            <span className="block text-[16px] font-bold">다가오는 행사</span>
            <span className="mt-0.5 block text-[12.5px] text-ink-soft">
              함께할 더 많은 이야기가 기다리고 있습니다.
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1 md:border-l md:border-brand/20 md:pl-8">
          <h2 className="text-[17px] font-bold leading-snug md:text-[18px]">{event.title}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-ink-soft">
            <span className="tnum flex items-center gap-1.5">
              <ClockIcon className="h-[14px] w-[14px] shrink-0 text-brand" />
              {label}
              {event.time ? ` ${event.time}` : ""}
            </span>
            {event.place && (
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
          행사 정보 보기 <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
