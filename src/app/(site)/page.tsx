import BusinessCard from "@/components/common/BusinessCard";
import SectionHead from "@/components/common/SectionHead";
import SitePopup from "@/components/common/SitePopup";
import HeroSlider from "@/components/home/HeroSlider";
import JoinBand from "@/components/home/JoinBand";
import SloganBand from "@/components/home/SloganBand";
import NoticesAndActivities from "@/components/home/NoticesAndActivities";
import StatsBand from "@/components/home/StatsBand";
import UpcomingEventBanner from "@/components/home/UpcomingEventBanner";
import EventCalendar from "@/components/home/EventCalendar";
import {
  getActivePopups,
  getActivities,
  getEventYears,
  getEventsByYear,
  getHeroSlides,
  getNextEvent,
  getTodayEvents,
  getNotices,
  getOrgMembers,
  getPublicBusinesses,
  getSiteInfo,
  getStats,
  toDateKey,
} from "@/lib/repo";
import { buildBusinessCards, orderBusinessCards, seedFromDateKey } from "@/lib/search";
import type { Post } from "@/lib/types";

// 하루 단위로 다시 만든다. 회원업장 랜덤 노출 순서도 이 주기로 바뀐다.
export const revalidate = 86400;

export default async function HomePage() {
  const now = new Date();
  const todayKey = toDateKey(now);

  const [
    site,
    slides,
    stats,
    popups,
    todayEvents,
    notices,
    activities,
    nextEvent,
    businesses,
    org,
    years,
  ] = await Promise.all([
      getSiteInfo(),
      getHeroSlides(),
      getStats(),
      getActivePopups(now),
      getTodayEvents(now),
      getNotices(5),
      getActivities(3),
      getNextEvent(now),
      getPublicBusinesses(),
      getOrgMembers(),
      getEventYears(),
    ]);

  // 검색 텍스트와 노출 순서를 서버에서 확정한다.
  const cards = orderBusinessCards(
    buildBusinessCards(businesses, org, todayKey),
    seedFromDateKey(todayKey),
  );

  const thisYear = now.getFullYear();
  const calendarYears = years.length > 0 ? years : [thisYear];
  const eventsByYear: Record<number, Post[]> = Object.fromEntries(
    await Promise.all(calendarYears.map(async (y) => [y, await getEventsByYear(y)] as const)),
  );

  return (
    <>
      <SitePopup popups={popups} todayEvents={todayEvents} />

      <HeroSlider slides={slides} />
      <StatsBand items={stats} />
      <SloganBand site={site} />

      <NoticesAndActivities notices={notices} activities={activities} />

      {/* 회원업장 미리보기 */}
      <section className="bg-mist px-5 py-10 md:py-14">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead
            title="회원업장"
            description="원주의 다양한 청년 소상공인들을 소개합니다."
            moreHref="/business"
          />

          <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cards.slice(0, 8).map((b) => (
              <li key={b.id}>
                <BusinessCard business={b} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 예정된 행사가 없으면 이 영역 자체가 나오지 않는다 (기획안 9조). */}
      {nextEvent && <UpcomingEventBanner event={nextEvent} />}

      <JoinBand site={site} />

      <EventCalendar eventsByYear={eventsByYear} years={calendarYears} todayKey={todayKey} />
    </>
  );
}
