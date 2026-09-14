-- ---------------------------------------------------------------------------
-- 0018. 회원 방문 횟수
--
-- 누가 홈페이지를 자주 찾아주시는지 세어 순위를 보여준다.
--
-- 셀 수 있는 사람은 로그인한 회원뿐이다. 그냥 지나가는 사람은 누구인지
-- 알 수 없으므로 순위에 올릴 수 없다.
--
-- 하루에 한 번만 센다. 새로고침할 때마다 세면 한 사람이 하루에 백 번도
-- 올릴 수 있어서 순위가 아무 뜻이 없어진다. "며칠 들르셨는가" 가
-- "몇 번 눌렀는가" 보다 정직하다.
-- ---------------------------------------------------------------------------

alter table members add column if not exists visit_count   integer not null default 0;
-- 마지막으로 센 날. 오늘과 같으면 오늘은 이미 셌다는 뜻이다.
alter table members add column if not exists last_visit_on date;

-- 순위는 이 값으로 줄 세운다
create index if not exists members_visit_count_idx on members (visit_count desc)
  where visit_count > 0;
