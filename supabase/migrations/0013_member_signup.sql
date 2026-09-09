-- ---------------------------------------------------------------------------
-- 0013. 회원 가입에 필요한 항목
--
-- 회원 로그인을 열면서 가입 때 받는 값을 담을 자리를 만든다.
--
-- 사업자등록번호처럼 밖으로 새면 안 되는 값은 businesses 에 두지 않는다.
-- businesses 는 공개 사이트가 anon 키로 통째로 읽어 가는 표라서,
-- 칼럼을 하나 늘리는 순간 그대로 노출된다. 그래서 별도 표에 두고
-- 정책을 하나도 만들지 않아 service role 로만 읽히게 한다.
-- ---------------------------------------------------------------------------

-- 생년월일과 텔레그램 — 회원 본인 정보
alter table members add column if not exists birth_date     date;
-- 'solar' = 양력, 'lunar' = 음력
alter table members add column if not exists birth_calendar text
  check (birth_calendar in ('solar', 'lunar'));
-- 텔레그램 알림 — 적지 않아도 가입은 된다
alter table members add column if not exists telegram_chat_id  text;
alter table members add column if not exists telegram_username text;
alter table members add column if not exists telegram_linked_at timestamptz;

create index if not exists members_telegram_idx on members (telegram_chat_id);

-- ---------------------------------------------------------------------------
-- 업장의 비공개 정보 — 사업자등록번호 등
-- 정책을 만들지 않는다. 즉 anon/authenticated 는 한 줄도 읽지 못하고
-- 관리자 작업(service role)만 읽고 쓴다.
-- ---------------------------------------------------------------------------
create table if not exists business_private (
  business_id    uuid primary key references businesses (id) on delete cascade,
  biz_reg_no     text,                    -- 사업자등록번호
  biz_type       text,                    -- '개인' / '법인'
  employee_count integer,                 -- 4대보험 가입 직원 수
  updated_at     timestamptz not null default now()
);

alter table business_private enable row level security;

-- ---------------------------------------------------------------------------
-- 가입 신청은 members.status = 'pending' 으로 쌓인다.
-- 인사국이 승인하면 'active' 가 된다. 누가 언제 승인했는지 남긴다.
-- ---------------------------------------------------------------------------
alter table members add column if not exists applied_at   timestamptz;
alter table members add column if not exists approved_at  timestamptz;
alter table members add column if not exists approved_by  uuid references members (id) on delete set null;
alter table members add column if not exists reject_reason text;

create index if not exists members_status_idx on members (status, applied_at desc);

-- 로그인한 사람이 자기 회원 정보를 고칠 수 있게 한다(가입 신청 중 수정).
drop policy if exists "member updates own record" on members;
create policy "member updates own record" on members
  for update using (account_id = auth.uid())
  with check (account_id = auth.uid());
