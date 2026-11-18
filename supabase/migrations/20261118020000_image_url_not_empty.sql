-- 이미지 주소 칸에 빈 문자열("")을 넣지 않는다 — 없으면 NULL. 빈 문자열은 코드의
-- `??` 대체(포스터 → 아이콘 → 기본 이미지)를 건너뛰어, 공유 미리보기·구조화 데이터에
-- 이미지가 빠지는 원인이었다(lives.five-spice-powder 포스터).
-- 다시 실행해도 안전하다.

update public.lives set poster_image_url = null where poster_image_url = '';
update public.lives set icon_image_url = null where icon_image_url = '';
update public.tours set poster_image_url = null where poster_image_url = '';

alter table public.lives drop constraint if exists lives_poster_image_url_not_empty;
alter table public.lives
  add constraint lives_poster_image_url_not_empty check (poster_image_url <> '');

alter table public.lives drop constraint if exists lives_icon_image_url_not_empty;
alter table public.lives
  add constraint lives_icon_image_url_not_empty check (icon_image_url <> '');

alter table public.tours drop constraint if exists tours_poster_image_url_not_empty;
alter table public.tours
  add constraint tours_poster_image_url_not_empty check (poster_image_url <> '');
