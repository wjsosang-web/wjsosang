-- ============================================================================
-- 원주청년소상공인협회 — 전체 스키마 (한 번에 실행용)
--
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하거나,
-- DB 접속 정보가 있으면  npm run db:migrate  로 적용합니다.
--
-- storage 관련 구문은 계정 권한에 따라 실패할 수 있는데,
-- 그 경우에도 나머지는 정상 생성되도록 예외를 잡아 두었습니다.
-- ============================================================================


-- ###########################################################################
-- 0001_init.sql
-- ###########################################################################

-- ============================================================================
-- 원주청년소상공인협회 — 초기 스키마
--
-- 핵심 원칙
--  1. 회원(members)과 업장(businesses)은 별도 테이블이다.
--  2. 소유관계는 member_businesses 라는 연결 테이블로만 표현한다.
--     회원 1명 : 업장 N개, 업장 1개 : 공동대표 N명 둘 다 가능하다.
--  3. 지금은 관리자만 로그인하지만 role / 승인(pending_edits) 구조를 미리 만든다.
--     2단계에서 회원 로그인을 켜도 테이블을 뜯어고칠 일이 없다.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 열거형
-- ---------------------------------------------------------------------------
create type role_type          as enum ('superadmin', 'admin', 'officer', 'member');
create type member_status      as enum ('pending', 'active', 'paused', 'withdrawn');
create type auth_provider      as enum ('kakao', 'naver', 'email');
create type ownership_type     as enum ('owner', 'co-owner', 'manager');
create type publish_status     as enum ('public', 'private', 'draft');
create type post_type          as enum ('notice', 'activity', 'event');
create type org_group          as enum ('회장단', '이사회·감사', '운영진', '고문단', '자문위원');
create type edit_request_state as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- 회원
-- ---------------------------------------------------------------------------
create table members (
  id            uuid primary key default gen_random_uuid(),
  -- Supabase auth.users 와 연결. 관리자가 대리등록한 회원은 아직 null 이다.
  account_id    uuid unique references auth.users (id) on delete set null,
  auth_provider auth_provider,
  name          text not null,
  role          role_type     not null default 'member',
  status        member_status not null default 'pending',
  phone         text,
  email         text,
  joined_at     date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 개인정보 활용동의 이력. 약관 버전별로 행이 쌓인다(재동의 추적용).
create table member_consents (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references members (id) on delete cascade,
  code       text not null,          -- terms / privacy / marketing / third_party
  label      text not null,
  required   boolean not null default false,
  agreed     boolean not null default false,
  version    text not null,
  agreed_at  timestamptz,
  created_at timestamptz not null default now()
);
create index on member_consents (member_id);

-- ---------------------------------------------------------------------------
-- 업장
-- ---------------------------------------------------------------------------
create table businesses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,           -- /business/pickphone
  name         text not null,
  category     text not null,
  tagline      text not null default '',
  description  text not null default '',
  owner_name   text not null default '',       -- 표기용. 실제 소유관계는 아래 연결 테이블.

  address      text not null default '',
  district     text not null default '',       -- 원주시 읍/면/동 (지역 필터 기준)
  lat          double precision,
  lng          double precision,

  phone         text,
  hours         text,
  place_url     text,
  homepage_url  text,
  sns_url       text,
  cover_image   text,

  -- 겉으로 드러내지 않는 추가 검색어(취급품목, 옛 상호 등)
  keywords     text[] not null default '{}',
  -- 메인 노출 우선순위. 작을수록 먼저. null 이면 랜덤 그룹.
  priority     integer,
  status       publish_status not null default 'draft',

  -- 네이버 플레이스 자동채움 추적 (자동등록이 아니라 자동채움 + 관리자 확인)
  sourced_from_place boolean not null default false,
  place_synced_at    timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on businesses (status);
create index on businesses (category);
create index on businesses (district);
create index on businesses (priority nulls last);

create table business_photos (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  url         text not null,
  caption     text not null default '',
  sort_order  integer not null default 0
);
create index on business_photos (business_id, sort_order);

-- 회원이 자유롭게 쓰는 홍보 영역. 2단계에서 회원이 직접 수정하는 블록.
create table business_promo_blocks (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  block_type  text not null default 'text',   -- text | image
  text        text,
  image_url   text,
  caption     text,
  sort_order  integer not null default 0
);
create index on business_promo_blocks (business_id, sort_order);

-- ---------------------------------------------------------------------------
-- 회원 - 업장 소유관계  (이 테이블이 전체 설계의 핵심)
-- ---------------------------------------------------------------------------
create table member_businesses (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members (id)    on delete cascade,
  business_id uuid not null references businesses (id) on delete cascade,
  ownership   ownership_type not null default 'owner',
  -- 2단계에서 이 회원이 해당 업장을 직접 수정할 수 있는지
  can_edit    boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (member_id, business_id)
);
create index on member_businesses (business_id);

-- ---------------------------------------------------------------------------
-- 조직도 — 임원이 바뀌면 이 테이블만 고치면 조직도가 따라 바뀐다
-- ---------------------------------------------------------------------------
create table org_members (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references members (id) on delete set null,
  business_id uuid references businesses (id) on delete set null,
  name        text not null,
  org_group   org_group not null,
  title       text not null,          -- 회장 / 부회장 / 사무국장 / 감사
  department  text,                   -- 사무국 / 재무국 / 관리국 / 인사국 / 홍보국 / 기획국
  photo       text,
  intro       text not null default '',
  expertise   text,                   -- 자문위원 전문분야
  sort_order  integer not null default 0
);
create index on org_members (org_group, sort_order);

-- ---------------------------------------------------------------------------
-- 게시물 — 공지사항 / 활동소식 / 행사를 하나의 테이블로
-- 활동소식과 갤러리를 분리하지 않는다. 사진은 게시글에 딸린다.
-- ---------------------------------------------------------------------------
create table posts (
  id          uuid primary key default gen_random_uuid(),
  type        post_type not null,
  slug        text unique not null,
  title       text not null,
  category    text,                   -- 공지 / 행사안내 / 지원사업 / 회원안내 / 기타
  date        date not null,
  start_date  date,                   -- 행사 기간
  end_date    date,
  place       text,
  summary     text not null default '',
  body        text not null default '',
  cover_image text,
  pinned      boolean not null default false,
  important   boolean not null default false,
  status      publish_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on posts (type, date desc);
create index on posts (status);

create table post_photos (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts (id) on delete cascade,
  url        text not null,
  caption    text not null default '',  -- 사진 한 장마다 붙는 설명
  sort_order integer not null default 0
);
create index on post_photos (post_id, sort_order);

-- ---------------------------------------------------------------------------
-- 회원 수정 승인 대기열 (기획안 26조)
-- 관리자 설정으로 "즉시 반영" / "승인 후 공개" 를 고를 수 있게 한다.
-- 초기값은 승인 후 공개.
-- ---------------------------------------------------------------------------
create table pending_edits (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members (id) on delete cascade,
  target_table text not null,          -- businesses / business_photos
  target_id    uuid not null,
  payload      jsonb not null,         -- 바뀐 값만 담는다
  state        edit_request_state not null default 'pending',
  reviewed_by  uuid references members (id) on delete set null,
  reviewed_at  timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);
create index on pending_edits (state, created_at desc);

-- ---------------------------------------------------------------------------
-- 문의
-- ---------------------------------------------------------------------------
create table inquiries (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null,         -- 협회문의 / 회원가입 / 협업제휴 / 행사 / 기타
  name           text not null,
  phone          text not null,
  company        text,
  email          text,
  message        text not null,
  privacy_agreed boolean not null default false,
  handled        boolean not null default false,
  created_at     timestamptz not null default now()
);
create index on inquiries (handled, created_at desc);

-- ---------------------------------------------------------------------------
-- 사이트 설정 — 숫자, 팝업, 기본정보 전부 DB에서 관리 (코드 하드코딩 금지)
-- ---------------------------------------------------------------------------
create table site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table site_stats (
  id         uuid primary key default gen_random_uuid(),
  value      text not null,            -- "2017", "176명" 처럼 문자열로 둔다
  label      text not null,
  sort_order integer not null default 0
);

create table popups (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null default '',
  image_url  text,
  link_url   text,
  link_label text,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  status     publish_status not null default 'draft'
);
create index on popups (status, start_at, end_at);

-- ---------------------------------------------------------------------------
-- RLS — 공개 콘텐츠는 로그인 없이 읽을 수 있어야 한다.
-- 쓰기는 전부 막아두고, 관리자 작업은 service role 로만 수행한다.
-- 2단계에서 회원 로그인을 켤 때 member 정책만 추가하면 된다.
-- ---------------------------------------------------------------------------
alter table businesses            enable row level security;
alter table business_photos       enable row level security;
alter table business_promo_blocks enable row level security;
alter table posts                 enable row level security;
alter table post_photos           enable row level security;
alter table org_members           enable row level security;
alter table site_stats            enable row level security;
alter table popups                enable row level security;
alter table members               enable row level security;
alter table member_businesses     enable row level security;
alter table member_consents       enable row level security;
alter table pending_edits         enable row level security;
alter table inquiries             enable row level security;

-- 공개된 것만 누구나 읽기
create policy "public read businesses" on businesses
  for select using (status = 'public');
create policy "public read posts" on posts
  for select using (status = 'public');
create policy "public read popups" on popups
  for select using (status = 'public' and now() between start_at and end_at);
create policy "public read org" on org_members for select using (true);
create policy "public read stats" on site_stats for select using (true);
create policy "public read business photos" on business_photos
  for select using (exists (
    select 1 from businesses b where b.id = business_id and b.status = 'public'));
create policy "public read promo" on business_promo_blocks
  for select using (exists (
    select 1 from businesses b where b.id = business_id and b.status = 'public'));
create policy "public read post photos" on post_photos
  for select using (exists (
    select 1 from posts p where p.id = post_id and p.status = 'public'));

-- 문의는 누구나 남길 수 있지만 읽지는 못한다
create policy "anyone can submit inquiry" on inquiries for insert with check (true);

-- members / member_businesses / member_consents / pending_edits 는
-- 2단계 회원 로그인 전까지 정책을 열지 않는다(= service role 전용).

-- ---------------------------------------------------------------------------
-- 2단계에서 켤 정책 초안 (지금은 주석 상태로만 둔다)
-- ---------------------------------------------------------------------------
-- create policy "member reads own record" on members
--   for select using (account_id = auth.uid());
--
-- create policy "member edits own business" on businesses
--   for update using (exists (
--     select 1
--     from member_businesses mb
--     join members m on m.id = mb.member_id
--     where mb.business_id = businesses.id
--       and mb.can_edit
--       and m.account_id = auth.uid()
--       and m.status = 'active'));


-- ###########################################################################
-- 0002_place_and_profile.sql
-- ###########################################################################

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


-- ###########################################################################
-- 0003_admin_and_storage.sql
-- ###########################################################################

-- ============================================================================
-- 관리자 로그인과 사진 저장소
--
-- 읽기/쓰기 권한 설계
--   공개 사이트 : anon 키 + 기존 "공개된 것만 읽기" 정책
--   관리자 화면 : 로그인 확인을 마친 뒤 service role 키로 처리 (RLS 우회)
--
-- 그래서 관리자용 SELECT 정책을 테이블마다 만들 필요가 없다.
-- 다만 "이 사람이 관리자인지" 확인하려면 본인 members 행은 읽을 수 있어야 한다.
--
-- 주의: storage 관련 구문은 계정 권한에 따라 실패할 수 있다.
-- SQL Editor 는 스크립트 전체를 한 트랜잭션으로 실행하므로, 그대로 두면
-- 앞에서 만든 테이블까지 전부 롤백된다. 그래서 예외를 잡아 넘어가게 했다.
-- (실패하면 버킷은 대시보드나 앱에서 따로 만든다)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 로그인한 사람이 자기 회원 정보를 읽을 수 있게 한다.
-- 관리자 판별(role 확인)에 쓰이고, 2단계 회원 로그인에서도 그대로 필요하다.
-- ---------------------------------------------------------------------------
drop policy if exists "member reads own record" on members;
create policy "member reads own record" on members
  for select using (account_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 갱신 시각 자동 반영
-- 관리자가 고칠 때마다 updated_at 이 따라 움직이게 한다.
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_touch on businesses;
create trigger businesses_touch before update on businesses
  for each row execute function touch_updated_at();

drop trigger if exists posts_touch on posts;
create trigger posts_touch before update on posts
  for each row execute function touch_updated_at();

drop trigger if exists members_touch on members;
create trigger members_touch before update on members
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 관리자 화면에서 자주 쓰는 조회를 위한 인덱스
-- ---------------------------------------------------------------------------
create index if not exists businesses_name_idx on businesses (name);
create index if not exists posts_created_idx on posts (created_at desc);

-- ---------------------------------------------------------------------------
-- 사진 저장소
-- 활동사진, 업장사진, 회원 프로필 사진이 여기 들어간다.
-- 권한이 없으면 조용히 넘어간다. 앱에서 만들어도 되기 때문이다.
-- ---------------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('public-assets', 'public-assets', true)
  on conflict (id) do nothing;
  raise notice 'storage 버킷 준비 완료';
exception when others then
  raise notice 'storage 버킷은 대시보드에서 만들어 주세요 (%)', sqlerrm;
end $$;

do $$
begin
  execute $p$
    create policy "public read assets"
      on storage.objects for select
      using (bucket_id = 'public-assets')
  $p$;
  raise notice 'storage 읽기 정책 준비 완료';
exception when others then
  raise notice 'storage 정책은 대시보드에서 설정해 주세요 (%)', sqlerrm;
end $$;


-- ###########################################################################
-- 0004_missing_columns.sql
-- ###########################################################################

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

