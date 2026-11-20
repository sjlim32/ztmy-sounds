-- intense(ZUTOMAYO INTENSE) 세트리스트 판 나누기 — 홍콩 공연(2024-06-11)부터 바뀌었다.
--
--   번호 | 1판(신베이 2/27, 상하이 3/20)  | 2판(홍콩 6/11, 서울 6/15·16)
--   1–7  | 같음                           | 같음
--   8    | 선택곡                         | Blues in the Closet
--   9    | Dear. Mr「F」                  | 선택곡
--   10–13| 같음                           | 같음
--   14   | 低血ボルト                     | 残機
--   15   | 残機                           | 嘘じゃない
--   16·17| 앵콜(サターン·あいつら全員同窓会) 같음
--
-- 지금 투어 공통 행 14개는 다섯 공연의 교집합이라 Dear. Mr「F」·低血ボルト·Blues in the
-- Closet·嘘じゃない가 모두 "선택곡"으로 보였다. 1판에 고정곡 두 개를 채우고 2판을 만든다.
-- 다섯 공연 모두 그날 행이 전부 있어 각 공연일 세트리스트는 그대로다.
--
-- 주의: 판을 읽는 코드(2단계) 없이 적용하면 지금 코드는 두 판의 행을 모든 공연일에 붙인다
-- — 2단계 코드와 함께 배포할 것.
-- 다시 실행해도 안전하다(이미 있는 판·행은 건너뜀).

-- 2판(2024-06-11부터)
insert into public.tour_setlist_versions (tour_id, starts_on)
select id, date '2024-06-11' from public.tours where slug = 'intense'
on conflict (tour_id, starts_on) do nothing;

-- 1판에 빠진 고정곡: 9번 Dear. Mr「F」, 14번 低血ボルト(8번은 선택곡이라 두지 않는다)
insert into public.setlists (tour_id, version_id, song_id, track_number)
select t.id, v.id, x.song_id::uuid, x.track_number
from public.tours t
join public.tour_setlist_versions v
  on v.tour_id = t.id and v.starts_on = date '2024-02-27'
cross join (values
  ('f5775aff-960a-414a-9baa-aff1c16cc28d', 9),   -- Dear. Mr「F」
  ('33acee25-384c-4807-9c41-d11329102ae6', 14)   -- 低血ボルト
) as x (song_id, track_number)
where t.slug = 'intense'
on conflict on constraint setlists_track_unique do nothing;

-- 2판: 1판의 1–7번·10–13번·앵콜을 그대로 옮기고, 8·14·15번을 새로
insert into public.setlists (tour_id, version_id, song_id, track_number, is_encore, note)
select s.tour_id, v2.id, s.song_id, s.track_number, s.is_encore, s.note
from public.tours t
join public.tour_setlist_versions v1
  on v1.tour_id = t.id and v1.starts_on = date '2024-02-27'
join public.tour_setlist_versions v2
  on v2.tour_id = t.id and v2.starts_on = date '2024-06-11'
join public.setlists s on s.version_id = v1.id
where t.slug = 'intense'
  and (s.is_encore or s.track_number between 1 and 7 or s.track_number between 10 and 13)
on conflict on constraint setlists_track_unique do nothing;

insert into public.setlists (tour_id, version_id, song_id, track_number)
select t.id, v.id, x.song_id::uuid, x.track_number
from public.tours t
join public.tour_setlist_versions v
  on v.tour_id = t.id and v.starts_on = date '2024-06-11'
cross join (values
  ('d921edb1-efb2-470e-b92d-f6b942ddfc1b', 8),   -- Blues in the Closet
  ('3ac82784-8c76-4aea-ac02-dcb26bfa0454', 14),  -- 残機
  ('4678de1e-b698-4e24-9b61-9855cf165713', 15)   -- 嘘じゃない
) as x (song_id, track_number)
where t.slug = 'intense'
on conflict on constraint setlists_track_unique do nothing;
