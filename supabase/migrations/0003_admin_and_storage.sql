-- ============================================================================
-- 관리자 로그인과 사진 저장소
--
-- 읽기/쓰기 권한 설계
--   공개 사이트 : anon 키 + 기존 "공개된 것만 읽기" 정책
--   관리자 화면 : 로그인 확인을 마친 뒤 service role 키로 처리 (RLS 우회)
--
-- 그래서 관리자용 SELECT 정책을 테이블마다 만들 필요가 없다.
-- 다만 "이 사람이 관리자인지" 확인하려면 본인 members 행은 읽을 수 있어야 한다.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 로그인한 사람이 자기 회원 정보를 읽을 수 있게 한다.
-- 관리자 판별(role 확인)에 쓰이고, 2단계 회원 로그인에서도 그대로 필요하다.
-- ---------------------------------------------------------------------------
create policy "member reads own record" on members
  for select using (account_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 사진 저장소
-- 활동사진, 업장사진, 회원 프로필 사진이 여기 들어간다.
-- 공개 사이트에서 그대로 보여주므로 읽기는 열어 둔다.
-- 업로드는 관리자 API가 service role 로 수행하므로 쓰기 정책은 열지 않는다.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

create policy "public read assets"
  on storage.objects for select
  using (bucket_id = 'public-assets');

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

create trigger businesses_touch before update on businesses
  for each row execute function touch_updated_at();
create trigger posts_touch before update on posts
  for each row execute function touch_updated_at();
create trigger members_touch before update on members
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 관리자 화면에서 자주 쓰는 조회를 위한 인덱스
-- ---------------------------------------------------------------------------
create index if not exists businesses_name_idx on businesses (name);
create index if not exists posts_created_idx on posts (created_at desc);
