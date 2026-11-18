-- 20261118000000_touch_updated_at.sql 보완(그 파일은 이미 적용됨 — 고치지 않고 덧댄다).
--
-- 1) 값이 그대로인 UPDATE(대시보드에서 바꾸지 않고 저장, 전체 행을 다시 쓰는 스크립트)는
--    updated_at을 올리지 않는다 — 일괄 정리 한 번에 사이트맵 lastmod가 전부 같은 시각이
--    되면 검색 엔진이 lastmod를 믿지 않게 된다.
-- 2) 투어 공연일(lives.tour_id)을 고치거나 지우거나 다른 투어로 옮기면 그 투어의
--    updated_at도 올린다 — 투어 상세 일정이 바뀌는데 공연일 행이 지워지거나 숨겨지면
--    (HIDDEN은 사이트가 못 읽음) 코드의 "투어·공연일 중 최댓값"으로는 안 잡힌다.
--    tour_id 없이 slug만 투어 slug와 같은 공연일 행은 FK가 없어 여기서 못 잡는다.
-- 3) 부모 행 갱신은 트랜잭션당 한 번 — 세트리스트 30곡을 한 번에 넣어도 투어 행을 30번
--    다시 쓰지 않는다(now()는 트랜잭션 시작 시각이라 두 번째부터 조건에 걸림).
--
-- 다시 실행해도 안전하다(create or replace / drop ... if exists).

drop trigger if exists set_updated_at on public.lives;
create trigger set_updated_at
  before update on public.lives
  for each row when (old.* is distinct from new.*)
  execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.tours;
create trigger set_updated_at
  before update on public.tours
  for each row when (old.* is distinct from new.*)
  execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.setlists;
create trigger set_updated_at
  before update on public.setlists
  for each row when (old.* is distinct from new.*)
  execute function public.set_updated_at();

-- 여러 이벤트를 받는 트리거의 WHEN엔 OLD를 못 쓰니 값이 그대로인 UPDATE는 함수 안에서 거른다.
create or replace function public.touch_setlist_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old is not distinct from new then
    return null;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    update public.lives set updated_at = now()
      where id = old.live_id and updated_at is distinct from now();
    update public.tours set updated_at = now()
      where id = old.tour_id and updated_at is distinct from now();
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.lives set updated_at = now()
      where id = new.live_id and new.live_id is distinct from old.live_id
        and updated_at is distinct from now();
    update public.tours set updated_at = now()
      where id = new.tour_id and new.tour_id is distinct from old.tour_id
        and updated_at is distinct from now();
  end if;
  return null;
end;
$$;

-- 공연일이 바뀌거나 지워지면 그 투어(옮겼으면 옮기기 전·후 둘 다)를 올린다. 새 공연일
-- 추가는 그 행의 updated_at이 코드의 최댓값에 들어가므로 따로 안 건드린다.
create or replace function public.touch_live_parent_tour()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old is not distinct from new then
    return null;
  end if;
  update public.tours set updated_at = now()
    where id = old.tour_id and updated_at is distinct from now();
  if tg_op = 'UPDATE' and new.tour_id is distinct from old.tour_id then
    update public.tours set updated_at = now()
      where id = new.tour_id and updated_at is distinct from now();
  end if;
  return null;
end;
$$;

drop trigger if exists touch_live_parent_tour on public.lives;
create trigger touch_live_parent_tour
  after update or delete on public.lives
  for each row execute function public.touch_live_parent_tour();
