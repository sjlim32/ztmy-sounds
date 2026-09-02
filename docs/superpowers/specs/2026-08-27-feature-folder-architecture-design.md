# 도메인(feature) 폴더 아키텍처 재편

## 배경

`src/` 최상위가 기술 계층 폴더(`data/`, `lib/`, `content/`, `context/`, `components/`)로 나뉘어 있는데, 같은 도메인의 파일이 여러 계층에 흩어져 있어 기능 단위로 코드를 파악하기 어렵다.

- guide 도메인: `components/guide/**`, `data/songs/**`, `lib/guide/**`, `context/player-context.tsx` — 4곳
- notice 도메인: `data/notices/**`(메타데이터), `content/notices/**`(MDX 본문), `lib/notice/**`(타입/로직), `components/guide/notice/**`(화면) — 4곳

조사 과정에서 실제 오배치 사례도 발견했다:
- `components/home/Footer.tsx`는 `home/` 아래 있지만 `(pages)/layout.tsx`에서 모든 페이지 공용으로 렌더링됨 — 실제로는 전역 컴포넌트.
- `lib/guide/countdown.ts`, `lib/guide/event-countdown.ts`는 이름은 `guide`지만 실제 사용처는 `components/home/Countdown.tsx`, `components/home/NextVisit.tsx`뿐 — guide 어디에서도 참조하지 않음. 실제로는 home 전용 로직.

## 목표

- 도메인(guide, notice, home, info)별로 관련 파일(컴포넌트/데이터/로직)을 한 폴더 아래로 모은다.
- 여러 도메인이 공유하는 진짜 공용 코드(cn 유틸, seo, 아이콘, 사이트 전역 설정, 전역 레이아웃 chrome)는 최상위 공용 폴더에 남긴다.
- 이동 과정에서 발견된 오배치(Footer, countdown 계열)를 함께 바로잡는다.
- 동작/스타일/런타임 변경 없음 — 파일 위치와 import 경로만 바뀐다.

## 비목표

- `src/mdx-components.tsx`는 Next.js가 `src/` 루트에서만 인식하는 프레임워크 규칙 파일이므로 이동하지 않는다.
- `content/notices/warn-festival.mdx`는 현재 아무 곳에서도 참조되지 않지만, 사용자 요청에 따라 삭제하지 않고 그대로 유지(위치만 이동)한다.
- 아이콘은 실제 사용 범위(단일 도메인 전용인지)를 따지지 않고 전부 공용으로 취급한다 — 아이콘마다 판단 비용을 들이지 않기 위한 의도적 단순화.

## 목표 구조

```
src/
  app/                          # Next.js 라우팅 전용 — 변경 없음

  features/
    guide/
      components/
        AutoScrollStatusIcon.tsx
        AutoScrollToggle.tsx
        CallIcon.tsx
        GuidePlayerArea.tsx
        LyricLine.tsx
        LyricsView.tsx
        PlayerControls.tsx
        SongList.tsx
        SongPanel.tsx
        YouTubePlayer.tsx
      data/
        songs/
          01_byoushin-wo-kamu.ts ... 14_cream.ts
          index.ts
      lib/
        auto-scroll.ts
        icon-tokens.ts
        lyric-sync.ts
        timestamp.ts
        types.ts
      player-context.tsx
      notice/                    # guide 하위 도메인 (지금도 components/guide/notice로 결합돼 있음)
        components/
          NoticeAccordionItem.tsx
          NoticeList.tsx
          NoticePanel.tsx
        data/
          01_fan-page-disclaimer.ts
          02_fight-the-shamoji.ts
          index.ts
        content/
          fan-page-disclaimer.mdx
          fight-the-shamoji.mdx
          warn-festival.mdx       # 미사용이지만 유지
        lib/
          dismissal.ts
          types.ts

    home/
      components/
        Countdown.tsx
        Header.tsx
        MainNavLink.tsx
        NextVisit.tsx
      lib/
        countdown.ts              # lib/guide/에서 재배치 (실사용처는 home뿐)
        event-countdown.ts        # 〃

    info/
      info.mdx

  components/                   # 여러 feature가 공유하는 공용 UI
    icons/*                      # 변경 없음
    mobile/
      MobileHeader.tsx            # 변경 없음
      mobile-header.constants.ts  # 변경 없음
    GuideDimOverlay.tsx           # 변경 없음 (루트 레이아웃 전역 chrome)
    Footer.tsx                    # home/에서 재배치 (전 페이지 공용 렌더링)

  lib/                           # 여러 feature가 공유하는 공용 유틸
    utils.ts                      # 변경 없음
    seo.ts                        # 변경 없음

  data/                          # 어느 feature에도 속하지 않는 사이트 전역 설정
    artist.ts                     # 변경 없음
    event.ts                      # 변경 없음

  mdx-components.tsx             # 변경 없음 — Next.js 프레임워크 규칙 파일
```

## 파일 이동 매핑

| 기존 경로 | 새 경로 |
|---|---|
| `components/guide/detail/AutoScrollStatusIcon.tsx` | `features/guide/components/AutoScrollStatusIcon.tsx` |
| `components/guide/detail/AutoScrollToggle.tsx` | `features/guide/components/AutoScrollToggle.tsx` |
| `components/guide/detail/CallIcon.tsx` | `features/guide/components/CallIcon.tsx` |
| `components/guide/detail/GuidePlayerArea.tsx` | `features/guide/components/GuidePlayerArea.tsx` |
| `components/guide/detail/LyricLine.tsx` | `features/guide/components/LyricLine.tsx` |
| `components/guide/detail/LyricsView.tsx` | `features/guide/components/LyricsView.tsx` |
| `components/guide/detail/PlayerControls.tsx` | `features/guide/components/PlayerControls.tsx` |
| `components/guide/detail/YouTubePlayer.tsx` | `features/guide/components/YouTubePlayer.tsx` |
| `components/guide/list/SongList.tsx` | `features/guide/components/SongList.tsx` |
| `components/guide/SongPanel.tsx` | `features/guide/components/SongPanel.tsx` |
| `data/songs/*.ts` (14개), `data/songs/index.ts` | `features/guide/data/songs/*.ts`, `features/guide/data/songs/index.ts` |
| `lib/guide/types.ts` | `features/guide/lib/types.ts` |
| `lib/guide/timestamp.ts` | `features/guide/lib/timestamp.ts` |
| `lib/guide/lyric-sync.ts` | `features/guide/lib/lyric-sync.ts` |
| `lib/guide/icon-tokens.ts` | `features/guide/lib/icon-tokens.ts` |
| `lib/guide/auto-scroll.ts` | `features/guide/lib/auto-scroll.ts` |
| `context/player-context.tsx` | `features/guide/player-context.tsx` |
| `components/guide/notice/NoticeAccordionItem.tsx` | `features/guide/notice/components/NoticeAccordionItem.tsx` |
| `components/guide/notice/NoticeList.tsx` | `features/guide/notice/components/NoticeList.tsx` |
| `components/guide/notice/NoticePanel.tsx` | `features/guide/notice/components/NoticePanel.tsx` |
| `data/notices/01_fan-page-disclaimer.ts` | `features/guide/notice/data/01_fan-page-disclaimer.ts` |
| `data/notices/02_fight-the-shamoji.ts` | `features/guide/notice/data/02_fight-the-shamoji.ts` |
| `data/notices/index.ts` | `features/guide/notice/data/index.ts` |
| `content/notices/fan-page-disclaimer.mdx` | `features/guide/notice/content/fan-page-disclaimer.mdx` |
| `content/notices/fight-the-shamoji.mdx` | `features/guide/notice/content/fight-the-shamoji.mdx` |
| `content/notices/warn-festival.mdx` | `features/guide/notice/content/warn-festival.mdx` |
| `lib/notice/types.ts` | `features/guide/notice/lib/types.ts` |
| `lib/notice/dismissal.ts` | `features/guide/notice/lib/dismissal.ts` |
| `components/home/Header.tsx` | `features/home/components/Header.tsx` |
| `components/home/NextVisit.tsx` | `features/home/components/NextVisit.tsx` |
| `components/home/Countdown.tsx` | `features/home/components/Countdown.tsx` |
| `components/home/MainNavLink.tsx` | `features/home/components/MainNavLink.tsx` |
| `lib/guide/countdown.ts` | `features/home/lib/countdown.ts` |
| `lib/guide/event-countdown.ts` | `features/home/lib/event-countdown.ts` |
| `content/info.mdx` | `features/info/info.mdx` |
| `components/home/Footer.tsx` | `components/Footer.tsx` |

이동 없음: `components/icons/**`, `components/mobile/**`, `components/GuideDimOverlay.tsx`, `lib/utils.ts`, `lib/seo.ts`, `data/artist.ts`, `data/event.ts`, `mdx-components.tsx`, `app/**` 전체.

## import 경로 변경 규칙

| 기존 alias | 새 alias |
|---|---|
| `@/data/songs` | `@/features/guide/data/songs` |
| `@/data/notices` | `@/features/guide/notice/data` |
| `@/lib/guide/{types,timestamp,lyric-sync,icon-tokens,auto-scroll}` | `@/features/guide/lib/{동일 파일명}` |
| `@/lib/guide/{countdown,event-countdown}` | `@/features/home/lib/{동일 파일명}` |
| `@/lib/notice/{types,dismissal}` | `@/features/guide/notice/lib/{동일 파일명}` |
| `@/context/player-context` | `@/features/guide/player-context` |
| `@/content/notices/*.mdx` | `@/features/guide/notice/content/*.mdx` |
| `@/content/info.mdx` | `@/features/info/info.mdx` |
| `@/components/guide/**` | `@/features/guide/components/**` 또는 `@/features/guide/notice/components/**` |
| `@/components/home/Footer` | `@/components/Footer` |
| `@/components/home/{Header,NextVisit,Countdown,MainNavLink}` | `@/features/home/components/{동일 파일명}` |

변경 없음: `@/lib/utils`, `@/lib/seo`, `@/data/artist`, `@/data/event`, `@/components/icons/**`, `@/components/mobile/**`, `@/components/GuideDimOverlay`.

## 검증 계획

1. `git mv`로 파일 이동 (히스토리 보존)
2. 각 이동 파일 내부의 상대/절대 import 경로 수정
3. 위 표에 따라 소비 측(consumer) import 전부 갱신
4. `pnpm exec tsc --noEmit` — 끊어진 경로를 전수 검출
5. `pnpm run lint`, `pnpm run format:check`
6. `pnpm run build`
7. 기존 dev 서버(3003)에서 홈/가이드 목록/가이드 상세/정보 페이지 스크린샷 + 콘솔 에러 확인 (이전 라운드에서 쓴 방식 재사용)

## 리스크

- 대량의 import 경로 변경이라 手수정 시 누락 가능 — tsc가 안전망 역할.
- `git mv` 없이 삭제 후 재생성하면 히스토리가 끊기므로 반드시 `git mv` 사용.
