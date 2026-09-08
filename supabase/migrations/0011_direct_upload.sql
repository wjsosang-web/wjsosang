-- ---------------------------------------------------------------------------
-- 0011. 사진을 브라우저에서 저장소로 바로 올리기
--
-- 배포 환경(Vercel)은 서버로 보내는 요청 본문을 4.5MB 로 제한한다.
-- next.config 의 bodySizeLimit 을 아무리 키워도 그 앞에서 막히기 때문에,
-- 사진 몇 장만 붙여도 저장이 실패하고 흰 오류 화면이 뜬다.
--
-- 그래서 사진은 서버를 거치지 않고 브라우저에서 저장소로 직접 올린다.
-- 서버로는 업로드된 주소(글자)만 보낸다. 그러면 크기 제한과 무관해진다.
--
-- 대신 브라우저가 쓰는 anon 키로도 올릴 수 있어야 하므로,
-- "로그인한 관리자" 에게만 쓰기를 열어준다.
-- ---------------------------------------------------------------------------

-- 지금 로그인한 사람이 관리자인지 확인한다.
-- security definer 로 두어야 members 정책에 막히지 않는다.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from members
     where account_id = auth.uid()
       and role in ('admin', 'superadmin')
  );
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;

do $$
begin
  drop policy if exists "admin writes assets" on storage.objects;
  drop policy if exists "admin updates assets" on storage.objects;
  drop policy if exists "admin deletes assets" on storage.objects;

  execute $p$
    create policy "admin writes assets"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'public-assets' and is_admin())
  $p$;

  execute $p$
    create policy "admin updates assets"
      on storage.objects for update to authenticated
      using (bucket_id = 'public-assets' and is_admin())
  $p$;

  execute $p$
    create policy "admin deletes assets"
      on storage.objects for delete to authenticated
      using (bucket_id = 'public-assets' and is_admin())
  $p$;

  raise notice 'storage 쓰기 정책 준비 완료';
exception when others then
  raise notice 'storage 정책은 대시보드에서 설정해 주세요 (%)', sqlerrm;
end $$;
