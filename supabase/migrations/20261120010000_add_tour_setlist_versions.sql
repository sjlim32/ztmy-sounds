-- 투어 세트리스트 판(版) — 투어 중간에 곡 순서가 바뀌거나 곡이 추가·삭제·교체되면
-- 새 판을 만들어 그 시기의 세트리스트 전체를 담는다. 1단계(이 파일): 테이블·칸 추가와
-- 기존 투어 공통 행을 투어마다 "1판"으로 묶기만 한다 — 코드는 아직 새 칸을 읽지 않아
-- 화면·통계는 그대로다(2단계에서 판·omitted·fixed를 반영).
--
-- 모델
-- - tour_setlist_versions: 투어의 판. starts_on부터 다음 판 starts_on 전날까지의
--   공연일에 적용된다. fixed = 선택곡 없는 고정 세트리스트(그 판의 공연일은 공연일
--   행이 없어도 세트리스트를 안다). label = "후반부" 같은 이름(없으면 기간으로 표시).
-- - setlists 투어 공통 행(tour_id)은 반드시 판(version_id)에 속한다. 판마다 그 시기의
--   세트리스트 전체를 담고(바뀌지 않은 곡도 판마다 다시), 새 판은
--   copy_tour_setlist_version으로 앞 판을 복사한 뒤 바뀐 줄만 고친다.
-- - setlists 공연일 행(live_id)은 지금처럼 그날만 다른 곡(선택곡·번호 변경)이고,
--   omitted = true면 판의 그 곡을 그날 세트리스트에서 뺀다(그날만 빠진 곡).
-- - lives.setlist_version_id: 날짜가 아닌 판을 쓰는 공연일만 직접 지정(보통 비움).
--
-- 다시 실행해도 안전하다(if not exists / drop ... if exists / 이미 묶인 행은 건너뜀).
-- 20261118030000(유일 제약 NULLS NOT DISTINCT) 뒤에 적용한다.

-- ─── 판 테이블 ──────────────────────────────────────────────────────────

create table if not exists public.tour_setlist_versions (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  starts_on date not null,
  label text check (label is null or btrim(label) <> ''),
  fixed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 한 투어에 같은 날 시작하는 판은 하나(이 유일 인덱스가 tour_id 외래키 인덱스도 겸한다)
  constraint tour_setlist_versions_tour_starts_unique unique (tour_id, starts_on),
  -- setlists·lives가 (판, 투어)를 함께 참조해 다른 투어의 판을 가리키지 못하게
  constraint tour_setlist_versions_id_tour_unique unique (id, tour_id)
);

comment on table public.tour_setlist_versions is
  '투어 세트리스트 판 — starts_on부터 다음 판 전날까지의 공연일에 적용. 투어 공통 setlists 행이 판(version_id)에 속한다.';
comment on column public.tour_setlist_versions.fixed is
  '선택곡 없는 고정 세트리스트 — 이 판의 공연일은 공연일 행이 없어도 세트리스트를 아는 날로 친다.';

-- 사이트(빌드)는 anon 키로 읽는다 — 새 테이블 자동 권한(default privileges)에 기대지
-- 않고 읽기만 직접 준다. 쓰기는 RLS 정책이 없어 막힌다.
grant select on public.tour_setlist_versions to anon, authenticated;

alter table public.tour_setlist_versions enable row level security;

drop policy if exists "public read" on public.tour_setlist_versions;
create policy "public read" on public.tour_setlist_versions
  for select to anon, authenticated using (true);

-- ─── setlists: 판·그날 빠진 곡 ─────────────────────────────────────────

alter table public.setlists
  add column if not exists version_id uuid,
  add column if not exists omitted boolean not null default false;

comment on column public.setlists.version_id is
  '투어 공통 행의 판(tour_setlist_versions) — 투어 공통 행은 반드시 판에 속한다. 공연일 행은 비움.';
comment on column public.setlists.omitted is
  '공연일 행에서만 — true면 판의 이 곡을 그날 세트리스트에서 뺀다(그날만 빠진 곡).';

alter table public.setlists
  drop constraint if exists setlists_version_fkey;
alter table public.setlists
  add constraint setlists_version_fkey
  foreign key (version_id, tour_id)
  references public.tour_setlist_versions (id, tour_id)
  on delete cascade;

create index if not exists setlists_version_id_idx
  on public.setlists (version_id)
  where version_id is not null;

-- 판은 투어 공통 행에만, omitted는 공연일 행에만
alter table public.setlists
  drop constraint if exists setlists_version_tour_only;
alter table public.setlists
  add constraint setlists_version_tour_only
  check (version_id is null or tour_id is not null);

alter table public.setlists
  drop constraint if exists setlists_omitted_live_only;
alter table public.setlists
  add constraint setlists_omitted_live_only
  check (not omitted or live_id is not null);

-- ─── 기존 투어 공통 행을 투어마다 1판으로 ───────────────────────────────

-- 1판 시작일 = 투어 시작일과 그 투어 첫 공연일 중 이른 날(모든 공연일이 1판에 들게).
insert into public.tour_setlist_versions (tour_id, starts_on)
select t.id,
       least(
         t.start_date,
         coalesce(
           (select min(l.start_date) from public.lives l
             where l.tour_id = t.id or (l.tour_id is null and l.slug = t.slug)),
           t.start_date
         )
       )
from public.tours t
where exists (select 1 from public.setlists s where s.tour_id = t.id)
  and not exists (
    select 1 from public.tour_setlist_versions v where v.tour_id = t.id
  );

-- 판이 하나뿐인 투어의 판 없는 공통 행을 그 판에 묶는다(이미 묶인 행은 그대로).
-- 내용이 바뀌는 게 아니라서 그동안 updated_at 트리거를 끈다 — 켜 두면 투어·행의
-- updated_at이 올라 사이트맵 lastmod가 바뀐다(판 테이블의 트리거도 아래에서 만든다).
alter table public.setlists disable trigger touch_setlist_parent;
alter table public.setlists disable trigger set_updated_at;
update public.setlists s
set version_id = v.id
from public.tour_setlist_versions v
where s.tour_id = v.tour_id
  and s.version_id is null
  and v.starts_on = (
    select min(v2.starts_on) from public.tour_setlist_versions v2
    where v2.tour_id = v.tour_id
  );
alter table public.setlists enable trigger touch_setlist_parent;
alter table public.setlists enable trigger set_updated_at;

-- 이제 투어 공통 행은 반드시 판에 속한다.
alter table public.setlists
  drop constraint if exists setlists_tour_row_has_version;
alter table public.setlists
  add constraint setlists_tour_row_has_version
  check (tour_id is null or version_id is not null);

-- 같은 투어·같은 번호라도 판이 다르면 함께 둘 수 있게 유일 제약에 version_id를 넣는다.
alter table public.setlists drop constraint if exists setlists_track_unique;
alter table public.setlists
  add constraint setlists_track_unique
  unique nulls not distinct
  (tour_id, version_id, live_id, track_number, day_number, show_number);

-- ─── 판 테이블 트리거(1판을 만든 뒤에 — 옮기기만으로 투어 updated_at이 오르지 않게) ──

drop trigger if exists set_updated_at on public.tour_setlist_versions;
create trigger set_updated_at
  before update on public.tour_setlist_versions
  for each row when (old.* is distinct from new.*)
  execute function public.set_updated_at();

-- 판이 바뀌면(추가·수정·삭제) 그 투어의 updated_at도 올린다 — 사이트맵 lastmod.
-- 트랜잭션당 한 번(20261118010000의 다른 touch 트리거와 같은 방식).
create or replace function public.touch_version_parent_tour()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old is not distinct from new then
    return null;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    update public.tours set updated_at = now()
      where id = old.tour_id and updated_at is distinct from now();
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.tours set updated_at = now()
      where id = new.tour_id and updated_at is distinct from now();
  end if;
  return null;
end;
$$;

drop trigger if exists touch_version_parent_tour on public.tour_setlist_versions;
create trigger touch_version_parent_tour
  after insert or update or delete on public.tour_setlist_versions
  for each row execute function public.touch_version_parent_tour();

-- ─── lives: 판 직접 지정(예외) ─────────────────────────────────────────

alter table public.lives
  add column if not exists setlist_version_id uuid;

comment on column public.lives.setlist_version_id is
  '이 공연일에 쓸 투어 세트리스트 판 — 날짜로 정해지지 않는 예외만 지정(보통 비움).';

alter table public.lives
  drop constraint if exists lives_setlist_version_fkey;
alter table public.lives
  add constraint lives_setlist_version_fkey
  foreign key (setlist_version_id, tour_id)
  references public.tour_setlist_versions (id, tour_id)
  on delete set null (setlist_version_id);

create index if not exists lives_setlist_version_id_idx
  on public.lives (setlist_version_id)
  where setlist_version_id is not null;

-- ─── 판 복사 ───────────────────────────────────────────────────────────

-- 앞 판을 통째로 복사해 새 판을 만든다(바뀐 줄만 고치면 되게). 복사한 행의 메모는
-- 그대로지만 "Live debut"는 빼고 — 첫 공개는 그 곡이 처음 들어간 판에만 둔다.
-- 대시보드 SQL 편집기(관리자)에서 쓴다: select public.copy_tour_setlist_version(
--   '<앞 판 id>', '2025-05-01', '후반부');
create or replace function public.copy_tour_setlist_version(
  source_version_id uuid,
  new_starts_on date,
  new_label text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source public.tour_setlist_versions%rowtype;
  new_id uuid;
begin
  select * into source from public.tour_setlist_versions
    where id = source_version_id;
  if not found then
    raise exception '판을 찾을 수 없습니다: %', source_version_id;
  end if;

  insert into public.tour_setlist_versions (tour_id, starts_on, label, fixed)
  values (source.tour_id, new_starts_on, new_label, source.fixed)
  returning id into new_id;

  insert into public.setlists (
    tour_id, version_id, song_id, track_number, is_encore, day_number,
    show_number, note
  )
  select s.tour_id, new_id, s.song_id, s.track_number, s.is_encore,
         s.day_number, s.show_number,
         case
           when s.note ->> 'info' = 'Live debut'
             then nullif(s.note - 'info', '{}'::jsonb)
           else s.note
         end
  from public.setlists s
  where s.version_id = source_version_id;

  return new_id;
end;
$$;

-- 데이터를 쓰는 관리용 함수라 사이트(anon·authenticated)에선 부르지 못하게.
revoke execute on function public.copy_tour_setlist_version(uuid, date, text)
  from public, anon, authenticated;
