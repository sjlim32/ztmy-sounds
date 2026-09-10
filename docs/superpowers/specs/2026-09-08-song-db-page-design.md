# 노래 DB 페이지 설계

## 배경

즛토피아 아카이브(`docs/superpowers/plans/new-features.md` 6절)에서 계획했던 Supabase
스키마(`songs`/`albums`/`song_albums`/`concerts`/`setlists`)가 실제로 Supabase 프로젝트에
생성됐다. 이 스펙은 그중 곡/앨범 데이터를 소비하는 첫 기능인 "노래 DB" 페이지를 다룬다.
콘서트 통계 페이지(같은 문서 6.6절)는 별도 기능으로, 이번 스펙 범위 밖이다.

이 기능은 이 프로젝트에서 **최초로 실제 동작하는 Supabase 연동**이다 — 지금까지는
`supabase` CLI만 devDependency로 있고 `@supabase/supabase-js` 클라이언트나 빌드 타임
페칭 코드가 전혀 없었다. 따라서 여기서 만드는 클라이언트/페칭 패턴은 이후 퀴즈·도감·
콘서트 통계 기능(5·6.6절)에서도 재사용될 기준선이 된다.

## 확정된 스키마

`docs/superpowers/plans/new-features.md` 6.2/6.3절에 최종 반영됨. 이 페이지가 실제로
쓰는 테이블만 요약:

```sql
create table songs (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  title_ko         text,
  cover_image_url  text,
  created_at       timestamptz not null default now()
);

create table albums (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  title_ko         text,
  album_type       text check (album_type in ('full', 'mini', 'ep')),
  album_number     int,
  release_date     date not null,
  cover_image_url  text,
  book_image_urls  text[],
  created_at       timestamptz not null default now()
);

create table song_albums (
  song_id  uuid not null references songs(id) on delete cascade,
  album_id uuid not null references albums(id) on delete cascade,
  primary key (song_id, album_id)
);
```

`anon` role에 `SELECT` 권한이 부여돼 있고 RLS 공개 읽기 정책이 걸려 있어, anon key로
빌드 타임에 바로 조회할 수 있다.

## 데이터 페칭: 빌드 타임 전용

`next.config.ts`가 `output: "export"`라 런타임 서버/API 라우트가 없다. 이 사이트에서
"API"는 실질적으로 **`next build` 실행 중 한 번만 호출되는 함수**를 의미하며, 결과는
정적 HTML로 구워진다 — 이미 `docs/.../new-features.md` 5.2절에 이 패턴이 문서화돼 있다.

- `@supabase/supabase-js`를 신규 의존성으로 추가한다 (순수 `fetch()`도 가능하지만,
  향후 퀴즈/도감/통계 페이지에서도 재사용할 공통 클라이언트를 만드는 편이 낫다는
  판단 — 사용자 승인됨).
- `src/lib/supabase/build-time-client.ts`에서 `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_PUB_KEY`(이미 `.env.local`에 존재)로 클라이언트를 생성한다.
  anon key라 클라이언트 번들에 포함돼도 무방하지만, 이 클라이언트는 서버 컴포넌트에서만
  호출되므로 실제로는 브라우저에 전달되지 않는다.
- `src/app/(pages)/zutopia/songs/page.tsx`는 async 서버 컴포넌트로, 빌드 시 데이터
  페칭 함수를 호출해 결과를 그대로 자식 컴포넌트에 props로 넘긴다. 클라이언트 쪽에서
  추가로 fetch하지 않는다.
- Cloudflare Pages 빌드 환경에도 위 두 환경변수가 설정돼 있어야 한다 (인프라 설정,
  이번 구현 범위 밖이지만 배포 전 체크리스트에 남긴다).

## 쿼리 설계

PostgREST 임베딩으로 다대다 관계를 한 번의 요청으로 가져온다 (N+1 방지).

```ts
// 곡 목록 + 소속 앨범
supabase
  .from("songs")
  .select("id, title, title_ko, cover_image_url, song_albums(albums(*))")
  .order("title");

// 앨범 목록 + 수록곡
supabase
  .from("albums")
  .select("*, song_albums(songs(*))")
  .order("release_date");
```

- 앨범 안 수록곡 순서: `song_albums`에 트랙 순서 컬럼이 없다(문서 6.2절에 미확정으로
  기록됨). 곡 제목 가나다순으로 정렬해 표시한다. 순서가 실제로 필요해지면 스키마에
  `track_number`를 추가하는 별도 작업으로 다룬다.
- `book_image_urls`는 이 페이지에서 사용하지 않는다 (부클릿 이미지 뷰어는 범위 밖의
  별도 기능).
- 두 쿼리 모두 실패 시 빌드를 그대로 실패시킨다(별도 폴백 없음) — 정적 사이트라 배포
  전에 빌드가 실패하는 편이, 깨진 데이터로 조용히 배포되는 것보다 낫다.
- 두 테이블 다 비어 있을 수 있음(아직 데이터 입력 전) — 빈 배열이면 목록 영역에 안내
  문구("아직 등록된 곡이 없습니다" 등)를 보여준다. 에러는 아니다.
- `cover_image_url`이 `null`일 수 있다 — 카드에서 이미지 자리에 무늬 없는 플레이스홀더
  박스를 보여준다 (에러 아님, 흔한 상태).

## 페이지 구성

- 콘텐츠는 "곡" / "앨범" 두 탭으로 전환한다 (사용자 확정).
  - **곡 탭:** 곡 카드 그리드. 카드에 커버 이미지, `title`/`title_ko`, 소속 앨범 칩
    (`album_type`에 따라 라벨: 정규/미니/EP).
  - **앨범 탭:** 앨범 카드 그리드. 카드에 커버 이미지, `title`/`title_ko`,
    `release_date`. 카드를 펼치면(클릭/토글) 수록곡 목록이 나온다.
- 탭 전환 자체는 클라이언트 상태(`useState`)만 있으면 되므로 별도 URL 라우팅은 두지
  않는다 (`?tab=` 같은 쿼리 파라미터도 이번 범위에선 불필요).

## 라우팅 / 허브 페이지 연동

기존 `ZUTOPIA_CATEGORIES`(`src/features/zutopia/registry.ts`)는 카테고리 하나 아래
MDX로 손으로 쓰는 아카이브 항목들을 두는 구조라, DB에서 빌드 타임에 통째로 가져오는
"노래 DB"엔 맞지 않는다. 이 배열엔 넣지 않고 별도 라우트로 둔다.

- 신규 라우트: `src/app/(pages)/zutopia/songs/page.tsx` (`/zutopia/songs`)
- `src/app/(pages)/zutopia/page.tsx`에서 `ZUTOPIA_CATEGORIES.map(...)` **위에** "노래 DB"
  링크 카드를 하나 추가한다. 기존 카테고리 카드와 동일한 스타일(`hover:border-ztmy-magenta/60`
  등)을 재사용한다.
- 나중에 추가될 콘서트 통계 카드는 같은 방식으로 카테고리 목록 **아래**에 이어붙인다
  (이번 범위 밖, 자리만 염두에 둠).

## 파일 구조

```text
src/lib/supabase/
  build-time-client.ts     # 빌드타임 전용 supabase-js 클라이언트 (재사용 가능)

src/features/zutopia/song-db/
  types.ts                 # Song, Album, SongWithAlbums, AlbumWithSongs
  data.ts                  # getSongsWithAlbums(), getAlbumsWithSongs()
  SongDbTabs.tsx            # "곡"/"앨범" 탭 전환 (client component, props로만 데이터 받음)
  SongListView.tsx          # 곡 카드 그리드
  AlbumListView.tsx         # 앨범 카드 그리드 (펼치면 수록곡)

src/app/(pages)/zutopia/songs/
  page.tsx                  # 신규 라우트, async 서버 컴포넌트
```

기존 수정 파일:

- `src/app/(pages)/zutopia/page.tsx` — "노래 DB" 링크 카드 추가
- `package.json` — `@supabase/supabase-js` 의존성 추가
- `docs/superpowers/plans/new-features.md` — 이미 이번 세션에서 갱신 완료

## 범위 밖

- 콘서트 통계 페이지(6.6절) — 별도 브레인스토밍
- `supabase/migrations/`로의 스키마 버전 관리 — 사용자가 Table/SQL Editor 직접 관리를
  선택함
- 곡/앨범 상세 페이지, 부클릿 이미지 뷰어, 트랙 순서 컬럼 추가
