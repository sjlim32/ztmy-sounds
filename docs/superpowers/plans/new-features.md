# ZUTOMAYO Sounds - 퀴즈 및 도감 시스템 아키텍처 설계서

## 1. 시스템 개요

본 문서는 `ztmy-sounds.fans` 프로젝트의 신규 기능(퀴즈 및 도감) 확장을 위한 프론트엔드 및 백엔드 아키텍처 설계 내역을 정리합니다.
빠른 로딩 속도와 SEO 최적화를 위한 **정적 배포(Static Export) 방식을 유지**하면서, 백엔드 로직(채점, 기기 제한) 및 대용량 이미지 트래픽 비용을 최적화하는 **하이브리드 아키텍처**를 채택했습니다.

---

## 2. 핵심 인프라 구성 (하이브리드 구조)

데이터의 성격(텍스트/관계형 데이터 vs 대용량 미디어)에 따라 인프라를 완벽히 이원화하여 **비용(사실상 0원)과 성능을 극대화**합니다.

| 분류                   | 사용 스택                  | 주요 역할                                                 |
| ---------------------- | -------------------------- | --------------------------------------------------------- |
| **프론트엔드 (Main)**  | Next.js + Cloudflare Pages | 유저 대상 서비스 렌더링, 정적 페이지 서빙                 |
| **프론트엔드 (Admin)** | Next.js + Cloudflare Pages | 관리자 전용 대시보드 (별도 리포지토리로 분리)             |
| **DB & API 백엔드**    | Supabase (PostgreSQL)      | 퀴즈 텍스트, 정답, 도감 텍스트, 사용자 응시 기록 저장     |
| **이미지 스토리지**    | Cloudflare R2              | 도감 및 퀴즈용 고화질 이미지 저장 (Egress 비용 100% 무료) |

---

## 3. 퀴즈 기능 설계

정적 페이지에 정답이 노출되는 것을 방지하고, 악의적인 반복 응시를 막기 위해 Supabase API를 거쳐 처리합니다.

- **모드 분리:**
  - **연습 모드:** 기기 제한 없음. 문제 제출 시 프론트엔드에서 즉각적인 정답 및 해설 노출.
  - **실제 테스트:** 기기 당 1회 제한. 문제를 모두 풀고 한 번에 제출, 최종적으로 점수만 반환하고 정답은 비공개.
- **기기 1회 제한 로직 (이중 검증):**
  1. 클라이언트(브라우저) 단위 식별: 로컬 스토리지/쿠키에 고유 UUID 발급.
  2. 서버(Supabase) 단위 식별: UUID 및 유저 접속 IP를 확인하여 중복 응시 차단 및 기록 저장.
  3. fingerprintJS(라이브러리?) 활용하여 기기 고유값 저장.
- **보안:**
  - 클라이언트가 접근할 수 있는 Supabase View(정답 제외)와 채점용 내부 Function 분리.

---

## 4. 도감 기능 설계

도감은 다수의 고화질 이미지와 복잡한 필터링(태그, 카테고리)이 필요하므로 아래와 같이 연동합니다.

- **데이터 구조화 (Single Source of Truth):**
  - Supabase DB에는 도감의 메타 데이터(이름, 설명, 속성 등)와 함께 **Cloudflare R2에 업로드된 이미지의 URL 주소 텍스트만 저장**합니다.
- **이미지 서빙 최적화:**
  - 이미지는 Supabase가 아닌 Cloudflare R2 및 글로벌 CDN을 통해 유저에게 직접 전송되어 트래픽 비용을 원천 차단합니다.

---

## 5. 어드민 페이지 및 배포 전략 (Webhook 기반 SSG)

관리자 기능의 무거운 라이브러리(차트, 파일 업로드 SDK)가 메인 서비스의 속도를 저하시키지 않도록 구조를 분리하고, 정적 배포의 한계를 웹훅으로 극복합니다.

### 5.1 관리자 환경 분리 (Admin Repository)

- **메인 프로젝트 (**`ztmy-sounds.fans`**):** 유저에게 노출되는 가벼운 정적 사이트 (SEO, 속도 최우선).
- **어드민 프로젝트 (**`admin.ztmy-sounds.fans`**):** 데이터베이스(Supabase) 및 스토리지(R2)에 직접 접근하여 퀴즈 및 도감 데이터를 CRUD하는 관리자 전용 대시보드.

### 5.2 데이터 갱신 및 웹훅(Webhook) 배포 파이프라인

도감과 퀴즈 데이터는 매초 변하는 실시간 데이터가 아니므로, **빌드 타임 데이터 페칭(SSG)** 방식을 사용하여 페이지를 완벽한 정적 HTML로 구워냅니다.

1. **데이터 업데이트:** 관리자가 Admin 페이지에서 도감 이미지를 교체하거나 퀴즈를 신규 등록합니다.
2. **트리거 (Webhook):** 저장이 완료되면, Admin 프론트엔드가 Cloudflare Pages의 **'Deploy Webhook URL'**로 POST 신호를 발송합니다.
3. **자동 재빌드:** 신호를 받은 메인 프로젝트(Cloudflare)가 백그라운드에서 즉시 새 빌드를 시작합니다.
4. **정적 생성:** 빌드 과정에서 Next.js 서버 컴포넌트가 Supabase의 최신 데이터를 한 번 긁어와(Fetch) 모든 페이지를 정적 HTML로 구워냅니다 (Bake).
5. **라이브 반영:** 빌드 완료(1~2분 소요) 후 유저들은 추가적인 DB 조회 지연 없이 초고속으로 갱신된 콘텐츠를 소비합니다. 검색엔진 봇(SEO) 역시 완성된 HTML을 완벽하게 수집합니다.

---

## 6. 즛토피아 콘서트 아카이브 설계

`main`에 이미 있는 즛토피아 아카이브 페이지에 "역대 공연" 섹션을 추가한다. 세트리스트 곡을
수록 앨범/발매일로 필터링하고, 곡별로 몇 번 불렸는지·어떤 공연에서 불렸는지 보여준다.

### 6.1 계산 위치: "백엔드 vs 프론트"가 아니라 "원본 데이터가 코드냐 DB냐"

이 사이트는 `output: "export"` 완전 정적이라, 집계/필터링을 어디서 하든 최종적으로는
**빌드 타임에 한 번 계산되어 정적으로 구워진다** — 런타임 서버가 없어서 "백엔드가 매 요청마다
계산"하는 경로 자체가 없다. 그래서 실제 결정 포인트는 계산 위치가 아니라 **원본 데이터를
코드(git)로 관리하느냐, Supabase로 관리하느냐**다. 공연은 앞으로도 계속 열리는 이벤트라
Supabase로 관리(관리자 페이지/Table Editor로 입력 → 웹훅으로 재빌드, 5.2절과 동일 패턴)하는
쪽을 택했다. 집계·조인은 빌드 타임에 끝내고, 브라우저는 이미 계산된 배열을 `.filter()`로
걸러 보여주기만 한다.

### 6.2 데이터 모델

곡 하나가 여러 앨범에 중복 수록될 수 있어 `songs`-`albums`는 다대다로 둔다.

```sql
create extension if not exists pgcrypto;  -- gen_random_uuid() 사용을 위해 필요

create table albums (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  title_ko         text,
  album_type       text check (album_type in ('full', 'mini', 'ep')),
  album_number     int,
  release_date     date not null,
  cover_image_url  text,             -- R2 링크
  book_image_urls  text[],           -- 부클릿 등 여러 장 이미지, R2 링크 배열
  created_at       timestamptz not null default now()
);

create table songs (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  title_ko         text,
  cover_image_url  text,             -- R2 링크
  created_at       timestamptz not null default now()
);

create table song_albums (          -- songs ↔ albums 다대다 연결 테이블
  song_id  uuid not null references songs(id) on delete cascade,
  album_id uuid not null references albums(id) on delete cascade,
  primary key (song_id, album_id)
);

create table concerts (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  title_ko          text,
  type              text check (type in ('festival', 'concert')),
  concert_date      date not null,
  poster_image_url  text,
  created_at        timestamptz not null default now()
);

create table setlists (
  concert_id   uuid not null references concerts(id) on delete cascade,
  song_id      uuid not null references songs(id) on delete cascade,
  track_number int not null,
  primary key (concert_id, song_id)
);
```

모든 테이블에 RLS를 켜고 `anon`에게 `SELECT`만 허용하는 공개 읽기 정책을 건다 (쓰기는
Admin 프로젝트가 서비스 롤 키로 수행하므로 별도 정책 불필요).

```sql
alter table albums enable row level security;
alter table songs enable row level security;
alter table song_albums enable row level security;
alter table concerts enable row level security;
alter table setlists enable row level security;

create policy "public read" on albums for select using (true);
create policy "public read" on songs for select using (true);
create policy "public read" on song_albums for select using (true);
create policy "public read" on concerts for select using (true);
create policy "public read" on setlists for select using (true);

grant select on albums, songs, song_albums, concerts, setlists to anon;
```

**미확정:** `setlists`의 PK를 `(concert_id, song_id)`로 뒀는데, 이는 "한 공연에서 같은 곡이
두 번(예: 앙코르 반복) 불릴 수 없다"는 전제다. 가능하다면 별도 `id` PK로 바꿔야 한다.

**미확정:** `song_albums`엔 앨범 내 트랙 순서 컬럼이 없다. 지금은 곡 제목순 등으로 대체
표시하며, 실제 트랙 순서가 필요해지면 `track_number` 컬럼 추가를 검토한다.

### 6.3 집계 뷰 (fan-out 버그 주의)

`song_albums`와 `setlists`를 한 쿼리에서 동시에 JOIN하면 카티전 곱이 생겨 `COUNT`가
부풀어 오른다 (곡이 앨범 2개 + 공연 3번이면 조인 결과가 6행이 되어버림). 두 집계를
서브쿼리로 분리해서 조인 전에 각각 끝내야 한다.

```sql
create view song_statistics as
select
  s.id as song_id,
  s.title as song_title,
  s.title_ko as song_title_ko,
  s.cover_image_url as song_cover_image_url,
  coalesce(stats.play_count, 0) as play_count,
  coalesce(stats.played_concerts, '[]'::json) as played_concerts,
  coalesce(albums.album_list, '[]'::json) as albums
from songs s
left join (
  select sl.song_id,
         count(*) as play_count,
         json_agg(
           jsonb_build_object(
             'title', c.title,
             'title_ko', c.title_ko,
             'concert_date', c.concert_date,
             'poster_image_url', c.poster_image_url
           ) order by c.concert_date
         ) as played_concerts
  from setlists sl
  join concerts c on c.id = sl.concert_id
  group by sl.song_id
) stats on stats.song_id = s.id
left join (
  select sa.song_id,
         json_agg(
           jsonb_build_object(
             'title', a.title,
             'title_ko', a.title_ko,
             'album_type', a.album_type,
             'album_number', a.album_number,
             'release_date', a.release_date,
             'cover_image_url', a.cover_image_url,
             'book_image_urls', a.book_image_urls
           )
         ) as album_list
  from song_albums sa
  join albums a on a.id = sa.album_id
  group by sa.song_id
) albums on albums.song_id = s.id;

grant select on song_statistics to anon;
```

`play_count`는 `COUNT(*)`라 한 공연에서 같은 곡이 두 번 불렸다면 그것도 2회로 센다 —
"몇 번 불렸는지"의 정의를 그렇게 잡는다는 전제이며, 6.2절의 PK 미확정 사항과 연결된다.

이 뷰는 콘서트 통계 페이지(6.6절) 전용이다 — 노래 DB 페이지(6.5절)는 `play_count`/
`played_concerts`가 필요 없어서 이 뷰를 쓰지 않고 `songs`/`albums`/`song_albums`를
직접 조회한다.

### 6.4 데이터 입력 방식

퀴즈(`quiz_questions` 단일 테이블)와 달리 이건 공연 하나 추가할 때마다 `setlists`에
10~20행씩, 각 행마다 `song_id`를 정확히 골라 넣어야 해서 반복 작업량과 실수 가능성이 크다.
다만 Supabase Table Editor는 FK 컬럼에 대해 관련 행을 검색해서 고르는 드롭다운을 지원하므로
생각보다 덜 고통스럽다. **당분간 Table Editor로 시작**하고, 입력 빈도/고통이 실제로 느껴지면
그때 퀴즈용 관리자 페이지(5.1절)에 콘서트/세트리스트 CRUD 섹션을 추가하는 식으로 확장한다.
스키마 변경도 마이그레이션 파일(`supabase/migrations/`) 없이 Table/SQL Editor에서 직접
실행하고, 이 문서를 최신 스키마의 기준(source of truth)으로 유지한다.

### 6.5 노래 DB 페이지 (곡/앨범 목록)

즛토피아 허브 페이지(`/zutopia`)의 "역대 공연" 카드 위에 "노래 DB" 카드/버튼을 추가하고,
`/zutopia/songs`에서 곡 목록과 앨범 목록을 탭으로 전환해 보여준다. 6.6절의 통계 페이지와
달리 `play_count`/`played_concerts`가 필요 없으므로 `song_statistics` 뷰 대신
`songs`/`albums`/`song_albums`를 직접 조회한다.

**데이터 페칭:** `output: "export"`라 런타임 API 라우트가 없다 — "API"는 빌드 타임에 한 번
실행되는 함수를 의미한다(5.2절과 동일 패턴). `@supabase/supabase-js`를 빌드 타임 전용으로
호출하는 클라이언트(`src/lib/supabase/build-time-client.ts`)를 두고, 서버 컴포넌트
(`page.tsx`)에서 빌드 시 딱 한 번 호출해 정적 HTML로 굽는다. 브라우저로는 이 코드가
전달되지 않는다.

**쿼리:** PostgREST 임베딩으로 다대다 관계를 한 번에 가져온다.

- 곡 목록: `songs` 조회 + `song_albums(albums(*))` 임베딩
- 앨범 목록: `albums` 조회 + `song_albums(songs(*))` 임베딩

앨범 안 트랙 순서는 `song_albums`에 순서 컬럼이 없어(6.2절 미확정 사항) 곡 제목순으로
정렬한다. `book_image_urls`는 이번 페이지에선 쓰지 않는다(부클릿 뷰어는 별도 기능).

**파일 구조:**

```text
src/lib/supabase/build-time-client.ts       # 빌드타임 전용 supabase-js 클라이언트
src/features/zutopia/song-db/
  types.ts          # Song, Album, SongWithAlbums, AlbumWithSongs
  data.ts           # getSongsWithAlbums(), getAlbumsWithSongs()
  SongDbTabs.tsx     # "곡" / "앨범" 탭 전환 (client component, 데이터는 props로만 받음)
  SongListView.tsx   # 곡 카드 그리드
  AlbumListView.tsx  # 앨범 카드 그리드 (펼치면 수록곡)
src/app/(pages)/zutopia/songs/page.tsx      # 신규 라우트, 서버 컴포넌트
```

`src/app/(pages)/zutopia/page.tsx`의 `ZUTOPIA_CATEGORIES.map(...)` 위에 "노래 DB" 링크
카드를 하나 추가한다. 기존 카테고리 배열(MDX 아카이브 전용 구조)엔 넣지 않고 별도 링크로
둔다 — 데이터 성격이 다르고, 나중에 추가될 통계 카드도 같은 방식으로 이어붙인다.

**배포 시 주의:** Cloudflare Pages 빌드 환경에도 `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_PUB_KEY`가 설정돼 있어야 빌드 타임 페칭이 동작한다.

### 6.6 콘서트 통계 페이지 (예정)

"역대 공연" 카드 아래에 추가할 예정인 통계 페이지. `song_statistics` 뷰를 사용해 곡별
플레이 횟수·공연 목록을 보여준다는 것 외엔 아직 설계 전이다 — 별도로 다시 브레인스토밍한다.
