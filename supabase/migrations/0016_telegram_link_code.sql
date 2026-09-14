-- ---------------------------------------------------------------------------
-- 0016. 회원이 스스로 텔레그램을 연결할 수 있게
--
-- 지금은 텔레그램을 등록한 회원이 한 명도 없다. 그래서 문의가 들어와도
-- 알림을 받을 사람이 없어 아무에게도 가지 않는다.
--
-- 등록이 안 되는 이유는 간단하다. chat_id 는 그 사람이 봇에게 먼저 말을
-- 걸어야 알 수 있는 값이라, 회원이 홈페이지에 적어 넣을 수가 없다.
-- 사무국이 한 사람씩 물어서 넣는 방법뿐이었다.
--
-- 그래서 짧은 연결코드를 쓴다.
--   1. 회원이 내 정보에서 [연결하기] 를 누르면 여섯 자리 코드가 나온다
--   2. 그 코드를 협회 봇에게 보낸다
--   3. 홈페이지에서 [확인] 을 누르면 그 코드를 보낸 chat_id 를 찾아 연결한다
--
-- 코드는 10분만 살아 있다. 남의 코드를 우연히 맞히더라도 그 사이에만 쓸모가
-- 있고, 코드를 쓴 순간 지운다.
-- ---------------------------------------------------------------------------

alter table members add column if not exists telegram_link_code    text;
alter table members add column if not exists telegram_link_expires timestamptz;

-- 확인할 때 코드로 찾는다
create index if not exists members_link_code_idx on members (telegram_link_code)
  where telegram_link_code is not null;
