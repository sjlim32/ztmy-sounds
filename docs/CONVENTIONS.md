# 컨벤션

## 프로젝트 구조

```text
src/
  app/                 # 라우트 (App Router)
    guide/             # /guide, /guide/[songId]
    serwist/           # 서비스워커를 서빙하는 라우트 핸들러
  components/guide/    # UI 컴포넌트
  context/             # React Context (플레이어 상태 등)
  data/
    event.ts           # 공연/아티스트 정보
    songs/              # 곡 하나 = 파일 하나, index.ts가 취합
  lib/guide/            # 프레임워크 비의존 도메인 로직 (타입, 파서 등)
  content/              # MDX 프로즈 콘텐츠
```

## 곡 데이터

- 곡 하나당 파일 하나 (`src/data/songs/<song-id>.ts`), `Song` 객체를 default export.
- `src/data/songs/index.ts`가 모든 곡을 모아 `songs` 배열과 `getSong(id)`를 제공.
- 새 곡 추가 시: 파일 하나 만들고 `index.ts`에 import + 배열 항목 추가.

## 가사 타이밍

- `LyricLine.time`은 `"mm:ss"` 또는 `"mm:ss.s"` 문자열(`Timestamp` 타입)입니다. 초 단위
  숫자가 아닙니다.
- 유튜브 재생 화면에 뜨는 시각을 그대로 옮겨 적으면 됩니다. 반 박자 정밀도가 필요하면
  소수점을 추가합니다 (예: `"1:05.5"`).

## 가사 필드

- `original` / `pronunciation` / `translation` — 특정 언어 종속 이름(jp/ko/tr 등) 대신
  일반화된 필드명을 씁니다.
- `pronunciation` / `background`는 문자열 또는 `{ text, tag: "chant" | "clap" }[]`로
  구간별 응원 타입(색상)을 지정할 수 있습니다.
- 가사 텍스트 안에 `[wave]` `[clap]` `[mic]` 토큰을 그대로 적으면 해당 위치에 아이콘이
  렌더링됩니다.

## Tailwind 반응형 클래스

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

## Git / 커밋

- Conventional Commits 접두사를 사용합니다 (`feat:`, `chore:`, `docs:` 등).
- 관심사 단위로 잘게 나눠서 커밋합니다 (파일/기능 하나당 커밋 하나를 지향).
