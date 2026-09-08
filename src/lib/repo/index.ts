/**
 * 데이터 접근 계층.
 *
 * 페이지는 이 파일의 함수만 호출한다.
 * 실제 구현은 두 벌이고, 환경에 따라 자동으로 골라 쓴다.
 *
 *   Supabase 자격증명 있음 → repo/supabase.ts (DB)
 *   없음                   → repo/seed.ts     (로컬 시드 JSON)
 *
 * 덕분에 자격증명이 없어도 사이트가 그대로 뜨고, 값을 넣는 순간 DB로 갈아탄다.
 * 화면 코드는 어느 쪽이 쓰이는지 알 필요가 없다.
 * (기획안 38조 — 페이지는 데이터를 보여주는 껍데기여야 한다.)
 */

import { dataSource } from "@/lib/supabase/config";
import * as seed from "@/lib/repo/seed";
import * as supabase from "@/lib/repo/supabase";

/** 요청 시점마다 판단한다. 환경변수가 늦게 들어와도 반영된다. */
function impl() {
  return dataSource() === "supabase" ? supabase : seed;
}

export { toDateKey } from "@/lib/date";

/* 사이트 설정 */
export const getSiteInfo = () => impl().getSiteInfo();
export const getStats = () => impl().getStats();
export const getHeroSlides = () => impl().getHeroSlides();
export const getFaqs = () => impl().getFaqs();
export const getPresidentMessage = () => impl().getPresidentMessage();
export const getActivePopups = (now?: Date) => impl().getActivePopups(now);
export const getStory = () => impl().getStory();
export const getPrograms = () => impl().getPrograms();
export const getHistory = () => impl().getHistory();
export const getPartners = () => impl().getPartners();

/* 업장 */
export const getPublicBusinesses = () => impl().getPublicBusinesses();
export const getBusinessBySlug = (slug: string) => impl().getBusinessBySlug(slug);
export const getBusinessById = (id: string) => impl().getBusinessById(id);
export const getFeaturedBusinesses = (limit?: number) => impl().getFeaturedBusinesses(limit);
export const getDistricts = () => impl().getDistricts();

/* 조직 */
export const getOrgMembers = () => impl().getOrgMembers();

/* 게시물 */
export const getNotices = (limit?: number) => impl().getNotices(limit);
export const getActivities = (limit?: number) => impl().getActivities(limit);
export const getPublicPosts = () => impl().getPublicPosts();
export const getPostBySlug = (slug: string) => impl().getPostBySlug(slug);
export const getEventsByYear = (year: number) => impl().getEventsByYear(year);
export const getEventYears = () => impl().getEventYears();
export const getNextEvent = (now?: Date) => impl().getNextEvent(now);
export const getTodayEvents = (now?: Date) => impl().getTodayEvents(now);

/* 회원 (2단계 회원 로그인 대비) */
export const getMembers = () => impl().getMembers();
export const getBusinessesOwnedBy = (memberId: string) => impl().getBusinessesOwnedBy(memberId);
export const getMembersOfBusiness = (businessId: string) => impl().getMembersOfBusiness(businessId);
