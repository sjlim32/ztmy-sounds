# 컨벤션

## 프로젝트 구조

기능(feature) 단위로 나뉘어 있습니다 — 페이지·컴포넌트·데이터·도메인 로직을
전부 `src/features/<기능>/` 아래에 모으고, `src/app/`은 라우팅(페이지 조립)만
담당합니다. 여러 기능에서 공유하는 것만 `src/components/`, `src/lib/`에 둡니다.

```text
src/
  app/
    (pages)/               # 실제 페이지 라우트 그룹 (레이아웃에 헤더/푸터 포함)
      guide/                # /guide, /guide/[songId]
      slam/                 # /slam, /slam/[songId]
      info/                 # /info
      zutopia/              # /zutopia, /zutopia/[category], /zutopia/[category]/[slug],
                             # /zutopia/albums, /zutopia/songs
      credits/              # /credits
    (pwa)/                  # 서비스워커 전용 라우트 그룹 (레이아웃 없음)
      serwist/              # 서비스워커를 서빙하는 라우트 핸들러
      sw.ts                 # 서비스워커 엔트리
  features/                 # 기능 단위 모듈. 각 폴더는 보통 components/lib(/data) 구성
    guide/                  # 곡 가이드(영상+가사+응원법). *-context.tsx로 플레이어/모드 상태 보유
      data/
        songs/              # 정식 공개곡 — 곡 하나당 파일 하나, index.ts가 취합
        not-yet/            # 아직 가이드 미공개곡 데이터
        origin/             # 원본(수정 전) 가사/정보 백업
    home/                   # 홈 화면 (Header, Countdown, MoonPhase 등)
    info/                   # /info 페이지 콘텐츠 (info.mdx + 렌더 컴포넌트)
    notice/                 # 공지사항 (MDX 콘텐츠 + 데이터 + 노출/해제 로직)
      content/              # 공지 MDX 프로즈
    zutopia/                 # 즛토피아 허브: 카테고리→항목 2단 구조(registry.ts) +
                             # 곡/앨범 DB(song-db/) + 지난 공연 DB(lives/) — 전부
                             # Supabase 기반(아래 "곡 데이터" 참고)
      guide-link.ts          # 응원 가이드(/guide/[songId]) 존재 여부 조회 —
                             # song-db와 lives가 공유
      lives/                # 지난 공연 데이터(data.ts, Supabase 기반) + 공용
                             # 컴포넌트(SongLink.tsx, DefaultLiveContent.tsx).
                             # 공연별 수동 콘텐츠가 필요하면 lives/<슬러그>/
                             # content.mdx를 만들어 [slug]/page.tsx의
                             # CONTENT_BY_KEY에 등록한다(선택 사항).
      song-db/              # 곡/앨범 DB 조회·정렬·표시 로직 (Supabase 소스)
  components/               # 여러 기능이 공유하는 전역 컴포넌트
    mobile/                 # 모바일 전용 전역 컴포넌트
    icons/                  # 커스텀 SVG 아이콘 (외부 아이콘 라이브러리 미사용)
  data/                     # 사이트 전역 데이터 (특정 기능에 속하지 않음)
    artist.ts               # 아티스트 정보
    event.ts                # 공연 정보
    social-links.ts         # 소셜 링크
  lib/                      # 여러 기능이 공유하는 프레임워크 비의존 로직
    supabase/                # Supabase 클라이언트 (빌드 타임 전용 — 아래 "곡 데이터" 참고)
    seo.ts                   # 사이트 전역 메타데이터 상수 (SITE_NAME 등)
  fonts/                    # 로컬 폰트 파일 (LINE Seed KR, 851MkPOP)
```

## Import

- 파일을 import할 때는 상대 경로(`../`, `./`)를 최대한 배제하고 `@/*`
  alias(`tsconfig.json`의 `@/* -> src/*`)를 씁니다 — 예: `../labels` 대신
  `@/features/zutopia/song-db/labels`. 같은 폴더 안의 형제 파일끼리도
  (`./SongDbDrawer` 같은) 예외 없이 적용합니다. 파일을 옮겨도 다른 파일의
  import 경로가 안 깨지고, 어디서 가져오는지 절대 경로로 한눈에 보입니다.

## 컴포넌트 구조

- 컴포넌트 파일은 위에서부터 다음 순서로 배치합니다.
  1. 타입/상수/유틸 함수
  2. 최상위로 export되는 메인 컴포넌트
  3. 그 메인 컴포넌트 안에서만 쓰이거나 작은 단위로 export되는 하위 서브
     컴포넌트

  `function`/`const` 선언은 호이스팅되어 실제 렌더 시점엔 이미 초기화가
  끝나 있으므로 순서를 바꿔도 동작에는 영향이 없습니다.

- 주석은 WHY(비직관적인 이유·제약·트레이드오프)만 남기고 최대한 간결하게
  씁니다 — 배경 설명을 줄이고 핵심만 남깁니다.

## 곡 데이터

`guide` 기능(가이드 가사/응원법)과 `zutopia` 기능(곡/앨범 DB)은 서로 다른
데이터 소스를 씁니다 — 섞어서 참조하지 마세요.

### guide: 정적 파일 (가이드 콘텐츠)

- 곡 하나당 파일 하나 (`src/features/guide/data/songs/<번호>_<song-id>.ts`),
  `Song` 객체를 default export. 파일명 앞의 두 자리 번호는 목록에 표시되는
  순서(셋리스트 순서)를 나타내며, `Song.id` 값 자체에는 포함하지 않습니다
  (예: 파일 `01_byoushinwo-kamu.ts` → `id: "byoushinwo-kamu"`).
- `src/features/guide/data/songs/index.ts`가 모든 곡을 모아 `songList` 배열과
  `getSong(id)`를 제공.
- 새 곡 추가 시: 다음 번호로 파일 하나 만들고 `index.ts`에 import + `songList`
  배열 항목 추가.
- `data/not-yet/`은 아직 가이드가 준비되지 않은 곡, `data/origin/`은 수정 전
  원본 가사/정보 백업 — 둘 다 `songList`에는 포함되지 않습니다.

### zutopia: Supabase DB (곡/앨범/공연 데이터베이스)

- `/zutopia/songs`, `/zutopia/albums`에서 보여주는 곡·앨범 목록과 `/zutopia/lives`의
  지난 공연·세트리스트 목록은 정적 파일이 아니라 Supabase(`songs`/`albums`/
  `lives`/`setlists` 테이블)에서 빌드 타임에 가져옵니다
  (`song-db/data.ts`, `lives/data.ts` → `createBuildTimeSupabaseClient()`).
- 이 클라이언트는 서버 컴포넌트 최상위(`page.tsx`)에서만 호출해야 합니다 —
  `output: "export"`(정적 export) 빌드라 런타임 서버가 없고, 클라이언트
  컴포넌트로 전달할 수 없습니다. 자세한 제약은
  `docs/RULES.md`의 관련 항목을 참고하세요.

## 가사 타이밍

- `LyricLine.time`은 `"mm:ss"` 또는 `"mm:ss.s"` 문자열(`Timestamp` 타입)입니다. 초 단위
  숫자가 아닙니다.
- 유튜브 재생 화면에 뜨는 시각을 그대로 옮겨 적으면 됩니다. 반 박자 정밀도가 필요하면
  소수점을 추가합니다 (예: `"1:05.5"`).

## 가사 필드

- `original` / `pronunciation` / `translation` — 특정 언어 종속 이름(jp/ko/tr 등) 대신
  일반화된 필드명을 씁니다.
- `pronunciation`은 문자열 또는 `{ text, tag }[]`(`LyricSegment[]`)로 구간별 응원
  타입(색상)을 지정할 수 있습니다. `cheer`는 그 줄 전체에 대한 응원 문구로, 문자열 또는
  단일 `{ text, tag }`를 받습니다.
- `tag`(`CallTag`)는 `"swing" | "clap" | "call"` 중 하나입니다.
- 가사 텍스트(`original`/`pronunciation`) 안에 `[swing]` `[clap]` `[call]` 토큰을 그대로
  적으면 해당 위치에 아이콘이 렌더링됩니다 (`src/lib/guide/icon-tokens.ts`).

## Tailwind

- 커스텀 브레이크포인트: `tablet`(50rem/800px) / `pc`(67.5rem/1280px) / `wide`(90rem/1440px).
  전부 min-width 기준이며 `src/app/globals.css`의 `@theme`에서 정의합니다. 뷰포트
  **높이**가 낮은 경우를 위한 `short`(max-height: 680px) 커스텀 variant도 있습니다.
- 사이트 전용 색상은 `ztmy-dark` / `ztmy-purple` / `ztmy-magenta` / `ztmy-pink` 토큰을
  씁니다 (`globals.css`에 정의). 하드코딩된 hex(`bg-[#8d3cd4]` 등)를 새로 추가하지
  마세요 — 이미 있는 값이라면 토큰이 없는지 먼저 확인합니다.
- `tablet:` / `pc:` / `wide:` 같은 반응형 variant는 베이스 클래스와 한 문자열에 섞지 않고,
  `clsx()`의 별도 인자(별도 줄)로 분리합니다. 조건부 분기가 없어도 반응형 클래스가
  섞이는 순간 `clsx()`를 도입합니다.

  ```tsx
  // Bad
  className="flex items-center gap-2 tablet:gap-4"

  // Good
  className={clsx(
    "flex items-center gap-2",
    "tablet:gap-4",
  )}
  ```

- `pnpm format` (Prettier + `prettier-plugin-tailwindcss`)이 클래스 순서를 자동
  정렬합니다. 커밋 전에 한 번 돌리는 걸 권장합니다.

## 정적 에셋

- 컴포넌트가 참조하는 정적 에셋은 `public/assets/<feature>/...` 경로 컨벤션을
  따릅니다 (예: `public/assets/notice/festival/*.webp`). `/assets` 접두사를
  빠뜨리면 404가 납니다.
- 배경 이미지는 `public/backgrounds/`, PWA/매니페스트 아이콘은 `public/icons/`,
  Open Graph 이미지는 `public/og/`, 폰트는 `public/fonts/`에 둡니다.

## Git / 커밋

- Conventional Commits 접두사를 사용합니다 (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `style:` 등). 곡 가사/응원법 데이터만 바꾸는 커밋은 `song:` 접두사를
  씁니다.
- 관심사 단위로 잘게 나눠서 커밋합니다 (파일/기능 하나당 커밋 하나를 지향).
