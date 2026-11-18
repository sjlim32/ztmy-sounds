-- setlists_track_unique가 실제로는 중복을 막지 못하던 문제. 행마다 tour_id·live_id 중
-- 하나는 늘 NULL이고(check_tour_or_live), day_number·show_number도 대개 NULL인데,
-- 기본 UNIQUE는 NULL끼리를 서로 다른 값으로 봐서 같은 곡 줄을 두 번 넣어도 통과했다.
-- NULLS NOT DISTINCT(PG 15+)로 NULL도 같은 값으로 비교한다. 적용 시점 중복은 0건.
-- 다시 실행해도 안전하다.

alter table public.setlists drop constraint if exists setlists_track_unique;
alter table public.setlists
  add constraint setlists_track_unique
  unique nulls not distinct (tour_id, live_id, track_number, day_number, show_number);
