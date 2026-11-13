-- 취소된 공연(예: 코로나로 취소된 공연일)을 지우지 않고 남겨 두기 위해 lives.status에
-- 'CANCELED'를 허용한다. 다른 표(songs·albums·tours)의 status는 그대로다.
--
-- CANCELED로 바꾼 공연은 참전 기록·통계·검색·상세 페이지에서 빠지고, 공연 목록(단독
-- 공연)·투어 상세 일정엔 회색·취소선으로 남는다(누를 수 없음). 사이트가 읽으려면
-- 20261114010000_allow_read_canceled_lives.sql도 적용해야 하고, 다시 빌드·배포해야
-- 반영된다.
-- 예) update public.lives set status = 'CANCELED' where id = '...';

alter table public.lives drop constraint if exists lives_status_check;
alter table public.lives
  add constraint lives_status_check
  check (status in ('ACTIVE', 'PENDING', 'HIDDEN', 'DELETED', 'CANCELED'));
