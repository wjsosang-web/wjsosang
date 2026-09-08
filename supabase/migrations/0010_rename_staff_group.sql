-- ---------------------------------------------------------------------------
-- 0010. 조직 분류 이름 변경: 운영진 → 임원진
--
-- 협회에서 실제로 쓰는 말에 맞춘다.
-- 값 이름만 바꾸므로 이미 들어있는 행은 그대로 따라온다.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
     where t.typname = 'org_group' and e.enumlabel = '운영진'
  ) then
    alter type org_group rename value '운영진' to '임원진';
  end if;
end $$;

-- 관리자에서 정한 분류 순서에도 옛 이름이 남아 있으면 같이 고친다.
update site_settings
   set value = (
         select jsonb_agg(case when v = '"운영진"'::jsonb then '"임원진"'::jsonb else v end)
           from jsonb_array_elements(value) as v
       )
 where key = 'orgGroupOrder'
   and jsonb_typeof(value) = 'array'
   and value @> '["운영진"]'::jsonb;
