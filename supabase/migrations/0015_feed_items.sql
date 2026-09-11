-- ---------------------------------------------------------------------------
-- 0015. 바깥에서 모아 오는 소식 (지원사업 · 정책자금 · 교육 · 행사)
--
-- 회원들이 지원금을 못 받는 가장 흔한 이유는 자격이 안 돼서가 아니라
-- 공고가 올라온 줄 몰라서다. 공고는 여러 곳에 흩어져 올라오고,
-- 신청 기간은 보통 2~3주다. 그래서 매일 한 번씩 모아 두고,
-- 처음 보는 공고만 골라 텔레그램으로 보낸다.
--
-- 같은 공고를 두 번 보내지 않는 것이 이 표의 핵심이다.
-- source + external_id 를 유일하게 두어, 다시 모아도 이미 있는 건 무시된다.
-- notified_at 이 비어 있으면 "아직 안 보낸 것"이다.
-- ---------------------------------------------------------------------------

create table if not exists feed_items (
  id            uuid primary key default gen_random_uuid(),

  -- 어디서 가져왔는지: bizinfo(지원사업·정책자금) / semas_edu(교육) / festival(행사)
  source        text not null,
  -- 그쪽에서 쓰는 고유 번호. 같은 공고인지 알아보는 기준이다.
  external_id   text not null,

  title         text not null,
  summary       text not null default '',
  link          text not null default '',
  -- 주관기관 (중소벤처기업부, 원주시 …)
  organizer     text,
  -- 분야 (금융, 창업, 교육, 행사 …)
  category      text,

  -- 신청·행사 기간. 없는 공고도 많아서 비워 둘 수 있다.
  starts_on     date,
  ends_on       date,
  published_on  date,

  -- 텔레그램으로 보낸 시각. 비어 있으면 아직 안 보낸 것이다.
  notified_at   timestamptz,
  -- 관리자가 홈페이지에 안 보이게 감춘 공고
  hidden        boolean not null default false,

  created_at    timestamptz not null default now()
);

-- 같은 공고를 두 번 담지 않는다
create unique index if not exists feed_items_unique on feed_items (source, external_id);

-- 목록은 늘 "마감 안 지난 것부터" 로 읽는다
create index if not exists feed_items_ends_idx on feed_items (ends_on desc nulls last);
create index if not exists feed_items_source_idx on feed_items (source, published_on desc);

alter table feed_items enable row level security;

-- 홈페이지에서 누구나 읽는다 (감춘 것은 제외)
drop policy if exists feed_items_read on feed_items;
create policy feed_items_read on feed_items
  for select using (hidden = false);

-- 쓰기는 관리자만. 실제 수집은 서비스 키로 도는 서버가 한다.
drop policy if exists feed_items_write on feed_items;
create policy feed_items_write on feed_items
  for all using (is_admin()) with check (is_admin());
