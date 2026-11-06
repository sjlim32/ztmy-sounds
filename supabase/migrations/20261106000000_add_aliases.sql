-- 곡·앨범·투어·공연에 별명(aliases) 추가 — 즛토피아 통합 검색에서 제목처럼 찾힌다.
-- 한 행에 별명 여러 개를 넣을 수 있게 text[]. 비어 있으면 '{}'.
-- 예) update public.songs set aliases = '{"니와 투 니라"}' where slug = '...';
--     → 검색창에 "니와"·"투"·"니라"·"니라 니와" 무엇을 쳐도 그 곡이 나온다
--       (검색은 빌드 때 만든 인덱스로 브라우저에서 하므로, 별명을 고친 뒤 다시 빌드·배포해야 반영된다).

alter table public.songs  add column if not exists aliases text[] not null default '{}';
alter table public.albums add column if not exists aliases text[] not null default '{}';
alter table public.tours  add column if not exists aliases text[] not null default '{}';
alter table public.lives  add column if not exists aliases text[] not null default '{}';

comment on column public.songs.aliases  is '별명 — 통합 검색용(부분 글자로도 찾힘)';
comment on column public.albums.aliases is '별명 — 통합 검색용(부분 글자로도 찾힘)';
comment on column public.tours.aliases  is '별명 — 통합 검색용(부분 글자로도 찾힘)';
comment on column public.lives.aliases  is '별명 — 통합 검색용(부분 글자로도 찾힘)';
