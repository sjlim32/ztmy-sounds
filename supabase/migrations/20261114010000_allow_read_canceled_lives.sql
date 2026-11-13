-- 취소된 공연(lives.status = 'CANCELED')을 사이트가 읽을 수 있게 한다. 사이트는 빌드 때
-- 공개 키(anon)로 조회하는데, 지금 읽기 규칙(RLS)이 ACTIVE 행만 보여 줘서 CANCELED로
-- 바꾼 공연이 아예 안 보인다. 읽기 규칙은 여러 개면 하나만 맞아도 보이므로(permissive),
-- 기존 규칙은 그대로 두고 CANCELED 행을 읽는 규칙만 더한다.
--
-- 사이트에선 공연 목록(단독 공연)과 투어 상세 일정에만 회색·취소선으로 보이고, 누를 수
-- 없다. 참전 기록·통계·검색은 지금처럼 ACTIVE만 쓴다.
--
-- 확인용) select policyname, roles, qual from pg_policies where tablename = 'lives';

drop policy if exists "lives_select_canceled" on public.lives;
create policy "lives_select_canceled"
  on public.lives
  for select
  to anon, authenticated
  using (status = 'CANCELED');
