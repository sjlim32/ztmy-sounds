-- 같은 날 공연을 여러 번 하는 공연(예: CLEANING LABO — 하루에 낮·밤 2회) 지원.
--
-- 1) 공연의 하루 회차 — lives.metadata.shows에 회차 이름 배열로 적는다(매일 같은 회차 수).
--    배열이 2개 이상일 때만 회차로 나눈다(없거나 1개면 지금처럼 하루 1회).
--    예) update public.lives
--          set metadata = coalesce(metadata, '{}'::jsonb) || '{"shows": ["昼の部", "夜の部"]}'
--          where slug = 'cleaning-labo';
--
-- 2) 세트리스트 행이 그날 몇 번째 공연인지 — setlists.show_number(1부터). 비어 있으면
--    그날 모든 회차에 부른 곡(day_number가 비면 모든 날에 부른 곡인 것과 같은 규칙).
--    예) DAY 1 낮 공연의 3번 곡 → day_number = 1, show_number = 1, track_number = 3
--
-- 참전 기록의 체크 키는 첫 회차가 예전과 같은 "공연id:날짜", 둘째 회차부터 "공연id:날짜:2"…
-- 라서 이미 체크한 기록은 그대로 첫 회차로 남는다.

alter table public.setlists
  add column if not exists show_number smallint
  check (show_number is null or show_number >= 1);

comment on column public.setlists.show_number is
  '같은 날 몇 번째 공연인지(1부터). 비면 그날 모든 회차 — 회차 이름은 lives.metadata.shows';
