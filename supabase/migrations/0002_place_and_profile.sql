-- ============================================================================
-- 네이버 플레이스 자동채움 + 사진 구조 확장
--
--  1. 업장 사진 우선순위
--       회원/관리자가 올린 대표사진 → 회원이 올린 사진 첫 장 → 플레이스 대표사진
--     플레이스에서 가져온 사진은 별도 칼럼(place_photo)에 두고
--     회원이 올린 사진(cover_image)과 절대 섞지 않는다.
--     그래야 회원이 나중에 사진을 올리면 자동으로 그쪽이 우선된다.
--
--  2. 어떤 값이 자동으로 들어왔고 어떤 값을 관리자가 고쳤는지 field_sources 에 남긴다.
--     (자동 등록이 아니라 자동 채우기 + 관리자 확인 — 기획안 22조)
--
--  3. 회원 프로필 사진
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 업장 — 플레이스 연동 칼럼
-- ---------------------------------------------------------------------------
alter table businesses
  -- 플레이스 고유 id (예: m.place.naver.com/restaurant/1234567890 의 1234567890)
  add column place_id        text,
  -- 플레이스 업종 경로 (restaurant / hairshop / place ...)
  add column place_type      text,
  -- 플레이스 대표사진. cover_image 가 비었을 때만 화면에 쓰인다.
  add column place_photo     text,
  -- 플레이스 대표키워드. 검색 대상에 포함되지만 화면에 나열하지는 않는다.
  add column place_keywords  text[] not null default '{}',
  -- 자동채움 이력: {"name":"place","phone":"manual", ...}
  add column field_sources   jsonb  not null default '{}'::jsonb;

create unique index on businesses (place_id) where place_id is not null;

-- ---------------------------------------------------------------------------
-- 업장 메뉴 — 플레이스에서 가져오거나 관리자가 직접 넣는다
-- ---------------------------------------------------------------------------
create table business_menus (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name        text not null,
  price       text,                    -- "12,000원", "시가" 처럼 문자열로 둔다
  description text,
  image_url   text,
  -- 'place' = 플레이스에서 자동으로 가져옴, 'manual' = 사람이 입력
  source      text not null default 'manual',
  sort_order  integer not null default 0
);
create index on business_menus (business_id, sort_order);

alter table business_menus enable row level security;
create policy "public read menus" on business_menus
  for select using (exists (
    select 1 from businesses b where b.id = business_id and b.status = 'public'));

-- ---------------------------------------------------------------------------
-- 플레이스 원본 응답 보관
-- 나중에 파싱 규칙을 고쳤을 때 다시 처리할 수 있도록 원본을 남긴다.
-- 실패 원인 추적에도 쓴다.
-- ---------------------------------------------------------------------------
create table place_imports (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid references businesses (id) on delete set null,
  input_url    text not null,
  resolved_url text,
  place_id     text,
  -- 'ok' | 'partial' | 'failed'
  result       text not null,
  -- 어떤 항목을 가져왔고 어떤 항목이 비었는지
  filled       text[] not null default '{}',
  missing      text[] not null default '{}',
  raw          jsonb,
  error        text,
  created_by   uuid references members (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index on place_imports (created_at desc);

alter table place_imports enable row level security;
-- 관리자(service role) 전용. 공개 정책을 열지 않는다.

-- ---------------------------------------------------------------------------
-- 회원 프로필 사진
-- 조직도·임원 카드에서 org_members.photo 가 비어 있으면 이 값을 쓴다.
-- ---------------------------------------------------------------------------
alter table members
  add column profile_image text;
