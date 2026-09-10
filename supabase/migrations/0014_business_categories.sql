-- ---------------------------------------------------------------------------
-- 0014. 업장 업종을 여러 개 고를 수 있게
--
-- 한 가게가 두 가지 일을 같이 하는 경우가 흔하다.
-- (픽폰&픽카는 휴대폰과 자동차를 함께 한다.)
-- 하나만 고르게 하면 나머지 한쪽으로 찾는 회원에게 안 걸린다.
--
-- 기존 category 칸은 지우지 않는다.
--   - 대표 업종으로 계속 쓴다 (카드 배지, 목록 정렬)
--   - 이미 이 값을 보는 코드가 많아 한 번에 바꾸면 위험하다
-- 대신 categories 를 더해서 "이 가게가 속한 모든 업종"을 담는다.
-- ---------------------------------------------------------------------------

alter table businesses add column if not exists categories text[] not null default '{}';

-- 지금 있는 업종을 첫 항목으로 옮겨 둔다. 이러면 바로 검색이 된다.
update businesses
   set categories = array[category]
 where categories = '{}' and category is not null and category <> '';

-- 업종으로 거르는 일이 잦아서 색인을 둔다
create index if not exists businesses_categories_idx on businesses using gin (categories);
