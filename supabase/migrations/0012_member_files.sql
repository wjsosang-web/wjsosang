-- ---------------------------------------------------------------------------
-- 0012. 회원 전용 파일 (협회 정관 등)
--
-- 정관은 아무나 내려받게 두면 안 되고, 그렇다고 지금은 회원 로그인이 없다.
-- 그래서 "협회원 코드"를 아는 사람만 받을 수 있게 한다.
--
-- 파일은 공개 저장소가 아니라 비공개 저장소에 둔다.
-- 주소를 알아도 열리지 않고, 코드를 맞힌 사람에게만 잠깐 열리는 주소를 만들어 준다.
-- (2단계에서 회원 로그인이 생기면 코드 확인을 로그인 확인으로 바꾸면 된다)
-- ---------------------------------------------------------------------------

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('member-files', 'member-files', false)
  on conflict (id) do nothing;
  raise notice '회원 전용 저장소 준비 완료';
exception when others then
  raise notice '회원 전용 저장소는 대시보드에서 만들어 주세요 (%)', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "admin manages member files" on storage.objects;

  execute $p$
    create policy "admin manages member files"
      on storage.objects for all to authenticated
      using (bucket_id = 'member-files' and is_admin())
      with check (bucket_id = 'member-files' and is_admin())
  $p$;

  raise notice '회원 전용 저장소 정책 준비 완료';
exception when others then
  raise notice '정책은 대시보드에서 설정해 주세요 (%)', sqlerrm;
end $$;
