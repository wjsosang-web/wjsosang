-- ============================================================================
-- 배지 표시 제어
--
-- 신입회원 배지는 가입일 기준으로 자동으로 붙는다.
-- 다만 원치 않는 회원이 있을 수 있으므로 관리자가 끌 수 있게 한다.
-- ============================================================================

alter table businesses
  add column if not exists hide_new_badge boolean not null default false;

comment on column businesses.hide_new_badge is
  '신입회원 배지를 숨길지. 가입 6개월 이내라도 이걸 켜면 배지가 나오지 않는다.';
