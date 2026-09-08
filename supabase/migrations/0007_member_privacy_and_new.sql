-- ============================================================================
-- 연락처 공개 여부 + 신입회원 표시
--
--  1. 연락처는 개인 휴대폰인 경우가 많다.
--     기본은 숨김이고, 회원이 동의한 곳만 관리자가 공개로 바꾼다.
--     값 자체는 지우지 않는다 — 협회가 연락할 때 필요하기 때문이다.
--
--  2. 협회 가입일을 두고, 6개월 안이면 "신입회원" 배지를 붙인다.
-- ============================================================================

alter table businesses
  -- 홈페이지에 전화번호를 보여줄지. 기본은 숨김.
  add column if not exists phone_public boolean not null default false,
  -- 협회 가입일. 신입회원 배지와 필터의 기준이 된다.
  add column if not exists member_since date;

comment on column businesses.phone_public is
  '홈페이지에 연락처를 노출할지 여부. 개인정보라 기본은 false(숨김).';
comment on column businesses.member_since is
  '협회 가입일. 오늘로부터 6개월 이내면 신입회원으로 표시한다.';

create index if not exists businesses_member_since_idx on businesses (member_since desc);
