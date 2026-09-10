import BusinessCard from "@/components/common/BusinessCard";
import SectionHead from "@/components/common/SectionHead";
import SitePopup from "@/components/common/SitePopup";
import HeroSlider from "@/components/home/HeroSlider";
import JoinBand from "@/components/home/JoinBand";
import SloganBand from "@/components/home/SloganBand";
import NoticesAndActivities from "@/components/home/NoticesAndActivities";
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
  toDateKey,
} from "@/lib/repo";
import { buildBusinessCards, orderBusinessCards, seedFromDateKey } from "@/lib/search";
import type { Post } from "@/lib/types";

// 하루 단위로 다시 만든다. 회원업장 랜덤 노출 순서도 이 주기로 바뀐다.
/**
 * 관리자가 저장하면 그 즉시 새로 만들어진다(refreshPublicPages).
 * 이 값은 혹시 그 갱신을 놓쳤을 때를 위한 안전망이다.
 * 하루로 두면 한 번 놓쳤을 때 꼬박 하루가 지나야 고쳐지므로 1분으로 둔다.
 */
export const revalidate = 60;

export default async function HomePage() {
  const now = new Date();
  const todayKey = toDateKey(now);

  const [
    site,
    slides,
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

      {/* 히어로 바로 아래 — 예정된 행사가 없으면 이 자리는 비운다 (기획안 9조) */}
      {nextEvent && <UpcomingEventBanner event={nextEvent} />}

      <NoticesAndActivities notices={notices} activities={activities} />

      <SloganBand site={site} />

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

      <JoinBand site={site} />

      <EventCalendar eventsByYear={eventsByYear} years={calendarYears} todayKey={todayKey} />
    </>
  );
}
