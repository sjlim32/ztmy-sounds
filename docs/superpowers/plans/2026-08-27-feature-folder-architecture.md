# 도메인(feature) 폴더 아키텍처 재편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/`의 기술 계층 폴더(`data/`, `lib/`, `content/`, `context/`)에 흩어진 guide/notice/home/info 도메인 파일을 `src/features/<domain>/`로 모으고, 여러 도메인이 공유하는 코드만 최상위 공용 폴더(`components/`, `lib/`, `data/`)에 남긴다.

**Architecture:** 순수 파일 이동 + import 경로 교체 리팩토링. 런타임 동작·스타일·타입 변경 없음. 각 태스크는 "관련 파일을 새 위치로 `git mv` → 그 파일들의 옛 import 경로를 참조하는 모든 곳(자기 자신 포함)을 새 경로로 일괄 치환 → `tsc --noEmit`으로 깨진 경로 전수 검출"의 사이클로 진행한다. 이 프로젝트에는 유닛 테스트가 없으므로, 각 태스크의 "테스트"는 TypeScript 컴파일러의 모듈 해석 검사가 대신한다.

**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, pnpm. macOS(zsh) 기준 `sed -i ''` BSD 문법 사용.

**Spec:** `docs/superpowers/specs/2026-08-27-feature-folder-architecture-design.md`

## Global Constraints

- `src/mdx-components.tsx`는 이동하지 않는다 (Next.js가 `src/` 루트에서만 인식하는 프레임워크 규칙 파일).
- `content/notices/warn-festival.mdx`는 미사용이지만 삭제하지 않고 위치만 옮긴다.
- 아이콘(`components/icons/**`)은 실사용 범위와 무관하게 전부 공용으로 유지 — 이동하지 않는다.
- 모든 이동은 `git mv`로 수행해 히스토리를 보존한다.
- import 경로는 이 프로젝트의 기존 컨벤션대로 `@/`로 시작하는 절대 경로를 그대로 사용한다 (형제 파일 간에도 상대경로로 바꾸지 않는다).
- 각 태스크가 끝나면 `pnpm exec tsc --noEmit`이 에러 0건이어야 한다. 이것이 이 플랜에서의 "테스트 통과" 기준이다.
- 커밋은 태스크별로 하되, 실제 `git commit` 실행 전에는 사용자에게 커밋 메시지를 제안하고 승인받는다 (이 프로젝트의 기존 규칙).

---

## 파일 이동 매핑 (전체, spec에서 확정됨)

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
| `data/songs/*.ts`(14개) + `index.ts` | `features/guide/data/songs/*.ts` + `index.ts` |
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

---

### Task 1: guide 코어 lib 이동 (`lib/guide/{types,timestamp,lyric-sync,icon-tokens,auto-scroll}.ts`)

**Files:**
- Move: `src/lib/guide/types.ts` → `src/features/guide/lib/types.ts`
- Move: `src/lib/guide/timestamp.ts` → `src/features/guide/lib/timestamp.ts`
- Move: `src/lib/guide/lyric-sync.ts` → `src/features/guide/lib/lyric-sync.ts`
- Move: `src/lib/guide/icon-tokens.ts` → `src/features/guide/lib/icon-tokens.ts`
- Move: `src/lib/guide/auto-scroll.ts` → `src/features/guide/lib/auto-scroll.ts`
- Modify (import path rewrite only): `src/data/songs/*.ts`(15개), `src/components/guide/detail/{CallIcon,LyricLine,LyricsView,AutoScrollToggle}.tsx`, `src/components/guide/SongPanel.tsx`, 그리고 지금 옮기는 5개 파일 자기 자신(서로 참조함)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `@/features/guide/lib/types` (Song, SongTitle, LyricLine, CallTag, Timestamp, CALL_TAGS 등), `@/features/guide/lib/timestamp`(parseTimestamp), `@/features/guide/lib/lyric-sync`(getActiveLineIndex), `@/features/guide/lib/icon-tokens`(parseEmphasis, parseIconTokens), `@/features/guide/lib/auto-scroll`(useAutoScrollPreference) — 이후 모든 태스크에서 이 경로들을 사용

- [ ] **Step 1: 디렉토리 생성 및 git mv**

```bash
mkdir -p src/features/guide/lib
git mv src/lib/guide/types.ts src/features/guide/lib/types.ts
git mv src/lib/guide/timestamp.ts src/features/guide/lib/timestamp.ts
git mv src/lib/guide/lyric-sync.ts src/features/guide/lib/lyric-sync.ts
git mv src/lib/guide/icon-tokens.ts src/features/guide/lib/icon-tokens.ts
git mv src/lib/guide/auto-scroll.ts src/features/guide/lib/auto-scroll.ts
```

- [ ] **Step 2: 이 5개 파일을 참조하는 모든 곳의 import 경로 일괄 치환**

```bash
grep -rl '@/lib/guide/types' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/guide/types|@/features/guide/lib/types|g'
grep -rl '@/lib/guide/timestamp' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/guide/timestamp|@/features/guide/lib/timestamp|g'
grep -rl '@/lib/guide/lyric-sync' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/guide/lyric-sync|@/features/guide/lib/lyric-sync|g'
grep -rl '@/lib/guide/icon-tokens' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/guide/icon-tokens|@/features/guide/lib/icon-tokens|g'
grep -rl '@/lib/guide/auto-scroll' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/guide/auto-scroll|@/features/guide/lib/auto-scroll|g'
```

- [ ] **Step 3: 남은 참조가 없는지 확인 후 타입체크**

```bash
grep -rn '@/lib/guide/\(types\|timestamp\|lyric-sync\|icon-tokens\|auto-scroll\)' src && echo "누락 발견!" || echo "OK: 남은 참조 없음"
pnpm exec tsc --noEmit
```

Expected: 첫 grep은 "OK: 남은 참조 없음" 출력, `tsc --noEmit`은 출력 없이 종료(에러 0건).

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: move guide core lib to features/guide/lib`

```bash
git add -A
git commit -m "refactor: move guide core lib to features/guide/lib"
```

---

### Task 2: home 전용으로 오배치된 lib 이동 (`lib/guide/{countdown,event-countdown}.ts`)

**Files:**
- Move: `src/lib/guide/countdown.ts` → `src/features/home/lib/countdown.ts`
- Move: `src/lib/guide/event-countdown.ts` → `src/features/home/lib/event-countdown.ts`
- Modify (import path rewrite only): `src/components/home/Countdown.tsx`, `src/components/home/NextVisit.tsx`, 그리고 이 두 파일 자기 자신(`event-countdown.ts`가 `countdown.ts`의 `Remaining` 타입을 가져다 씀)

**Interfaces:**
- Consumes: 없음 (Task 1과 독립)
- Produces: `@/features/home/lib/countdown`(getRemaining, Remaining), `@/features/home/lib/event-countdown`(DONE_AFTER_HOURS, useEventCountdown) — Task 7에서 이동할 `Countdown.tsx`/`NextVisit.tsx`가 이 경로를 그대로 사용

- [ ] **Step 1: 디렉토리 생성 및 git mv**

```bash
mkdir -p src/features/home/lib
git mv src/lib/guide/countdown.ts src/features/home/lib/countdown.ts
git mv src/lib/guide/event-countdown.ts src/features/home/lib/event-countdown.ts
```

이 시점에 `src/lib/guide/`가 비므로 폴더도 함께 정리한다:

```bash
rmdir src/lib/guide
```

- [ ] **Step 2: import 경로 일괄 치환**

```bash
grep -rl '@/lib/guide/countdown' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/guide/countdown|@/features/home/lib/countdown|g'
grep -rl '@/lib/guide/event-countdown' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/guide/event-countdown|@/features/home/lib/event-countdown|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/lib/guide/' src && echo "누락 발견!" || echo "OK: lib/guide 참조 완전히 제거됨"
pnpm exec tsc --noEmit
```

Expected: "OK: lib/guide 참조 완전히 제거됨" 출력, tsc 에러 0건.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: relocate misplaced countdown lib from lib/guide to features/home/lib`

```bash
git add -A
git commit -m "refactor: relocate misplaced countdown lib from lib/guide to features/home/lib"
```

---

### Task 3: player context 이동 (`context/player-context.tsx`)

**Files:**
- Move: `src/context/player-context.tsx` → `src/features/guide/player-context.tsx`
- Modify (import path rewrite only): `src/components/guide/detail/YouTubePlayer.tsx`, `src/components/guide/SongPanel.tsx`, `src/app/(pages)/guide/layout.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `@/features/guide/player-context`(PlayerProvider, usePlayer)

- [ ] **Step 1: 디렉토리 생성 및 git mv**

```bash
mkdir -p src/features/guide
git mv src/context/player-context.tsx src/features/guide/player-context.tsx
rmdir src/context
```

- [ ] **Step 2: import 경로 일괄 치환**

```bash
grep -rl '@/context/player-context' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/context/player-context|@/features/guide/player-context|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/context/' src && echo "누락 발견!" || echo "OK: context/ 참조 완전히 제거됨"
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: move player context into features/guide`

```bash
git add -A
git commit -m "refactor: move player context into features/guide"
```

---

### Task 4: 곡 데이터 이동 (`data/songs/**`)

**Files:**
- Move: `src/data/songs/*.ts`(14개) + `src/data/songs/index.ts` → `src/features/guide/data/songs/` (동일 파일명)
- Modify (import path rewrite only): `src/app/(pages)/guide/[songId]/page.tsx`, `src/app/sitemap.ts`, `src/components/guide/detail/{PlayerControls,YouTubePlayer}.tsx`, `src/components/guide/SongPanel.tsx`, `src/components/guide/list/SongList.tsx`

**Interfaces:**
- Consumes: `@/features/guide/lib/types`의 `Song` 타입 (Task 1에서 이동 완료)
- Produces: `@/features/guide/data/songs`(songList, getSong)

- [ ] **Step 1: 디렉토리 생성 및 git mv (파일별)**

```bash
mkdir -p src/features/guide/data/songs
for f in src/data/songs/*.ts; do
  git mv "$f" "src/features/guide/data/songs/$(basename "$f")"
done
rmdir src/data/songs
```

- [ ] **Step 2: import 경로 일괄 치환**

`data/songs/index.ts` 내부의 형제 파일 relative import(`./01_byoushin-wo-kamu` 등)는 폴더째 옮겨서 그대로 유효하므로 손대지 않는다. 외부에서 참조하는 절대경로만 치환:

```bash
grep -rl '@/data/songs' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/data/songs|@/features/guide/data/songs|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/data/songs' src | grep -v '@/features/guide/data/songs' && echo "누락 발견!" || echo "OK"
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: move song data into features/guide/data/songs`

```bash
git add -A
git commit -m "refactor: move song data into features/guide/data/songs"
```

---

### Task 5: guide 컴포넌트 이동 (`components/guide/detail/**`, `components/guide/list/SongList.tsx`, `components/guide/SongPanel.tsx`)

**Files:**
- Move: `src/components/guide/detail/AutoScrollStatusIcon.tsx` → `src/features/guide/components/AutoScrollStatusIcon.tsx`
- Move: `src/components/guide/detail/AutoScrollToggle.tsx` → `src/features/guide/components/AutoScrollToggle.tsx`
- Move: `src/components/guide/detail/CallIcon.tsx` → `src/features/guide/components/CallIcon.tsx`
- Move: `src/components/guide/detail/GuidePlayerArea.tsx` → `src/features/guide/components/GuidePlayerArea.tsx`
- Move: `src/components/guide/detail/LyricLine.tsx` → `src/features/guide/components/LyricLine.tsx`
- Move: `src/components/guide/detail/LyricsView.tsx` → `src/features/guide/components/LyricsView.tsx`
- Move: `src/components/guide/detail/PlayerControls.tsx` → `src/features/guide/components/PlayerControls.tsx`
- Move: `src/components/guide/detail/YouTubePlayer.tsx` → `src/features/guide/components/YouTubePlayer.tsx`
- Move: `src/components/guide/list/SongList.tsx` → `src/features/guide/components/SongList.tsx`
- Move: `src/components/guide/SongPanel.tsx` → `src/features/guide/components/SongPanel.tsx`
- Modify (import path rewrite only): 위 10개 파일 자기 자신(서로 참조), `src/app/(pages)/guide/layout.tsx`

**Interfaces:**
- Consumes: `@/features/guide/lib/*`(Task 1), `@/features/guide/data/songs`(Task 4), `@/features/guide/player-context`(Task 3)
- Produces: `@/features/guide/components/{AutoScrollStatusIcon,AutoScrollToggle,CallIcon,GuidePlayerArea,LyricLine,LyricsView,PlayerControls,YouTubePlayer,SongList,SongPanel}`

- [ ] **Step 1: 디렉토리 생성 및 git mv**

```bash
mkdir -p src/features/guide/components
git mv src/components/guide/detail/AutoScrollStatusIcon.tsx src/features/guide/components/AutoScrollStatusIcon.tsx
git mv src/components/guide/detail/AutoScrollToggle.tsx src/features/guide/components/AutoScrollToggle.tsx
git mv src/components/guide/detail/CallIcon.tsx src/features/guide/components/CallIcon.tsx
git mv src/components/guide/detail/GuidePlayerArea.tsx src/features/guide/components/GuidePlayerArea.tsx
git mv src/components/guide/detail/LyricLine.tsx src/features/guide/components/LyricLine.tsx
git mv src/components/guide/detail/LyricsView.tsx src/features/guide/components/LyricsView.tsx
git mv src/components/guide/detail/PlayerControls.tsx src/features/guide/components/PlayerControls.tsx
git mv src/components/guide/detail/YouTubePlayer.tsx src/features/guide/components/YouTubePlayer.tsx
git mv src/components/guide/list/SongList.tsx src/features/guide/components/SongList.tsx
git mv src/components/guide/SongPanel.tsx src/features/guide/components/SongPanel.tsx
rmdir src/components/guide/detail src/components/guide/list
```

(`src/components/guide/notice/`가 아직 남아있으므로 `src/components/guide` 자체는 이 시점엔 지우지 않는다 — Task 6에서 정리)

- [ ] **Step 2: import 경로 일괄 치환**

```bash
grep -rl '@/components/guide/detail/' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/guide/detail/|@/features/guide/components/|g'
grep -rl '@/components/guide/list/SongList' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/guide/list/SongList|@/features/guide/components/SongList|g'
grep -rl '"@/components/guide/SongPanel"' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/guide/SongPanel|@/features/guide/components/SongPanel|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/components/guide/detail/\|@/components/guide/list/\|@/components/guide/SongPanel' src && echo "누락 발견!" || echo "OK"
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: move guide components into features/guide/components`

```bash
git add -A
git commit -m "refactor: move guide components into features/guide/components"
```

---

### Task 6: notice 하위 도메인 전체 이동 (`components/guide/notice/**`, `data/notices/**`, `content/notices/**`, `lib/notice/**`)

**Files:**
- Move: `src/components/guide/notice/NoticeAccordionItem.tsx` → `src/features/guide/notice/components/NoticeAccordionItem.tsx`
- Move: `src/components/guide/notice/NoticeList.tsx` → `src/features/guide/notice/components/NoticeList.tsx`
- Move: `src/components/guide/notice/NoticePanel.tsx` → `src/features/guide/notice/components/NoticePanel.tsx`
- Move: `src/data/notices/01_fan-page-disclaimer.ts` → `src/features/guide/notice/data/01_fan-page-disclaimer.ts`
- Move: `src/data/notices/02_fight-the-shamoji.ts` → `src/features/guide/notice/data/02_fight-the-shamoji.ts`
- Move: `src/data/notices/index.ts` → `src/features/guide/notice/data/index.ts`
- Move: `src/content/notices/fan-page-disclaimer.mdx` → `src/features/guide/notice/content/fan-page-disclaimer.mdx`
- Move: `src/content/notices/fight-the-shamoji.mdx` → `src/features/guide/notice/content/fight-the-shamoji.mdx`
- Move: `src/content/notices/warn-festival.mdx` → `src/features/guide/notice/content/warn-festival.mdx` (미사용, 삭제하지 않음)
- Move: `src/lib/notice/types.ts` → `src/features/guide/notice/lib/types.ts`
- Move: `src/lib/notice/dismissal.ts` → `src/features/guide/notice/lib/dismissal.ts`
- Modify (import path rewrite only): 위 이동 파일들 자기 자신, `src/app/(pages)/guide/layout.tsx`

**Interfaces:**
- Consumes: 없음 (notice는 자기 완결적 하위 도메인)
- Produces: `@/features/guide/notice/components/{NoticeAccordionItem,NoticeList,NoticePanel}`, `@/features/guide/notice/data`(noticeList), `@/features/guide/notice/lib/{types,dismissal}`

- [ ] **Step 1: 디렉토리 생성 및 git mv**

```bash
mkdir -p src/features/guide/notice/components src/features/guide/notice/data src/features/guide/notice/content src/features/guide/notice/lib

git mv src/components/guide/notice/NoticeAccordionItem.tsx src/features/guide/notice/components/NoticeAccordionItem.tsx
git mv src/components/guide/notice/NoticeList.tsx src/features/guide/notice/components/NoticeList.tsx
git mv src/components/guide/notice/NoticePanel.tsx src/features/guide/notice/components/NoticePanel.tsx

git mv src/data/notices/01_fan-page-disclaimer.ts src/features/guide/notice/data/01_fan-page-disclaimer.ts
git mv src/data/notices/02_fight-the-shamoji.ts src/features/guide/notice/data/02_fight-the-shamoji.ts
git mv src/data/notices/index.ts src/features/guide/notice/data/index.ts

git mv src/content/notices/fan-page-disclaimer.mdx src/features/guide/notice/content/fan-page-disclaimer.mdx
git mv src/content/notices/fight-the-shamoji.mdx src/features/guide/notice/content/fight-the-shamoji.mdx
git mv src/content/notices/warn-festival.mdx src/features/guide/notice/content/warn-festival.mdx

git mv src/lib/notice/types.ts src/features/guide/notice/lib/types.ts
git mv src/lib/notice/dismissal.ts src/features/guide/notice/lib/dismissal.ts

rmdir src/components/guide/notice src/components/guide
rmdir src/data/notices
rmdir src/content/notices
rmdir src/lib/notice
```

(`src/components/guide`는 Task 5에서 detail/list가 이미 비워졌고 이제 notice까지 비워지므로 이 태스크에서 완전히 제거된다)

- [ ] **Step 2: import 경로 일괄 치환**

```bash
grep -rl '@/components/guide/notice/' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/guide/notice/|@/features/guide/notice/components/|g'
grep -rl '@/data/notices' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/data/notices|@/features/guide/notice/data|g'
grep -rl '@/content/notices/' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/content/notices/|@/features/guide/notice/content/|g'
grep -rl '@/lib/notice/' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/lib/notice/|@/features/guide/notice/lib/|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/components/guide\|@/data/notices\|@/content/notices\|@/lib/notice' src && echo "누락 발견!" || echo "OK"
test -d src/components/guide && echo "components/guide 폴더가 남아있음!" || echo "OK: components/guide 제거됨"
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: move notice sub-domain into features/guide/notice`

```bash
git add -A
git commit -m "refactor: move notice sub-domain into features/guide/notice"
```

---

### Task 7: home 컴포넌트 이동 (`components/home/{Header,NextVisit,Countdown,MainNavLink}.tsx`)

**Files:**
- Move: `src/components/home/Header.tsx` → `src/features/home/components/Header.tsx`
- Move: `src/components/home/NextVisit.tsx` → `src/features/home/components/NextVisit.tsx`
- Move: `src/components/home/Countdown.tsx` → `src/features/home/components/Countdown.tsx`
- Move: `src/components/home/MainNavLink.tsx` → `src/features/home/components/MainNavLink.tsx`
- Modify (import path rewrite only): `src/app/(pages)/page.tsx`

**Interfaces:**
- Consumes: `@/features/home/lib/{countdown,event-countdown}`(Task 2에서 이미 이 경로로 존재)
- Produces: `@/features/home/components/{Header,NextVisit,Countdown,MainNavLink}`

- [ ] **Step 1: 디렉토리 생성 및 git mv**

```bash
mkdir -p src/features/home/components
git mv src/components/home/Header.tsx src/features/home/components/Header.tsx
git mv src/components/home/NextVisit.tsx src/features/home/components/NextVisit.tsx
git mv src/components/home/Countdown.tsx src/features/home/components/Countdown.tsx
git mv src/components/home/MainNavLink.tsx src/features/home/components/MainNavLink.tsx
```

(`src/components/home/Footer.tsx`가 아직 남아있으므로 `components/home` 폴더는 이 시점엔 지우지 않는다 — Task 8에서 정리)

- [ ] **Step 2: import 경로 일괄 치환**

```bash
grep -rl '@/components/home/Header' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/home/Header|@/features/home/components/Header|g'
grep -rl '@/components/home/NextVisit' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/home/NextVisit|@/features/home/components/NextVisit|g'
grep -rl '@/components/home/Countdown' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/home/Countdown|@/features/home/components/Countdown|g'
grep -rl '@/components/home/MainNavLink' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/home/MainNavLink|@/features/home/components/MainNavLink|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/components/home/\(Header\|NextVisit\|Countdown\|MainNavLink\)' src && echo "누락 발견!" || echo "OK"
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: move home components into features/home/components`

```bash
git add -A
git commit -m "refactor: move home components into features/home/components"
```

---

### Task 8: Footer를 공용 컴포넌트로 재배치 (`components/home/Footer.tsx`)

**Files:**
- Move: `src/components/home/Footer.tsx` → `src/components/Footer.tsx`
- Modify (import path rewrite only): `src/app/(pages)/layout.tsx`

**Interfaces:**
- Consumes: `@/data/artist`(변경 없음, 그대로 사용)
- Produces: `@/components/Footer` — 모든 페이지 공용 컴포넌트로 명확화

- [ ] **Step 1: git mv**

```bash
git mv src/components/home/Footer.tsx src/components/Footer.tsx
rmdir src/components/home
```

- [ ] **Step 2: import 경로 치환**

```bash
grep -rl '@/components/home/Footer' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/components/home/Footer|@/components/Footer|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/components/home' src && echo "누락 발견!" || echo "OK"
test -d src/components/home && echo "components/home 폴더가 남아있음!" || echo "OK: components/home 제거됨"
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: relocate Footer to shared components (used on every page, not home-only)`

```bash
git add -A
git commit -m "refactor: relocate Footer to shared components (used on every page, not home-only)"
```

---

### Task 9: info 콘텐츠 이동 (`content/info.mdx`)

**Files:**
- Move: `src/content/info.mdx` → `src/features/info/info.mdx`
- Modify (import path rewrite only): `src/app/(pages)/info/page.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `@/features/info/info.mdx` (default export: InfoContent 컴포넌트)

- [ ] **Step 1: git mv**

```bash
mkdir -p src/features/info
git mv src/content/info.mdx src/features/info/info.mdx
rmdir src/content
```

- [ ] **Step 2: import 경로 치환**

```bash
grep -rl '@/content/info.mdx' src --include="*.ts" --include="*.tsx" | xargs sed -i '' 's|@/content/info.mdx|@/features/info/info.mdx|g'
```

- [ ] **Step 3: 확인 및 타입체크**

```bash
grep -rn '@/content' src && echo "누락 발견!" || echo "OK"
test -d src/content && echo "content 폴더가 남아있음!" || echo "OK: content 폴더 제거됨"
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: move info page content into features/info`

```bash
git add -A
git commit -m "refactor: move info page content into features/info"
```

---

### Task 10: 전체 검증 (lint / format / build / 브라우저 확인)

**Files:** 없음 (검증 전용 태스크)

**Interfaces:**
- Consumes: Task 1~9의 모든 결과물
- Produces: 없음 (리팩토링 완료 확인)

- [ ] **Step 1: 최종 구조 확인**

```bash
find src -maxdepth 2 -type d | sort
```

Expected: `src/data`, `src/lib`에는 `artist.ts`/`event.ts`, `utils.ts`/`seo.ts`만 남아있고, `src/context`, `src/content`는 존재하지 않으며, `src/features/{guide,home,info}`가 생겨 있어야 한다.

- [ ] **Step 2: lint / format / typecheck**

```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm run format:check
```

Expected: 셋 다 에러 없이 통과. `format:check`에서 걸리면 `pnpm exec prettier --write <파일>`로 수정 후 재확인.

- [ ] **Step 3: 프로덕션 빌드**

```bash
pnpm run build
```

Expected: `✓ Compiled successfully`, 정적 페이지 27개 생성 성공(기존과 동일 라우트 목록).

- [ ] **Step 4: 브라우저에서 회귀 확인**

이미 실행 중인 dev 서버(예: `http://localhost:3003`)가 없으면 `pnpm dev`로 새로 띄운다. Playwright(`npx --package=playwright@1.62.1` 방식, 캐시된 Chromium 실행 파일 경로 사용)로 아래를 확인한다:

- `/` — Header, NextVisit, Countdown, MainNavLink(accent 색상) 정상 렌더
- `/guide` — SongList(기본 상태), NoticePanel/아코디언 정상
- 곡 하나 클릭 후 상세 화면 — GuidePlayerArea 열림, LyricsView, AutoScrollToggle 정상
- `/info` — 정상 렌더
- 각 단계에서 `console --errors` 확인(0건이어야 함, 유튜브 자체 광고 추적 CORS 경고는 무해하므로 예외)

- [ ] **Step 5: 커밋 없음 (검증 전용) — 사용자에게 최종 결과 보고**

이 태스크는 코드 변경이 없으므로 커밋하지 않는다. Task 1~9의 커밋 내역과 최종 검증 결과를 사용자에게 요약 보고한다.

---

## Self-Review 체크리스트 (계획 작성자용, 실행 전 완료)

- **Spec 커버리지:** spec의 파일 이동 매핑표 34개 항목이 Task 1~9에 전부 포함됨. spec의 "이동 없음" 목록(`icons`, `mobile`, `GuideDimOverlay`, `utils.ts`, `seo.ts`, `artist.ts`, `event.ts`, `mdx-components.tsx`)은 어느 태스크에서도 건드리지 않음. spec의 검증 계획(git mv, import 치환, tsc/lint/format/build, 브라우저 확인)은 각 태스크 + Task 10에 반영됨.
- **플레이스홀더 스캔:** "TBD"/"나중에" 류 문구 없음. 모든 step에 실행 가능한 실제 명령어가 있음.
- **타입/경로 일관성:** 각 태스크의 "Produces" 경로가 이후 태스크의 "Consumes"/Files 경로와 정확히 일치하는지 확인함 (예: Task 1의 `@/features/guide/lib/types`를 Task 4, 5가 그대로 참조; Task 2의 `@/features/home/lib/*`를 Task 7이 그대로 참조).
