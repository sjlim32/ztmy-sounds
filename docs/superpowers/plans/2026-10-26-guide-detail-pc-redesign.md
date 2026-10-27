# 가이드 상세 PC 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가이드 상세(`/guide/[songId]`, `/slam/[songId]`)의 태블릿 이상 화면을 처음 온 사람이 쓰기 쉽게 바꾼다 — 상단 곡 이동 바 + 곡 목록 드로어, 작아진 영상 아래 응원 안내·곡 정보 자리, 가사 단락 머리글, 줄 배경 대신 배지·형광펜.

**Architecture:** 기존 2단(GuideMainScrollArea | SongPanel) 구조와 단일 YouTube iframe은 그대로 둔다. 새 컴포넌트(툴바·드로어·범례·곡 정보)는 `tablet:` 이상에서만 보이고, 모바일용 기존 버튼은 `tablet:hidden`. 단락은 `LyricLine.section` 데이터 필드로 표현하고 머리글은 해당 줄의 `<li>` 안에 그린다.

**Tech Stack:** Next.js 16.3 (App Router, static export), React 19, Tailwind v4, TypeScript. 테스트 러너 없음 — 검증은 `tsc`, `eslint`, `prettier`, `pnpm build`, 일회성 Node 검사 스크립트.

**Spec:** `docs/superpowers/specs/2026-10-26-guide-detail-pc-redesign-design.md`

## Global Constraints

- 모바일(<800px, `tablet:` 미만) 레이아웃·순서·영상 크기는 바꾸지 않는다.
- YouTube iframe은 `(pages)/guide/layout.tsx`(slam도 동일)에 한 번만 마운트 — 언마운트/재생성 금지.
- `LyricLine`은 `memo` 유지, 새 prop은 참조가 안정적인 값만.
- 슬램 모드는 `visibleTags = ["slam"]` — 범례·배지·형광펜 모두 `visibleTags` 기준.
- 851MkPOP(`font-mkpop`)는 `jp: "…"` 문자열 외 텍스트에 쓰지 않는다.
- 범례 문구: 스윙 "샤모지를 흔들어요", 클랩 "샤모지로 박수", 콜 "다 같이 외쳐요", 슬램 "다 같이 슬램해요".
- 커밋은 사용자 승인 후에만(프로젝트 메모리). README 로그·`docs/*.md`는 같은 작업에서 갱신.

## Review Focus

1. 단락 머리글이 별도 `<li>`로 들어가면 `LyricsView`의 `list.children[activeLineIndex]` 자동 스크롤이 엉뚱한 줄로 간다 → 머리글은 반드시 그 줄 `<li>` 안에 그린다 (Task 2에서 확인).
2. 드로어를 `position: fixed`로 그려도 조상에 `backdrop-filter`/`transform`이 있으면 그 박스 안에 갇힌다 → `createPortal(document.body)` (Task 4).
3. 슬램 모드에서 스윙/클랩/콜 범례·배지가 보이면 안 됨 (Task 2, 3에서 `/slam/<곡>` 확인).
4. 모바일에서 새 툴바·범례·곡 정보가 보이거나 기존 ◀▶ 버튼이 사라지면 안 됨 (Task 3 확인).
5. `**…**` 마커가 줄바꿈된 세그먼트 배열(`LyricSegment[]`) 안에 있을 때도 형광펜이 칠해져야 함 (Task 2).

---

### Task 1: 단락 데이터 필드 + 주석 마이그레이션

**Files:**

- Modify: `src/features/guide/lib/types.ts` (`LyricLine`)
- Modify: `src/features/guide/data/{songs,not-yet,origin}/*.ts` (스크립트로 일괄)
- Scratch: 마이그레이션 스크립트는 세션 scratchpad에 두고 저장소에 넣지 않는다(일회성).

**Interfaces:**

- Produces: `LyricLine.section?: string` — 이 줄부터 새 단락. 값 예: `"1절"`, `"2절"`, `"3절"`, `"RAP"`.

- [ ] **Step 1:** `LyricLine`에 `section?: string` 추가(JSDoc: "이 줄부터 시작하는 단락 이름 — 가사 목록에 머리글로 표시").
- [ ] **Step 2:** 마이그레이션 전 주석 수 집계: `grep -rhoE '//=+ *[^=]+ *=+//' src/features/guide/data | wc -l` → N 기록.
- [ ] **Step 3:** 스크립트 작성·실행. 규칙: `//====… <이름> …====//` 주석(줄 끝 `}, //…` 형태 포함, 뒤에 붙은 메모 무시)을 지우고, 그 다음에 나오는 `{` 객체의 `time:` 줄 바로 위에 `section: "<이름>",` 삽입. `R A P` → `RAP`처럼 공백 제거.
- [ ] **Step 4:** 검증 — `grep -rho 'section: "' src/features/guide/data | wc -l` == N, 남은 `//====` 주석 0개, `npx tsc --noEmit -p .` 통과, `npx prettier --check src/features/guide/data` 통과.

### Task 2: 가사 줄 표시 — 배지·형광펜·단락 머리글

**Files:**

- Modify: `src/features/guide/components/LyricLine.tsx`
- Modify: `src/features/guide/components/CallIcon.tsx` (라벨 export)

**Interfaces:**

- Consumes: `LyricLine.section` (Task 1)
- Produces: `export const CALL_TAG_LABEL: Record<CallTag, string>` (기존 `ICON_LABEL` 이름 변경·export), `export const CALL_TAG_COLOR: Record<CallTag, string>` (기존 `TAG_BORDER_COLOR`를 `src/features/guide/lib/call-tag-style.ts`로 옮겨 export) — Task 3 범례가 사용.

- [ ] **Step 1:** `<li>`에서 태그 배경/테두리(`--tag-border`, `--tag-bg`, `getTagBackgroundColor`) 제거. 활성 줄은 태그 유무와 무관하게 `border-ztmy-purple bg-ztmy-dark/80`.
- [ ] **Step 2:** `CheerText`를 배지로: 둥근 pill, 배경 = 태그색 15% 알파, 테두리 = 태그색 50%, 글자 = 태그색, 내용 = `CallIcon` + `CALL_TAG_LABEL[tag]` + `·` + 설명. 태그 없는(문자열) cheer는 기존 회색 텍스트 유지.
- [ ] **Step 3:** `OriginalText` 앞 인라인 아이콘 제거(배지가 대신함).
- [ ] **Step 4:** 강조 `<strong>`에 형광펜: `backgroundColor` = 태그색 40% 알파, 글자 흰색, `rounded px-0.5`, `box-decoration-clone`.
- [ ] **Step 5:** `line.section`이 있으면 `<li>` 안 맨 위(버튼 바깥)에 머리글: 작은 대문자 라벨(`text-ztmy-magenta text-xs tracking-[0.2em] font-bold`) + 그 위 구분선/여백(`mt-6 border-t border-white/10 pt-3`, 첫 줄이면 `mt-0`). 머리글 클릭은 seek 안 함.
- [ ] **Step 6:** `interlude` 줄 위아래 여백 확대(`py-6` → `my-4 py-6`).
- [ ] **Step 7:** 검증 — tsc/eslint/prettier 통과. `pnpm dev`가 떠 있으면 `/guide/byoushinwo-kamu`에서 '간간'에 초록 형광펜, 배지 "스윙 · '간간' 부분만…", 재생 시 자동 스크롤이 재생 줄을 따라가는지(Review Focus 1), `/slam/<슬램곡>`에서 슬램 배지만 보이는지(Review Focus 3). 브라우저 확인은 사용자 요청 시에만 — 기본은 코드 리뷰로 `list.children` 인덱스가 줄 수와 같음을 확인.

### Task 3: 플레이어 영역 — 상단 툴바, 작은 영상, 범례, 곡 정보 자리

**Files:**

- Create: `src/features/guide/components/GuideDetailToolbar.tsx` — `[☰ 곡 목록] [◀ 이전 곡] [다음 곡 ▶]` (tablet 이상만)
- Create: `src/features/guide/components/CallLegend.tsx` — `visibleTags`별 아이콘 + 라벨 + 설명
- Create: `src/features/guide/components/SongInfoPanel.tsx` — 제목 jp(`font-mkpop`)/kr/en + 비어 있는 설명 자리(`data-role="song-description-slot"`, 내용 없으면 렌더 안 함 — 지금은 항상 빈 자리 주석만)
- Modify: `src/features/guide/components/GuidePlayerArea.tsx`, `PlayerControls.tsx`, `YouTubePlayer.tsx`

**Interfaces:**

- Consumes: `CALL_TAG_LABEL`, `CALL_TAG_COLOR` (Task 2), `useGuideMode()`, `getNeighborIds` (PlayerControls에서 export)
- Produces: `GuideDetailToolbar({ onOpenList }: { onOpenList: () => void })`, `CallLegend()`, `SongInfoPanel({ song }: { song: Song })`

- [ ] **Step 1:** `PlayerPrevButton`/`PlayerNextButton`/`PlayerSongListLink`에 `tablet:hidden` (모바일 그대로). `getNeighborIds` export.
- [ ] **Step 2:** 툴바: 텍스트 라벨 있는 버튼 3개, 이전/다음은 `Link`(없으면 disabled 버튼), 이전/다음 곡 제목을 `title` 속성으로. `hidden tablet:flex`.
- [ ] **Step 3:** 영상 폭 축소: tablet 이상 `w-[min(90%,calc((100dvh-4rem)*16/9))]` → `w-[min(100%,calc((88vh-16rem)*16/9))]` (아래 범례·정보 자리 ~16rem 확보). 영상 래퍼 `tablet:w-full`.
- [ ] **Step 4:** `GuidePlayerArea` tablet 이상 배치: 세로 스택(툴바 → 영상 → 범례 → 곡 정보), 폭은 영상과 동일한 `max-w`. 모바일 `flex-row` 순서·`order-*`는 유지(새 요소 전부 `hidden tablet:*`).
- [ ] **Step 5:** `SwingGuideGif` 위치가 새 스택에서 깨지지 않는지 확인(기존 order 클래스 조정만).
- [ ] **Step 6:** 검증 — tsc/eslint/prettier, `pnpm build` 성공. 모바일 클래스 diff에 `tablet:` 없는 변경이 없는지 확인(Review Focus 4).

### Task 4: 곡 목록 드로어

**Files:**

- Create: `src/features/guide/components/SongListDrawer.tsx`
- Modify: `GuidePlayerArea.tsx` (open 상태 보유, 툴바와 연결)

**Interfaces:**

- Consumes: `useGuideMode()` (`songs`, `basePath`, `visibleTags`), `getCachedSongCallTags`, `CallIcon`
- Produces: `SongListDrawer({ open, onClose, currentSongId }: { open: boolean; onClose: () => void; currentSongId: string | null })`

- [ ] **Step 1:** `createPortal(…, document.body)`로 왼쪽 고정 패널(`w-80`, 전체 높이, 어두운 반투명 + blur) + 반투명 배경막. `open`일 때 `translate-x-0`, 아니면 `-translate-x-full` + 배경막 숨김. 마운트 전(서버 렌더) `null`.
- [ ] **Step 2:** 항목: `Link href={basePath/id}` — jp 제목(`font-mkpop`), kr 제목, `visibleTags`에 해당하는 `CallIcon`. 현재 곡은 마젠타 강조 + `aria-current="page"`.
- [ ] **Step 3:** 닫힘: 배경막 클릭, Esc, 항목 클릭(라우트 이동 시). 열릴 때 현재 곡 `scrollIntoView({ block: "center" })`, 첫 포커스는 패널.
- [ ] **Step 4:** 검증 — tsc/eslint/prettier. 드로어가 `md:`/모바일에선 툴바가 없으니 열릴 경로 없음 확인.

### Task 5: 가사 패널 정리 + 문서

**Files:**

- Modify: `src/features/guide/components/SongList.tsx` (곡 선택 시 tablet 이상에서 래퍼 숨김)
- Modify: `README.md`, `docs/CONVENTIONS.md`

- [ ] **Step 1:** 곡이 선택된 상태에서 `SongList` 래퍼에 `tablet:hidden` (모바일은 기존 접힘 동작 유지). 목록 화면(`/guide`)은 그대로.
- [ ] **Step 2:** README 프로젝트 로그 `### 26.10.26` 항목 + 접힘 요약 범위 갱신, `docs/CONVENTIONS.md` guide 항목에 새 컴포넌트·`section` 필드 설명.
- [ ] **Step 3:** 최종 검증 — `npx tsc --noEmit -p .`, `pnpm lint`, `pnpm format:check`, `pnpm build`(postbuild 폰트 검사 포함) 전부 통과.
