# 투어 상세 한 눈에 보기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 투어 상세에서 공통 세트리스트와 공연 일정이 처음부터 펼쳐진 채 한 화면에 보이고, 날짜를 누르면 그날 세트리스트(PC 왼쪽 패널 / 모바일 시트)로, 두 공연일 비교 창까지 둔다.

**Architecture:** 데이터(getTourBySlug·TourDetail)는 그대로 두고 화면만 바꾼다. 순수 함수(해시 ↔ 공연일, 세트리스트 매칭, 비교 기본값)를 먼저 테스트와 함께 만들고, 기존 컴포넌트(Setlist·TourDateList·LiveTicket·SidePanel)에 옵션을 더해 재사용한 뒤, 새 클라이언트 컴포넌트 TourOverview가 상태(고른 날짜·판 탭·비교)를 묶는다.

**Tech Stack:** Next.js 16(정적 export), React 19, Tailwind 4(`tablet:` 800px · `pc:` 1080px), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-tour-detail-compact-layout-design.md`

## Global Constraints

- 화면 글자는 text-sm 이상(읽거나 누르는 글자), 10px 금지 — 메모리 feedback_font_size_minimum.
- 한쪽 테두리 강조선·그라데이션 버튼·알약 모양 금지(기존 티켓 위 색 띠는 그대로) — feedback_ui_style_direction.
- 2단·왼쪽 패널은 `pc:`(min-width 67.5rem) 이상에서만, 그 미만은 위아래로 쌓고 날짜는 SidePanel 시트.
- 해시 값 = 공연 날짜 `YYYY-MM-DD`, 같은 날짜 둘째부터 `-2`, `-3`(목록 순서), 취소된 공연일은 해시·선택 대상 아님.
- 단독 공연 상세(DefaultLiveContent·LiveSchedule)는 동작을 바꾸지 않는다(아코디언 유지).
- 커밋은 사용자 허락을 받은 뒤(메모리 feedback_no_autocommit). 메시지는 한국어 한 문장, 화면이 바뀌는 커밋엔 README 기록 한 줄과 docs/CONVENTIONS.md 갱신을 같은 커밋에(feedback_update_docs_immediately).
- 브라우저 검증은 사용자가 요청할 때만(feedback_no_browser_verification) — 확인은 `pnpm exec tsc --noEmit -p .`, `pnpm exec eslint src/features/zutopia/lives`, `pnpm exec vitest run`, 필요하면 `pnpm build`.
- 모든 답·커밋 설명은 한국어.

## Review Focus

1. 해시가 붙은 링크로 처음 들어옴(`#2023-04-21`) — 하이드레이션 뒤 그 날짜가 열린다(PC 왼쪽 패널, 모바일 시트). → Task 1 `dateIdFromHash` 테스트 + Task 7 마운트 시 읽기.
2. 모르는 해시·취소된 공연일 날짜의 해시(`#2099-01-01`, 취소일) — 무시하고 공통 세트리스트. → Task 1 테스트.
3. 비교할 공연일이 둘 미만(공연일 하나뿐·세트리스트 있는 날 하나) — 비교 버튼을 숨긴다. → Task 3 `defaultComparePair`가 null, Task 7에서 null이면 버튼 없음.
4. 공통 세트리스트가 없는 투어 / 공연일이 없는 투어 — 안내 문구, 깨지지 않음. → Task 7 수동 확인 항목(빌드 후 해당 투어).
5. 뒤로 가기로 시트 닫기·이전 선택으로 돌아가기 — popstate/hashchange에서 해시로 상태를 다시 맞춘다. → Task 1 함수 재사용, Task 7.

---

### Task 1: 공연일 ↔ 주소 해시

**Files:**
- Create: `src/features/zutopia/lives/date-hash.ts`
- Test: `src/features/zutopia/lives/date-hash.test.ts`

**Interfaces:**
- Produces:
  - `dateHashes(dates: readonly Pick<TourDateEntry, "id" | "startDate" | "canceled">[]): Map<string, string>` — 공연일 id → 해시 값(`#` 없이). 취소일 제외, 목록 순서대로 같은 날짜면 `-2`, `-3`.
  - `dateIdFromHash(dates: (같은 타입)[], hash: string): string | null` — `location.hash` 그대로(앞 `#` 있어도 없어도) 받아 id, 모르면 null.

- [ ] **Step 1: 실패하는 테스트 작성** — `describe("dateHashes")`:
  - `[{id:"a",startDate:"2023-04-20"},{id:"b",startDate:"2023-04-21"}]` → `Map {a→"2023-04-20", b→"2023-04-21"}`
  - 같은 날짜 셋 `x,y,z`(모두 "2024-05-04") → `"2024-05-04"`, `"2024-05-04-2"`, `"2024-05-04-3"`
  - 취소일 `{id:"c",startDate:"2023-04-27",canceled:true}`은 Map에 없음, 그 뒤 같은 날짜 공연일은 `-2`가 아니라 그 날짜 그대로
  - `startDate`가 `"2023-04-20T00:00:00+00:00"`이어도 `"2023-04-20"`
  - `describe("dateIdFromHash")`: `"#2023-04-21"`→`"b"`, `"2023-04-21"`→`"b"`, `""`·`"#"`·`"#2099-01-01"`→`null`, 취소일 날짜 해시→`null`, `"#2024-05-04-2"`→`"y"`
- [ ] **Step 2: 실패 확인** — `pnpm exec vitest run src/features/zutopia/lives/date-hash.test.ts` → FAIL(모듈 없음)
- [ ] **Step 3: 구현** — `dateIdFromHash`는 `dateHashes`를 뒤집어 찾는다(`decodeURIComponent` 후 `#` 제거).
- [ ] **Step 4: 통과 확인** — 같은 명령 PASS
- [ ] **Step 5: 커밋**(허락 후) — `git add src/features/zutopia/lives/date-hash.ts src/features/zutopia/lives/date-hash.test.ts` · `refactor: 투어 공연일을 주소 해시(공연 날짜)로 주고받는 함수 추가`

### Task 2: 세트리스트 두 개 매칭(추가·빠짐·순서 변경)

**Files:**
- Modify: `src/features/zutopia/lives/setlist-diff.ts`
- Test: `src/features/zutopia/lives/setlist-diff.test.ts`

**Interfaces:**
- Produces:
  - `export type DiffEntry = Pick<LiveSetlistEntry, "songId" | "trackNumber" | "isEncore">` (지금 파일 안 type을 export)
  - `matchSetlists<T extends DiffEntry>(a: readonly T[], b: readonly T[]): { removed: T[]; added: T[]; moved: { from: T; to: T }[] }` — a = 앞(A), b = 뒤(B). keptPairs(LCS, 곡 id) 밖의 곡 중 b에 같은 songId가 있으면 moved, a에만 있으면 removed, b에만 있으면 added. 각 배열은 자기 쪽 순서(본편 → 앙코르, 번호 순).
  - `diffSetlistVersions`는 시그니처·결과 그대로, 내부를 matchSetlists로.

- [ ] **Step 1: 실패하는 테스트 작성** — `describe("matchSetlists")`:
  - a=`[a1,b2,c3]`, b=`[a1,x2,b3,c4]` → `{removed:[], added:[x], moved:[]}`(번호만 밀린 b·c는 없음)
  - a=`[a1,gone2,c3]`, b=`[a1,c2]` → removed `[gone]`
  - a=`[a1,b2,c3]`, b=`[b1,c2,a3]` → moved `[{from:a@1,to:a@3}]`
  - 앙코르: a=`[a1, enc(e,9)]`, b=`[a1, enc(e,10)]` → 모두 빈 배열
  - 같은 세트리스트 → 모두 빈 배열
- [ ] **Step 2: 실패 확인** — `pnpm exec vitest run src/features/zutopia/lives/setlist-diff.test.ts` → FAIL(`matchSetlists` 없음)
- [ ] **Step 3: 구현** — matchSetlists 추가, diffSetlistVersions를 그 위로 옮김(compareWithNext면 here=entries를 a로: removed→"제거", moved→"순서 변경"; 아니면 other를 a로: added→"추가", moved→"순서 변경"). 반환 순서는 지금처럼 고른 판(entries)의 곡 순서.
- [ ] **Step 4: 통과 확인** — 같은 파일의 기존 diffSetlistVersions 테스트까지 PASS
- [ ] **Step 5: 커밋**(허락 후) — `refactor: 세트리스트 두 개의 추가·빠짐·순서 변경을 고르는 매칭을 판 비교에서 떼어 냄`

### Task 3: 비교할 공연일과 기본값

**Files:**
- Create: `src/features/zutopia/lives/tour-compare.ts`
- Test: `src/features/zutopia/lives/tour-compare.test.ts`

**Interfaces:**
- Produces:
  - `comparableDates<T extends Pick<TourDateEntry, "id" | "canceled" | "setlist">>(dates: readonly T[]): T[]` — 취소일·세트리스트 빈 날 제외, 순서 그대로.
  - `defaultComparePair(dates: (같은 타입)[], selectedId: string | null): [string, string] | null` — comparable이 2개 미만이면 null. selectedId가 comparable이면 `[selectedId, 바로 앞 id]`(첫째면 `[selectedId, 다음 id]`), 아니면 `[첫 id, 마지막 id]`.

- [ ] **Step 1: 실패하는 테스트 작성** — 공연일 `a,b,c`(세트리스트 있음), `x`(취소), `y`(세트리스트 빈 배열):
  - `comparableDates([a,x,b,y,c])` → ids `["a","b","c"]`
  - `defaultComparePair(all, "b")` → `["b","a"]`; `"a"` → `["a","b"]`; `null` → `["a","c"]`; `"x"` → `["a","c"]`
  - comparable 하나(`[a,x]`) → `null`
- [ ] **Step 2: 실패 확인** — `pnpm exec vitest run src/features/zutopia/lives/tour-compare.test.ts` → FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 커밋**(허락 후) — `refactor: 세트리스트 비교에 쓸 공연일과 기본 두 날을 고르는 함수 추가`

### Task 4: 티켓 compact 옵션

**Files:**
- Modify: `src/features/zutopia/lives/LiveTicket.tsx`

**Interfaces:**
- Produces: `LiveTicket`에 `compact?: boolean`(기본 false). 켜면 `tablet:` 이상에서 맨 위 종류 줄(LiveTypeBadge·VisitBadge)을 칸들과 같은 가로 줄 맨 앞에 두고(사이 세로 절취선), TicketCellView와 Variation/Official/Listen/Post 줄의 `tablet:p-6`·`tablet:py-3`을 한 단계 낮춘다(예: `tablet:px-5 tablet:py-2.5`), 값 글자는 `tablet:text-base` 유지(작게 하지 않음). 모바일은 compact여도 지금과 같다.

- [ ] **Step 1: 구현** — compact일 때만 바뀌는 클래스를 `cn(..., compact && ...)`로. 절취선·위 색 띠·라벨 서체(TICKET_LABEL_CLASS) 그대로.
- [ ] **Step 2: 확인** — `pnpm exec tsc --noEmit -p .` · `pnpm exec eslint src/features/zutopia/lives` 오류 없음. 아직 쓰는 곳이 없으니 화면 변화 없음(공연 상세 그대로).
- [ ] **Step 3: 커밋**(허락 후) — `refactor: 공연 티켓에 PC에서 낮게 그리는 compact 옵션 추가`

### Task 5: 일정 목록 "고르기" 모드와 세트리스트 카드 옵션

**Files:**
- Modify: `src/features/zutopia/lives/TourDateList.tsx` (TourDateList·TourDateRow·TourDateGroupHeader, TourSetlistVersions·TourCommonSetlist)
- Modify: `src/features/zutopia/lives/Setlist.tsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `TourDateList({ dates, select? }: { dates: TourDateEntry[]; select?: { selectedId: string | null; onSelect: (id: string) => void } })` — `select`가 없으면 지금 아코디언 그대로(LiveSchedule이 씀). 있으면 아코디언·TourDatePanel 없이 날짜 줄이 `onSelect(id)`, 꺾쇠는 오른쪽(▸: ChevronLeftIcon `rotate-180`), 고른 줄은 지금 펼친 날 강조(분홍 날짜) + `bg-white/[0.06]`, `aria-pressed`. 도시 머리는 select 모드에서 버튼 — 그 묶음의 첫 비취소 공연일로 `onSelect`(모두 취소면 버튼 아님).
  - `export function TourDatePanelBody({ date }: { date: TourDateEntry })` — 지금 TourDatePanel 안쪽(포스터·이미지·세트리스트/"세트리스트가 곧 업데이트됩니다.")을 감싸는 div 없이 떼어 낸 것. TourDatePanel은 이걸 씀(모양 그대로). Task 6·7이 씀.
  - `Setlist`에 `action?: ReactNode` — 제목 줄 오른쪽("n songs" 앞)에 둔다. collapsible 버튼 안에 넣지 않도록, action이 있으면 제목 줄을 `div`로 감싸 버튼(제목)과 action을 나란히.
  - `TourSetlistVersions({ versions, dates, action?, selectedVersionId?, onSelectVersion? })` · `TourCommonSetlist({ ..., action? })` — 투어 상세 전용이 되므로 **접기 없음**(collapsible 끔), 제목 기본값 `"투어 세트리스트"`, `action`을 Setlist로 넘김. 판 탭은 `selectedVersionId`·`onSelectVersion`(`(id: string) => void`)이 오면 그 값을 쓰고(PC에서 날짜를 골라 이 컴포넌트가 빠졌다 돌아와도 탭 유지 — 스펙), 안 오면 지금처럼 자체 state. 도장 로직 그대로.

- [ ] **Step 1: 구현** — 위 인터페이스대로. LiveSchedule(`select` 없음)은 지금 동작 그대로여야 한다.
- [ ] **Step 2: 확인** — tsc·eslint 오류 없음, `pnpm exec vitest run` 전체 PASS(selected-slots 테스트 포함). 투어 상세는 아직 TourSetlistVersions가 펼친 채로 보이는 변화만(DefaultTourContent는 Task 7에서).
- [ ] **Step 3: 커밋**(허락 후) — Task 7과 함께 커밋해도 된다(화면 변화가 Task 7에서 완성되므로).

### Task 6: 세트리스트 비교 창

**Files:**
- Create: `src/features/zutopia/lives/TourCompare.tsx`

**Interfaces:**
- Consumes: `matchSetlists`, `DiffEntry`(Task 2), `comparableDates`(Task 3), `SidePanel`(`open`, `title`, `subtitle?`, `onClose`, `children`, `size="wide"`), `formatDayShow`(shows.ts).
- Produces: `TourCompare({ open, dates, pair, onPairChange, onClose }: { open: boolean; dates: TourDateEntry[]; pair: [string, string]; onPairChange: (pair: [string, string]) => void; onClose: () => void })`

- [ ] **Step 1: 구현**
  - SidePanel `title="세트리스트 비교"`, `size="wide"`.
  - 위: A·B 고르기 두 개 — 네이티브 `<select>`(text-sm 이상, 어두운 면, 둥근 사각 — 알약 금지), 옵션 = `comparableDates(dates)`의 `"${city} ${MM.DD} ${formatDayShow(dayNumber, showLabel) ?? ""}"`. 라벨 "A"·"B".
  - 아래: 두 칼럼 그리드(모바일도 `grid-cols-2`) — 칼럼마다 머리(도시·날짜) + 곡 줄(번호 2자리, 앙코르는 `EN`, 제목 `truncate`, 메들리는 "메들리 n곡"). 매칭으로 A 칼럼의 removed 곡엔 "빠짐"(red-400 계열 텍스트 태그), B 칼럼의 added 곡엔 "추가"(emerald-400), moved는 B 칼럼 곡에 "순서 변경 · A n번 → B m번"(text-white/65). 태그는 SetlistChangeLine 도장 톤(STAMP_TONE)과 같은 색 — 필요하면 SetlistChangeLine.tsx에서 STAMP_TONE을 export해 재사용.
  - 차이가 없으면 두 칼럼 위에 "같은 세트리스트입니다."
  - 앙코르 줄 바탕은 Setlist와 같은 `songRowTint(isEncore, false)`(SongLink.tsx).
- [ ] **Step 2: 확인** — tsc·eslint 오류 없음.
- [ ] **Step 3: 커밋** — Task 7과 함께.

### Task 7: TourOverview(2단·시트·해시)와 투어 상세 연결

**Files:**
- Create: `src/features/zutopia/lives/TourOverview.tsx`
- Create: `src/features/zutopia/lives/use-hash-selection.ts`
- Modify: `src/features/zutopia/lives/DefaultTourContent.tsx`
- Modify: `README.md`, `docs/CONVENTIONS.md`

**Interfaces:**
- Consumes: Task 1(`dateHashes`, `dateIdFromHash`), Task 3(`defaultComparePair`), Task 4(`compact`), Task 5(`TourDateList` select, `TourDatePanelBody`, `TourSetlistVersions` action), Task 6(`TourCompare`), `SidePanel`.
- Produces:
  - `useHashSelection(dates: TourDateEntry[]): [string | null, (id: string | null) => void]` — 마운트 때 `dateIdFromHash(dates, location.hash)`, `hashchange`·`popstate`에서 다시 읽음. setter: id면 `history.pushState(null, "", "#" + hash)`, null이면 `history.pushState(null, "", location.pathname + location.search)`. 같은 값이면 push 안 함.
  - `useIsPc(): boolean` — `matchMedia("(min-width: 67.5rem)")`, 서버·첫 렌더는 false(useSyncExternalStore). 같은 파일 또는 `src/lib/use-media-query.ts`(구현자 판단).
  - `TourOverview({ tour }: { tour: TourDetail })`

- [ ] **Step 1: 구현 — 상태**: `[selectedId, select] = useHashSelection(tour.dates)`, `isPc = useIsPc()`, `versionId`(초기값 `tour.setlists[0]?.id`, TourSetlistVersions에 controlled로), `compareOpen`, `pair`(열 때 `defaultComparePair(tour.dates, selectedId)`로 채움). `selected = tour.dates.find(id)`.
- [ ] **Step 2: 구현 — PC(`pc:grid pc:grid-cols-2 pc:items-start pc:gap-5`)**: 왼쪽 `pc:sticky pc:top-4 pc:max-h-[calc(100dvh-2rem)] pc:overflow-y-auto` 패널 —
  - 선택 없음: `TourSetlistVersions`(action = 비교 버튼, 비교 쌍이 null이면 버튼 없음). 공통 세트리스트가 없고 공연일이 있으면 같은 면에 "날짜를 고르면 그날 세트리스트가 여기에 나와요"(text-sm).
  - 선택 있음(isPc일 때만): 어두운 면(LIVE_SURFACE_CLASS) 머리에 "← 투어 세트리스트" 버튼(`select(null)`), 도시(굵게)·날짜(요일)·DAY/회차·공연장, 오른쪽 비교 버튼, 아래 `TourDatePanelBody`.
  - 오른쪽: 지금 LiveSchedule의 제목 줄("공연 일정 · n dates") + `TourDateList select={{ selectedId, onSelect: select }}`. 공연일이 없으면 지금 안내 문구, 그리고 2단 없이 전체 폭.
- [ ] **Step 3: 구현 — `pc:` 미만**: 같은 마크업이 위아래로 쌓인다(왼쪽 패널은 항상 공통 상태). `selected && !isPc`면 `SidePanel open title={selected.city} subtitle={날짜·DAY·공연장}` 안에 `TourDatePanelBody`, `onClose={() => select(null)}`.
- [ ] **Step 4: 구현 — 비교**: `TourCompare open={compareOpen} pair={pair} ...`.
- [ ] **Step 5: 구현 — DefaultTourContent**: `<TourSetlistVersions/>` + `<LiveSchedule/>` 대신 `<TourOverview tour={tour} />`, LiveTicket에 `compact`. 페이지 폭 `pc:max-w-4xl` → `pc:max-w-6xl`. PC 머리 한 줄: `pc:grid pc:grid-cols-[auto_1fr] pc:items-center pc:gap-8` — 왼쪽 포스터(`pc:max-h-[280px]`, ViewTransition 그대로, 눌러서 크게 보기는 ZoomableImageGroup `hideThumbnails` + `renderTrigger`로 포스터를 트리거로), 오른쪽 제목(`pc:items-start pc:text-left`)·티켓·추가 이미지. 포스터가 없으면 오른쪽 덩어리만. 모바일·태블릿은 지금 순서·모양 그대로.
- [ ] **Step 6: 문서** — README `### 26.11.27` 아래 한 줄(예: "투어 상세를 PC 좌우 2단(세트리스트·공연 일정)으로 바꾸고, 날짜를 누르면 그날 세트리스트(모바일은 시트)·두 공연일 비교 창·공유 가능한 날짜 주소(#날짜)를 둠"), docs/CONVENTIONS.md 투어 상세 설명(접힌 "한 눈에 보기"·아코디언 서술)을 새 구조로 고침.
- [ ] **Step 7: 확인** — `pnpm exec tsc --noEmit -p .`, `pnpm exec eslint src/features/zutopia/lives`, `pnpm exec vitest run` 전체 PASS, `pnpm build` 성공. Review Focus 4: 빌드 결과(`out/zutopia/lives/<slug>.html`)에서 공통 세트리스트 없는 투어·공연일 없는 투어 페이지가 생성되는지 확인(slug는 Supabase에서 조회).
- [ ] **Step 8: 커밋**(허락 후) — Task 5·6·7 파일 + README·CONVENTIONS · `feat: 투어 상세를 PC 좌우 2단으로 바꾸고 날짜별 세트리스트(모바일 시트)·두 공연일 비교·날짜 주소 공유를 추가`

---

## 개편 2 (스펙 "개편 2") — 작업

- [ ] R1 `tour-nav.ts`(+test): `defaultSelectedId(hasCommon: boolean, dates, hashId: string | null): string | null`(해시 우선, 없으면 공통 있으면 null, 없으면 첫 비취소 id), `stripLabels(dates): Map<id, string>`(같은 도시가 이어지면 "04.21", 바뀌면 "오사카 04.20", 취소일 제외)
- [ ] R2 LiveTicket `strip`: 한 줄(종류 · 칸 · 아이콘), Variation·Official·Listen·Post 줄 없음(아이콘은 줄 끝)
- [ ] R3 TourHeader(포스터 3:4 고정 + 제목 + strip 티켓), DefaultTourContent의 "공연 정보" 구역(Variation·추가 이미지)
- [ ] R4 TourDateNav(PC 세로 목록 / 모바일 가로 밑줄 탭), TourOverview 재구성(시트 제거, 기본 선택 R1)
- [ ] R5 Setlist 선택곡 자리 접기("선택곡 · n곡 ▾")
- [ ] R6 README·CONVENTIONS, tsc·eslint·vitest·build
