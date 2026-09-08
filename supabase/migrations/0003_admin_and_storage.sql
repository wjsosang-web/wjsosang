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
