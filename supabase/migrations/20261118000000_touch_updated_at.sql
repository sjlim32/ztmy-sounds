-- lives·tours·setlists의 updated_at이 행을 고칠 때마다 갱신되게 한다. 지금까지는
-- 기본값(now())으로 처음 넣을 때만 채워져 created_at과 늘 같았다.
--
-- 사이트맵(src/app/sitemap.ts)이 공연 상세 페이지의 lastmod로 이 값을 쓴다 — 검색
-- 엔진이 바뀐 페이지만 다시 읽어 가게. 상세 페이지엔 세트리스트도 보이므로
-- 세트리스트를 넣거나 고치거나 지우면 그 공연(live_id)·투어(tour_id)의 updated_at도
-- 함께 올린다. 투어 상세는 투어 행과 그 공연일 행 중 가장 늦은 값을 쓴다(코드에서 계산).
-- 적용 뒤 다시 빌드·배포해야 사이트맵에 반영된다.
--
-- 20261118010000_refine_updated_at_triggers.sql이 이 파일의 트리거·함수를 다시 정의한다 —
-- 이 파일만 다시 실행하면 그 보완이 조용히 사라지니, 다시 실행할 땐 뒤 파일까지 순서대로.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.lives;
create trigger set_updated_at
  before update on public.lives
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.tours;
create trigger set_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.setlists;
create trigger set_updated_at
  before update on public.setlists
  for each row execute function public.set_updated_at();

-- 세트리스트가 바뀌면 그 공연·투어 행을 건드려 위 트리거로 updated_at을 올린다.
-- live_id·tour_id를 바꾸는 수정이면 옮기기 전·후 양쪽 다.
create or replace function public.touch_setlist_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.lives set updated_at = now() where id = old.live_id;
    update public.tours set updated_at = now() where id = old.tour_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.lives set updated_at = now()
      where id = new.live_id and new.live_id is distinct from old.live_id;
    update public.tours set updated_at = now()
      where id = new.tour_id and new.tour_id is distinct from old.tour_id;
  end if;
  return null;
end;
$$;

drop trigger if exists touch_setlist_parent on public.setlists;
create trigger touch_setlist_parent
  after insert or update or delete on public.setlists
  for each row execute function public.touch_setlist_parent();
