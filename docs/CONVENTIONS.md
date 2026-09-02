# 컨벤션

## 프로젝트 구조

```text
src/
  app/
    (pages)/             # 실제 페이지 라우트 그룹 (레이아웃에 헤더/푸터 포함)
      guide/              # /guide, /guide/[songId]
      info/               # /info
    (pwa)/                # 서비스워커 전용 라우트 그룹 (레이아웃 없음)
      serwist/            # 서비스워커를 서빙하는 라우트 핸들러
      sw.ts               # 서비스워커 엔트리
  components/
    guide/
      detail/             # 곡 상세(영상·컨트롤·가사) 컴포넌트
      list/               # 곡 목록(SongList) 컴포넌트
      SongPanel.tsx       # 목록/상세 토글 컨테이너
    home/                 # 홈 화면 전용 컴포넌트 (Header, Footer, NextVisit 등)
    mobile/               # 모바일 전용 전역 컴포넌트 (MobileHeader 등)
    icons/                # 커스텀 SVG 아이콘 (외부 아이콘 라이브러리 미사용)
  context/                # React Context (플레이어 상태 등)
  data/
    artist.ts             # 아티스트 정보
    event.ts              # 공연 정보
    songs/                 # 곡 하나 = 파일 하나, index.ts가 취합
  lib/
    guide/                 # 프레임워크 비의존 도메인 로직 (타입, 파서 등)
    seo.ts                 # 사이트 전역 메타데이터 상수 (SITE_NAME 등)
  content/                 # MDX 프로즈 콘텐츠
```

## 곡 데이터

- 곡 하나당 파일 하나 (`src/data/songs/<번호>_<song-id>.ts`), `Song` 객체를 default export.
  파일명 앞의 두 자리 번호는 목록에 표시되는 순서(셋리스트 순서)를 나타내며, `Song.id`
  값 자체에는 포함하지 않습니다 (예: 파일 `01_byoushin-wo-kamu.ts` → `id: "byoushin-wo-kamu"`).
- `src/data/songs/index.ts`가 모든 곡을 모아 `songList` 배열과 `getSong(id)`를 제공.
- 새 곡 추가 시: 다음 번호로 파일 하나 만들고 `index.ts`에 import + `songList` 배열
  항목 추가.

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
