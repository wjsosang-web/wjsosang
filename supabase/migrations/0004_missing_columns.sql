-- ============================================================================
-- 시안 반영 과정에서 화면·타입에는 추가했지만 스키마에 빠져 있던 칼럼들
--
--   site_stats.description / icon  숫자 항목의 설명문과 아이콘
--   businesses.featured            이달의 추천 회원업장
--   posts.time / participants      행사 시각, 활동 참여 인원
-- ============================================================================

alter table site_stats
  add column if not exists description text not null default '',
  add column if not exists icon        text not null default 'store';

alter table businesses
  add column if not exists featured boolean not null default false;

create index if not exists businesses_featured_idx on businesses (featured)
  where featured;

alter table posts
  add column if not exists time         text,
  add column if not exists participants integer;
