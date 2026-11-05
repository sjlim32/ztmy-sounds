# 즛토피아 참전 기록 · 마지막 라이브 · 활동 연혁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** R2 이미지 프록시, 세트리스트 영어 제목, 디스코그래피 마지막 라이브, 라이브 참전 기록(이미지 저장·백업 포함), 활동 연혁을 순서대로 추가한다.

**Architecture:** 모든 Supabase 조회는 빌드 타임 서버 컴포넌트에서 하고, 공연 단위·곡별 라이브 기록 계산은 순수 함수 모듈(`live-history/units.ts`)에 모아 디스코그래피·체크리스트·연혁이 같이 쓴다. 사용자 체크 내역은 `localStorage`에만 저장하고 하이드레이션 후 읽는다. R2 이미지는 Pages Function(`/r2/*`)으로 같은 출처 프록시한다.

**Tech Stack:** Next.js 16(App Router, `output: "export"`), React 19, TypeScript, Tailwind v4, Supabase(빌드 타임), Cloudflare Pages Functions. 새로 추가: `vitest`(devDependency, 순수 로직 테스트), `html-to-image`(이미지 저장).

**Spec:** `docs/superpowers/specs/2026-11-05-zutopia-live-checklist-timeline-design.md`

## Global Constraints

- 정적 export: Supabase 조회는 `page.tsx`(서버 컴포넌트)에서만, `createBuildTimeSupabaseClient()`는 클라이언트로 넘기지 않는다.
- 사용자 데이터는 브라우저(`localStorage`)에만. 서버 저장·로그인 없음.
- 모바일은 `body`가 스크롤되지 않음 — 새 페이지는 내부 스크롤 + 중간 flex 체인 `min-h-0`. 즛토피아 페이지는 `ZutopiaScrollArea`(zutopia/layout.tsx)가 이미 스크롤을 연다.
- UI: 모던·심플. 한쪽 강조 바·그라데이션 버튼·알약(pill) 금지. 읽거나 누르는 글자 최소 `text-sm`, 10px 금지.
- 색은 `ztmy-*` 토큰, 아이콘은 `src/components/icons/` 커스텀 SVG만.
- 드문 한글 음절로 `pnpm build` postbuild 검사가 실패하면 `scripts/subset-fonts.mjs`의 `EXTRA_HANGUL`에 추가.
- `live_date`는 `timestamptz` — `"T"` 앞만 잘라 쓴다.
- 커밋은 **사용자 승인 후에만**. 작업 단위마다 한 문장 메시지, 같은 커밋에 `README.md` 변경 이력 한 줄 + 관련 `docs/*.md` 갱신.
- 검증 기본 세트: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`(Task 2 이후). 브라우저 확인은 사용자가 요청할 때만.

## Review Focus

1. 저장된 체크 ID가 현재 데이터에 없음(공연 삭제·수정) → 조용히 무시, 저장값은 지우지 않음. _(Task 5 `summarizeAttendance` 테스트)_
2. `localStorage` 접근이 예외를 던짐(사파리 사생활 보호 모드, 용량 초과) → 페이지가 죽지 않고 빈 체크로 동작. _(Task 4 `safeRead`/`safeWrite` 테스트)_
3. 다른 앱 JSON·깨진 파일·다른 버전 파일로 복원 → 거부하고 기존 체크 유지. _(Task 4 `parseBackup` 테스트)_
4. 날짜 경계: 이틀 공연의 월 경계(2026-02-28 → 03-01), "N일 전"의 시간대 → 날짜 문자열끼리 UTC로 계산. _(Task 2 `addDays`, Task 3 `daysBetween` 테스트)_
5. 같은 날 일정 여러 개(앨범+수록 싱글 동시 발매) → 연혁에서 겹치지 않게 다른 줄. _(Task 8 `assignLanes` 테스트)_

---

### Task 0: R2 이미지 같은 출처 프록시

**Files:**

- Create: `functions/r2/[[path]].ts`
- Create: `public/_routes.json`
- Create: `src/lib/asset-url.ts`
- Modify: `src/features/zutopia/song-db/data.ts` (곡·앨범 `cover_image_url`)
- Modify: `src/features/zutopia/lives/data.ts` (`poster_image_url`, `icon_image_url`, `additional_image_urls` — 목록·상세·투어 공연일 전부)
- Modify: `docs/RULES.md`, `docs/STACK.md`, `README.md`

**Interfaces:**

- Produces: `toAssetUrl(url: string): string`, `toAssetUrl(url: null): null` (오버로드, `string | null` 통과) — 이후 태스크의 모든 이미지 주소는 이 함수를 거친 값.

- [ ] **Step 1: `functions/r2/[[path]].ts` 작성** — `onRequest(context: { request: Request; params: { path?: string[] } })`. GET/HEAD 외에는 405. 대상 = `https://assets.ztmy-sounds.fans/` + `params.path.join("/")` + 원 요청의 query. `fetch(target, { method, headers: { Accept: <원 요청 Accept> }, cf: { cacheEverything: true } })`. 응답 헤더를 복사하고 2xx일 때 `Cache-Control: public, max-age=31536000, immutable` 설정(R2 파일 교체 방식이 "같은 이름 덮어쓰기"라면 `max-age=86400`으로 — 사용자에게 한 줄 확인). `@cloudflare/workers-types`는 추가하지 않는다(타입은 표준 `Request`/`Response`로, `cf`는 `as RequestInit` 캐스팅).
- [ ] **Step 2: `public/_routes.json`** — `{"version":1,"include":["/r2/*"],"exclude":[]}`. `/assets/*` 정적 파일이 Function을 거치지 않게 한다.
- [ ] **Step 3: `src/lib/asset-url.ts`** — 접두사 `https://assets.ztmy-sounds.fans/`로 시작하고 `process.env.NODE_ENV === "production"`이면 `/r2/` + 나머지로 바꾸고, 아니면 그대로. 다른 주소는 그대로.
- [ ] **Step 4: 데이터 계층에 적용** — 위 두 data.ts에서 Supabase 결과를 반환하기 직전에 이미지 필드를 `toAssetUrl`로 감싼다(컴포넌트는 손대지 않음). 원곡 커버(`fetchOriginalsById`)도 포함.
- [ ] **Step 5: 검증** — `pnpm exec tsc --noEmit` 에러 0, `pnpm lint` 통과. `pnpm build` 후 `grep -r "assets.ztmy-sounds.fans" out --include=*.html | wc -l` → `0`, `grep -rc "/r2/" out/zutopia/songs/index.html` → 1 이상. `ls out/_routes.json` 존재.
- [ ] **Step 6: 문서** — `RULES.md`에: `/r2/*`는 Pages Function 프록시(무료 한도 하루 10만 요청), `/assets/`는 `public/` 정적 파일이라 접두사로 쓰면 안 됨, `next dev`에선 Function이 없어 원래 주소 사용. README 한 줄.
- [ ] **Step 7: 커밋 (승인 후)** — `feat: R2 이미지를 메인 도메인 /r2/ 프록시로 받아 HTTP/3·같은 출처로 제공`
- [ ] **Step 8: 배포 후 사용자 확인 요청** — Network 탭에서 `/r2/` 이미지 프로토콜 `h3`, `/assets/` 로고 정상.

---

### Task 1: 세트리스트 영어 제목

**Files:**

- Modify: `src/features/zutopia/lives/types.ts` (`LiveSetlistEntry`)
- Modify: `src/features/zutopia/lives/data.ts` (`SETLIST_COLUMNS`, `SetlistRow`, `toSetlist`)
- Modify: `src/features/zutopia/lives/Setlist.tsx` / `SongLink.tsx` (제목 렌더링 위치)
- Modify: `README.md`

**Interfaces:**

- Produces: `LiveSetlistEntry.titleEn: string`

- [ ] **Step 1:** `SETLIST_COLUMNS`의 `songs!inner(...)`에 `title_en` 추가, `SetlistRow.songs.title_en: string`, `toSetlist`에서 `titleEn: entry.songs.title_en`.
- [ ] **Step 2:** 세트리스트 행에 영어 제목 표시. 기준: 원어(기본 색) / 한국어·영어(흐린 글자, `text-sm` 이상). 모바일은 한국어 아래 영어 한 줄, PC(`tablet:`)는 한국어 옆 ` · 영어`로 행 높이를 아낀다. 한국어와 영어가 같으면 영어 생략.
- [ ] **Step 3: 검증** — `tsc`, `lint` 통과. `pnpm build` 후 INTENSE 서울 상세 HTML(`out/zutopia/lives/<slug>/index.html`)에서 `Byoushinwo` 같은 영어 제목 문자열 grep 1건 이상(실제 `title_en` 값으로).
- [ ] **Step 4: 커밋 (승인 후)** — `feat: 공연 세트리스트에 곡 영어 제목 표시`

---

### Task 2: 공용 라이브 기록 모듈 (공연 단위 · 곡별 통계) + 테스트 환경

**Files:**

- Modify: `package.json` (devDependency `vitest`, 스크립트 `"test": "vitest run"`)
- Create: `vitest.config.ts` (`resolve.alias: { "@": "<root>/src" }`, `test.include: ["src/**/*.test.ts"]`, environment `node`)
- Create: `src/features/zutopia/live-history/types.ts`
- Create: `src/features/zutopia/live-history/units.ts`
- Create: `src/features/zutopia/live-history/units.test.ts`
- Create: `src/features/zutopia/live-history/data.ts`
- Modify: `src/features/zutopia/lives/data.ts` (`collapseRepeatedDays` 주석의 暗く黒く 8·10번 예시 삭제 — 데이터가 고쳐짐)
- Modify: `docs/STACK.md`(vitest), `README.md`

**Interfaces:**

- Produces (`types.ts`):
  ```ts
  type LiveUnitType = "CONCERT" | "FESTIVAL" | "EVENT"; // = Database LiveType
  interface LiveUnit {
    id: string; // `${liveId}:${date}`
    liveId: string;
    date: string; // "YYYY-MM-DD"
    type: LiveUnitType;
    title: string; // 투어면 투어 title, 아니면 lives.title
    titleKo: string | null;
    city: string; // region에서 뽑은 한글 도시명
    tourId: string | null;
    dayNumber: number | null; // 이틀 이상 공연일 때 1부터, 아니면 null
    href: string | null; // `/zutopia/lives/<투어 slug 또는 live slug>`
    songIds: string[]; // 원곡 id, 중복 없음
  }
  interface SongLiveStat {
    count: number;
    lastUnitId: string;
  }
  interface LiveHistory {
    units: LiveUnit[];
    statsBySongId: Record<string, SongLiveStat>;
  }
  // units.ts 입력(빌드 타임 조회 결과 원형)
  interface RawLive {
    id;
    slug: string | null;
    tour_id: string | null;
    title;
    title_ko: string | null;
    type: LiveUnitType;
    start_date: string;
    end_date: string | null;
    live_date: string | null;
    region: string;
  }
  interface RawTour {
    id: string;
    slug: string;
    title: string;
    title_ko: string;
  }
  interface RawSetlistRow {
    live_id: string | null;
    tour_id: string | null;
    song_id: string;
    day_number: number | null;
  }
  ```
- Produces (`units.ts`):
  - `addDays(date: string, n: number): string`
  - `buildLiveUnits(input: { lives: RawLive[]; tours: RawTour[]; setlists: RawSetlistRow[]; originalOf: Record<string, string> }, today: string): LiveUnit[]` — 날짜 내림차순(최신 먼저), 같은 날짜면 `dayNumber` 오름차순.
  - `buildSongLiveStats(units: LiveUnit[]): Record<string, SongLiveStat>`
- Produces (`data.ts`): `getLiveHistory(): Promise<LiveHistory>` (React `cache()`로 감쌈, ACTIVE 행만, `today` = 빌드 시점 `new Date().toISOString().slice(0,10)`), `getOriginalOf(): Promise<Record<string,string>>`(어레인지 곡 id → 원곡 id; 원곡은 자기 자신 키 없음).

규칙(스펙 "나누는 규칙" 그대로):

- `FESTIVAL`: 행 하나 = 단위 하나, `date = (live_date ?? start_date).slice(0,10)`, `dayNumber = null`.
- `CONCERT`/`EVENT`: `start_date..(end_date ?? start_date)` 하루씩. 하루뿐이면 `dayNumber = null`, 아니면 1..N. 곡 = (tour_id 있으면 그 투어의 `setlists.tour_id` 행) ∪ (이 live의 `day_number == null` 행) ∪ (이 live의 `day_number == N` 행).
- 투어 소속 판정: `tour_id` 일치 **또는** `lives.slug === tours.slug`(기존 `tourDateFilter`와 같음). 이때 `title`/`href`는 투어 것.
- 곡 id는 `originalOf[id] ?? id`로 바꾼 뒤 Set으로 중복 제거.
- `date > today`인 단위는 제외.

- [ ] **Step 1: vitest 설치·설정** — `pnpm add -D vitest`, `vitest.config.ts`, `"test": "vitest run"`. `pnpm test` → "No test files found"로 끝나면 OK.
- [ ] **Step 2: 실패하는 테스트 작성** (`units.test.ts`) — 픽스처는 테스트 안에서 직접 만든다.
  ```ts
  test("addDays는 월 경계를 넘는다", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
  test("페스티벌은 live_date 하루 단위 하나", () => {
    // start 2026-07-24, end 2026-07-26, live_date "2026-07-25T00:00:00+00:00"
    expect(units.map((u) => [u.id, u.date, u.dayNumber])).toEqual([
      ["f1:2026-07-25", "2026-07-25", null],
    ]);
  });
  test("day_number 없는 이틀 콘서트는 같은 곡으로 이틀", () => {
    // c1: 2026-02-28 ~ 2026-03-01, setlist [s1, s2] (day_number null)
    expect(units.map((u) => [u.date, u.dayNumber, u.songIds])).toEqual([
      ["2026-03-01", 2, ["s1", "s2"]],
      ["2026-02-28", 1, ["s1", "s2"]],
    ]);
  });
  test("day_number 있는 이틀 공연은 공통 곡 + 그날 곡", () => {
    // s1(null), s2(day1), s3(day2) → day1 [s1,s2], day2 [s1,s3]
  });
  test("투어 공연일은 투어 공통 곡을 합치고 투어 제목·링크를 쓴다", () => {
    // tour t1(slug "intense-2"), tour setlist [s1], live L(tour_id t1) own [s9]
    expect(u.songIds.sort()).toEqual(["s1", "s9"]);
    expect(u.href).toBe("/zutopia/lives/intense-2");
  });
  test("tour_id 없이 slug가 투어 slug인 공연도 투어 소속", () => {
    /* href·공통곡 확인 */
  });
  test("같은 날 같은 곡 두 행은 한 번", () => {
    /* s1 두 행 → songIds ["s1"] */
  });
  test("어레인지 곡은 원곡 id로 센다", () => {
    /* originalOf {a1: s1}, setlist [a1] → ["s1"] */
  });
  test("오늘 이후 공연은 빠진다", () => {
    /* today "2026-11-05", 공연 2026-12-01 → [] */
  });
  test("buildSongLiveStats는 횟수와 가장 최근 단위", () => {
    // 단위 A(2024-06-15,[s1]), B(2026-03-01,[s1,s2])
    expect(stats).toEqual({
      s1: { count: 2, lastUnitId: B.id },
      s2: { count: 1, lastUnitId: B.id },
    });
  });
  ```
- [ ] **Step 3:** `pnpm test` → 위 테스트 FAIL(함수 없음).
- [ ] **Step 4: `units.ts` 구현** — `addDays`는 `Date.UTC`로 계산해 시간대 영향 없음. 도시명은 `lives/data.ts`의 `extractKoreanCity`를 export해서 재사용.
- [ ] **Step 5:** `pnpm test` → 모두 PASS.
- [ ] **Step 6: `data.ts` 구현** — `lives`(ACTIVE), `tours`(ACTIVE), `setlists`(`live_id, tour_id, song_id, day_number`, `songs.status = ACTIVE` 조인 필터), `songs`(`id, original_song_id`)를 병렬 조회 → `buildLiveUnits` → `buildSongLiveStats`.
- [ ] **Step 7: 실데이터 확인** — scratchpad의 일회성 스크립트 또는 임시 `console.log`로 `units.length`와 INTENSE IN SEOUL 단위 2개(2024-06-15 DAY 1, 06-16 DAY 2)가 나오는지 확인 후 로그 제거. `tsc`, `lint` 통과.
- [ ] **Step 8: 커밋 (승인 후)** — `feat: 공연일 단위·곡별 라이브 기록 공용 모듈과 vitest 추가`

---

### Task 3: 디스코그래피 마지막 라이브 표시 · 정렬 · `?lastLive=1`

**Files:**

- Create: `src/features/zutopia/live-history/summary.ts`, `summary.test.ts`
- Modify: `src/app/(pages)/zutopia/songs/page.tsx`
- Modify: `src/features/zutopia/song-db/types.ts` (`SongGroupBy`에 `"lastLive"`)
- Modify: `src/features/zutopia/song-db/song-album-grouping.ts` (`groupSongs`에 lastLive 분기)
- Modify: `src/features/zutopia/song-db/components/SongListView.tsx`
- Modify: `src/features/zutopia/song-db/components/SongDetailPanel.tsx`
- Modify: `README.md`

**Interfaces:**

- Consumes: `getLiveHistory()`, `getOriginalOf()`, `LiveUnit`, `SongLiveStat` (Task 2)
- Produces (`summary.ts`):
  ```ts
  interface SongLiveSummary {
    count: number;
    lastTitle: string;
    lastDate: string;
    lastHref: string | null;
  }
  function toSongLiveSummaries(
    songIds: string[],
    history: LiveHistory,
    originalOf: Record<string, string>,
  ): Record<string, SongLiveSummary>;
  // 어레인지 곡 id는 원곡 통계를 그대로 받는다. 기록 없는 곡은 키 없음.
  function daysBetween(from: string, to: string): number; // UTC 날짜 차
  function formatLastLiveLine(s: SongLiveSummary, today: string): string;
  // → "2026.03.14 · 총 41회 · 236일 전" (공연명은 링크라 따로 렌더링)
  ```
- Produces (`groupSongs`): `groupSongs(songs, "lastLive", direction, summaries?: Record<string, SongLiveSummary>)` → 그룹 하나(`key: "lastLive"`, `label: ""`, `album: null`), `lastDate` 기준 정렬(asc = 오래된 것 먼저), 기록 없는 곡은 방향과 상관없이 맨 뒤(발매일 순).

- [ ] **Step 1: 실패하는 테스트** (`summary.test.ts`)
  ```ts
  test("daysBetween은 시간대와 무관한 날짜 차", () => {
    expect(daysBetween("2026-03-14", "2026-11-05")).toBe(236);
  });
  test("어레인지 곡은 원곡 기록을 받는다", () => {
    /* originalOf {a1:s1} → summaries.a1 === summaries.s1 내용 */
  });
  test("기록 없는 곡은 키가 없다", () => {});
  test("formatLastLiveLine", () => {
    expect(
      formatLastLiveLine(
        { count: 41, lastTitle: "x", lastDate: "2026-03-14", lastHref: null },
        "2026-11-05",
      ),
    ).toBe("2026.03.14 · 총 41회 · 236일 전");
  });
  test("groupSongs lastLive: 기록 없는 곡은 asc/desc 모두 맨 뒤", () => {});
  ```
  `groupSongs` 테스트는 `song-album-grouping.test.ts`로 두고 최소 필드만 가진 `SongWithAlbums` 픽스처를 `as` 캐스팅으로 만든다.
- [ ] **Step 2:** `pnpm test` → FAIL.
- [ ] **Step 3: 구현** — `summary.ts`, `groupSongs` lastLive 분기.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5: 페이지 연결** — `songs/page.tsx`에서 `getLiveHistory()`·`getOriginalOf()` → `toSongLiveSummaries` → `SongListView`에 `liveSummaries` prop.
- [ ] **Step 6: SongListView UI**
  - "보기" 줄에 `FilterChip` "마지막 라이브" 추가(미공개곡 칩과 나란히; `hasUnreleased`가 false여도 줄은 보임).
  - 상태는 `searchParams.get("lastLive") === "1"`에서 시작, 토글 시 기존 쿼리(`song`, `album`) 유지하며 `router.replace(..., { scroll: false })`로 `lastLive` 추가/삭제.
  - 켜졌을 때만 `SORT_OPTIONS`에 `{ value: "lastLive", label: "최근 공연일" }`. 끄는 순간 `groupBy === "lastLive"`면 `"album"`으로.
  - 켜졌을 때 행의 제목 블록 아래 한 줄: `마지막 · <a href={lastHref}>{lastTitle}</a> · {formatLastLiveLine}` (`text-sm text-white/60`, 링크는 밑줄 흐리게). 기록 없으면 "라이브 기록 없음"(`text-white/40`). 이 줄의 링크는 행의 `<button>` **밖**에 둔다(button 안 a 금지 — 기존 주석 참고): 행 구조를 "버튼(커버+제목) / 형제 div(마지막 라이브 줄)"로 세로로 쌓거나, 줄을 버튼 아래 별도 요소로 배치.
  - lastLive 그룹(`key === "lastLive"`)은 그룹 헤더를 그리지 않는다.
  - `today`는 클라이언트에서 `new Date()` 로컬 날짜(`YYYY-MM-DD`)로 계산하되 하이드레이션 불일치를 피하려 마운트 후 계산(그 전엔 "N일 전" 생략).
- [ ] **Step 7: SongDetailPanel** — `liveSummary?: SongLiveSummary` prop 추가, 상세 정보 영역에 "마지막 라이브: 공연명(링크) · 날짜 · 총 N회" 항상 표시, 없으면 "라이브 기록 없음".
- [ ] **Step 8: 검증** — `tsc`, `lint`, `pnpm test` 통과. `pnpm build` 성공(`useSearchParams`는 이미 Suspense 안).
- [ ] **Step 9: 커밋 (승인 후)** — `feat: 디스코그래피에 곡별 마지막 라이브 표시와 최근 공연일 순 정렬 추가`

---

### Task 4: 체크 내역 저장 · 백업 형식

**Files:**

- Create: `src/features/zutopia/attendance/storage.ts`, `storage.test.ts`
- Create: `src/features/zutopia/attendance/useAttendedUnits.ts`

**Interfaces:**

- Produces (`storage.ts`):
  ```ts
  const ATTENDANCE_STORAGE_KEY = "ztmy-sounds:live-attendance";
  interface AttendanceData {
    version: 1;
    attended: string[];
    updatedAt: string;
  }
  function parseAttendance(raw: string | null): AttendanceData; // 잘못되면 빈 데이터(attended [])
  function parseBackup(raw: string): AttendanceData | null; // 엄격: version 1·attended string[]가 아니면 null
  function serializeAttendance(attended: Iterable<string>, now: Date): string;
  function backupFileName(now: Date): string; // "ztmy-attendance-YYYYMMDD.json" (로컬 날짜)
  function safeRead(
    storage: Pick<Storage, "getItem"> | undefined,
  ): string | null; // 예외 시 null
  function safeWrite(
    storage: Pick<Storage, "setItem"> | undefined,
    value: string,
  ): boolean;
  ```
- Produces (`useAttendedUnits.ts`): `useAttendedUnits(): { ready: boolean; attended: ReadonlySet<string>; toggle(id: string): void; replaceAll(ids: string[]): void }` — 마운트 후 `safeRead(window.localStorage)`, 변경 시 `safeWrite`. 같은 키의 `storage` 이벤트로 다른 탭 변경 반영. 연혁(Task 8)도 이 훅을 쓴다.

- [ ] **Step 1: 실패하는 테스트**
  ```ts
  test("parseAttendance: null·깨진 JSON·다른 형식은 빈 데이터", () => {
    for (const raw of [null, "{", "[]", '{"version":2,"attended":["a"]}'])
      expect(parseAttendance(raw).attended).toEqual([]);
  });
  test("parseAttendance: 문자열 아닌 항목은 버리고 중복 제거", () => {
    expect(
      parseAttendance('{"version":1,"attended":["a",1,"a","b"],"updatedAt":""}')
        .attended,
    ).toEqual(["a", "b"]);
  });
  test("parseBackup: 형식이 다르면 null", () => {
    expect(parseBackup('{"foo":1}')).toBeNull();
    expect(parseBackup("not json")).toBeNull();
  });
  test("serialize → parse 왕복", () => {});
  test("backupFileName", () => {
    expect(backupFileName(new Date(2026, 10, 5))).toBe(
      "ztmy-attendance-20261105.json",
    );
  });
  test("safeRead/safeWrite는 예외를 삼킨다", () => {
    const throwing = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("quota");
      },
    };
    expect(safeRead(throwing)).toBeNull();
    expect(safeWrite(throwing, "x")).toBe(false);
    expect(safeRead(undefined)).toBeNull();
  });
  ```
- [ ] **Step 2:** FAIL 확인 → **Step 3:** 구현 → **Step 4:** PASS 확인.
- [ ] **Step 5:** 훅 작성, `tsc`·`lint` 통과.
- [ ] (커밋은 Task 6과 함께 — 화면 없는 저장 모듈만으론 사용자 변화가 없음)

---

### Task 5: 체크 결과 집계

**Files:**

- Create: `src/features/zutopia/attendance/summarize.ts`, `summarize.test.ts`

**Interfaces:**

- Consumes: `LiveUnit` (Task 2)
- Produces:

  ```ts
  interface AttendanceSong {
    id: string;
    slug: string;
    title: string;
    titleKo: string;
    titleEn: string;
    releaseDate: string;
    coverSrc: string | null;
  }
  interface HeardSong extends AttendanceSong {
    count: number;
  }
  interface AttendanceSummary {
    attendedCount: number; // 현재 데이터에 존재하는 체크 단위 수
    heard: HeardSong[]; // count desc → releaseDate asc → title
    unheard: AttendanceSong[]; // releaseDate asc
    period: { from: string; to: string } | null; // 체크한 단위 날짜 범위
  }
  function summarizeAttendance(
    units: LiveUnit[],
    attended: ReadonlySet<string>,
    songs: AttendanceSong[],
  ): AttendanceSummary;
  ```

  `songs`는 페이지에서 **원곡·발매곡만**(미공개곡, `original_song_id` 있는 곡 제외) 넘긴다. `units.songIds`에 있지만 `songs`에 없는 id는 무시.

- [ ] **Step 1: 실패하는 테스트**
  ```ts
  test("체크 없으면 빈 결과", () => {
    expect(summarizeAttendance(units, new Set(), songs)).toEqual({
      attendedCount: 0,
      heard: [],
      unheard: songsByRelease,
      period: null,
    });
  });
  test("없는 단위 ID는 무시", () => {
    /* attended {"gone:2020-01-01", A.id} → attendedCount 1 */
  });
  test("정렬: 횟수 많은 순, 같으면 발매일 순", () => {});
  test("못 들은 곡은 songs 중 한 번도 없는 곡", () => {});
  test("period는 체크한 단위의 최소~최대 날짜", () => {});
  ```
- [ ] **Step 2:** FAIL → **Step 3:** 구현 → **Step 4:** PASS.

---

### Task 6: 참전 기록 페이지 (탭 · 체크 · 결과 · 백업/복원)

**Files:**

- Create: `src/app/(pages)/zutopia/attendance/page.tsx`
- Create: `src/features/zutopia/attendance/components/AttendanceView.tsx` (탭 상태, `useAttendedUnits`)
- Create: `src/features/zutopia/attendance/components/AttendPicker.tsx`
- Create: `src/features/zutopia/attendance/components/AttendanceResult.tsx`
- Create: `src/features/zutopia/attendance/components/BackupControls.tsx`
- Modify: `src/features/zutopia/nav.ts` (`{ href: "/zutopia/attendance", label: "참전", paths: ["/zutopia/attendance"] }`)
- Modify: `README.md`, `docs/CONVENTIONS.md`(체크 내역 localStorage 키·형식 한 단락)

**Interfaces:**

- Consumes: `getLiveHistory`, `LiveUnit` (T2), `useAttendedUnits`, `serializeAttendance`, `parseBackup`, `backupFileName` (T4), `summarizeAttendance`, `AttendanceSong` (T5), `toAssetUrl` 적용된 커버(T0), `getSongsWithAlbums`·`getSongCoverSrc`(기존)
- Produces: `AttendanceResult`가 `summary: AttendanceSummary`를 Task 7의 `<ShareImageButton summary={summary} />`에 넘길 자리(Task 7 전까지는 버튼 없음).

- [ ] **Step 1: page.tsx** — `getLiveHistory()`, `getSongsWithAlbums()` → `AttendanceSong[]`(원곡·발매곡만, `coverSrc = getSongCoverSrc`) → `<AttendanceView units songs />`. `metadata.title = "라이브 참전 기록"`. sr-only h1.
- [ ] **Step 2: AttendPicker** — 투어 단위는 `tourId`로 묶어 투어 제목 아래 공연일 목록(날짜 · 도시 · `DAY N`), 그 밖은 한 줄씩. 그룹 순서는 최신순(units가 이미 최신순). 각 줄은 `<label>` + 체크박스(키보드 접근). 상단 "간 공연 N개".
- [ ] **Step 3: AttendanceResult** — 숫자(참전·성불·성불 대기), "성불 / 성불 대기" 전환, 행 = 커버 + 일본어/한국어/영어 + `×N`. 버튼: "노래별 마지막 라이브 보러가기"(`<a href="/zutopia/songs?lastLive=1" target="_blank" rel="noopener">`). 체크 0개면 빈 상태 문구 + ① 탭으로 이동 버튼.
- [ ] **Step 4: BackupControls** — 백업: `Blob([serializeAttendance(...)])` → `backupFileName(new Date())`로 다운로드. 복원: `<input type="file" accept="application/json">` → `parseBackup` null이면 "백업 파일 형식이 아니에요" 안내, 아니면 `window.confirm("지금 체크 내역을 백업 파일 내용으로 바꿀까요?")` 후 `replaceAll`.
- [ ] **Step 5: `ready`가 false인 동안** 체크박스·결과 숫자를 그리지 않거나 비활성(깜빡임 방지).
- [ ] **Step 6: 검증** — `tsc`, `lint`, `pnpm test`, `pnpm build` 성공, `out/zutopia/attendance/index.html` 존재.
- [ ] **Step 7: 커밋 (승인 후)** — `feat: 즛토피아 라이브 참전 기록 페이지 추가` (Task 4·5 파일 포함)

---

### Task 7: 참전 기록 이미지 저장

**Files:**

- Modify: `package.json` (`html-to-image`)
- Create: `src/features/zutopia/attendance/share/tally.ts`, `tally.test.ts`
- Create: `src/features/zutopia/attendance/share/layout.ts`, `layout.test.ts`
- Create: `src/features/zutopia/attendance/share/Tally.tsx`
- Create: `src/features/zutopia/attendance/share/ShareImage.tsx`
- Create: `src/features/zutopia/attendance/share/ShareImageButton.tsx`
- Modify: `AttendanceResult.tsx` (버튼 배치)
- Modify: `docs/STACK.md`, `README.md`

**Interfaces:**

- Consumes: `AttendanceSummary`, `HeardSong` (T5)
- Produces:
  ```ts
  // tally.ts
  const TALLY_MAX_BUNDLES = 4;
  function tallyParts(count: number): {
    bundles: number;
    rest: number;
    overflow: number;
  };
  // layout.ts
  type ShareFormat = "square" | "story";
  const SHARE_SIZE: Record<ShareFormat, { width: 1080; height: 1080 | 1920 }>;
  interface ShareLayout {
    coverPx: number;
    titlePx: number;
    subPx: number;
    rowGapPx: number;
    showEnglish: boolean;
  }
  function pickShareLayout(songCount: number, format: ShareFormat): ShareLayout;
  function defaultShareFormat(isWide: boolean): ShareFormat; // true → "square"
  ```

디자인 값(스펙 확정): 배경 `#050223` + 흰 테두리, 상단 가운데(로고 흰 외곽선 = `MobileHeader.tsx`의 4방향 1px `drop-shadow` — 1080px 캔버스에서는 2~3px로 비례 확대) → 제목 "나의 ZUTOMAYO 라이브 참전 기록" → 숫자(간 공연, 들은 곡). 2열 목록: 커버 + 일본어 / 한국어 / 영어 + 탤리(`ztmy-magenta`). 하단: `period`(YYYY.MM ~ YYYY.MM) · `ztmy-sounds.fans`. 들은 곡만, `summary.heard` 순서 그대로.

- [ ] **Step 1: 실패하는 테스트**
  ```ts
  test.each([
    [1, { bundles: 0, rest: 1, overflow: 0 }],
    [5, { bundles: 1, rest: 0, overflow: 0 }],
    [8, { bundles: 1, rest: 3, overflow: 0 }],
    [20, { bundles: 4, rest: 0, overflow: 0 }],
    [23, { bundles: 4, rest: 0, overflow: 3 }],
  ])("tallyParts(%i)", (n, want) => {
    expect(tallyParts(n)).toEqual(want);
  });
  test("곡이 많을수록 크기가 줄거나 같다", () => {
    for (const f of ["square", "story"] as const) {
      const sizes = [5, 15, 30, 50, 80, 120].map(
        (n) => pickShareLayout(n, f).titlePx,
      );
      expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    }
  });
  test("최소 크기 아래로 내려가지 않는다", () => {
    expect(pickShareLayout(200, "square").titlePx).toBeGreaterThanOrEqual(
      MIN_TITLE_PX,
    );
  });
  test("넘치면 영어만 뺀다", () => {
    expect(pickShareLayout(5, "square").showEnglish).toBe(true);
    expect(pickShareLayout(120, "square").showEnglish).toBe(false);
  });
  test("모든 단계의 2열 목록이 캔버스 높이 안에 들어간다", () => {
    // rows = ceil(n/2), 행 높이 = max(coverPx, 줄 수 × titlePx × 1.3) + rowGapPx; 머리·꼬리 영역 높이를 뺀 공간 이하
  });
  ```
  단계 경계값·`MIN_TITLE_PX`(1080px 기준 폰에서 읽을 수 있는 값, 시작점 24px)는 구현자가 실제 렌더링을 보고 정하되 위 테스트를 만족해야 한다. 적은 곡 수에서는 넉넉하게(사용자 피드백: 시안이 너무 작고 빽빽함).
- [ ] **Step 2:** FAIL → **Step 3:** `tally.ts`, `layout.ts` 구현 → **Step 4:** PASS.
- [ ] **Step 5: Tally.tsx** — SVG: 세로줄 4개 + 사선 1개 = 한 묶음, 남은 개수만큼 세로줄, `overflow > 0`이면 옆에 `+N` 글자. `stroke` = `ztmy-magenta`.
- [ ] **Step 6: ShareImage.tsx** — 고정 픽셀 크기(`SHARE_SIZE`)의 화면 밖(`position: fixed; left: -99999px`) 요소. 커버는 `<img crossOrigin="anonymous">`.
- [ ] **Step 7: ShareImageButton.tsx** — "이미지 저장" + "정사각형 / 세로" 전환(`defaultShareFormat(matchMedia("(min-width: 50rem)").matches)`). 클릭 시 `document.fonts.ready` → 이미지 로드 대기 → `toBlob(node, { pixelRatio: 1, width, height })`. 모바일에서 `navigator.canShare?.({ files: [file] })`이면 `navigator.share`, 아니면 `<a download="ztmy-live-record.png">`. 들은 곡이 0이면 버튼 비활성. 실패 시 안내 문구.
- [ ] **Step 8: 검증** — `tsc`, `lint`, `pnpm test`, `pnpm build`. 이미지 실물 확인은 배포 환경 또는 `pnpm build && wrangler pages dev out`(같은 출처 `/r2/`)에서 — 사용자에게 확인 요청(5곡/40곡/80곡 체크 상태에서 정사각형·세로 각각).
- [ ] **Step 9: 커밋 (승인 후)** — `feat: 참전 기록 결과를 정사각형·세로 이미지로 저장`

---

### Task 8: 활동 연혁

**Files:**

- Create: `src/features/zutopia/timeline/events.ts`, `events.test.ts`
- Create: `src/features/zutopia/timeline/components/TimelineView.tsx` (범례 토글, 내 참전 표시)
- Create: `src/features/zutopia/timeline/components/HorizontalTimeline.tsx` (PC)
- Create: `src/features/zutopia/timeline/components/VerticalTimeline.tsx` (모바일)
- Create: `src/app/(pages)/zutopia/timeline/page.tsx`
- Modify: `src/features/zutopia/nav.ts` (`{ href: "/zutopia/timeline", label: "연혁", paths: ["/zutopia/timeline"] }`)
- Modify: `README.md`

**Interfaces:**

- Consumes: `getLiveHistory`, `LiveUnit` (T2), `useAttendedUnits` (T4), `getSongsWithAlbums`, `getAlbumsWithSongs`, `parseSongMetadata`(기존)
- Produces (`events.ts`):

  ```ts
  type TimelineKind = "song" | "album" | "live";
  interface TimelineEvent {
    id: string;
    kind: TimelineKind;
    date: string;
    endDate: string | null;
    label: string;
    href: string | null;
    unitIds: string[];
  }
  function buildTimelineEvents(input: {
    songs: { id; slug; title; releaseDate; unreleased: boolean }[];
    albums: { id; slug; title; releaseDate }[];
    units: LiveUnit[];
  }): TimelineEvent[]; // date asc
  function dateToOffset(date: string, start: string, pxPerDay: number): number;
  function assignLanes(
    events: TimelineEvent[],
    minGapDays: number,
  ): Map<string, number>; // id → 줄 번호(0부터)
  ```
  - 곡: 미공개곡 제외, `href = /zutopia/songs?song=<slug>`. 앨범: `href = /zutopia/albums?album=<slug>`.
  - 공연: 투어(`tourId` 있음)는 투어당 이벤트 하나, `date` = 최소, `endDate` = 최대 단위 날짜, `unitIds` = 소속 단위 전부. 투어 아닌 공연은 `liveId`당 하나(이틀 공연도 하나, `endDate` = 마지막 날). `href` = 단위의 `href`.
  - 확대/축소는 하지 않는다. 위치는 반드시 `dateToOffset` 하나로 계산(나중에 `pxPerDay`만 바꾸면 되게).

- [ ] **Step 1: 실패하는 테스트**
  ```ts
  test("투어 단위들은 기간 이벤트 하나", () => {
    /* 단위 3개(2026-02-28, 03-14, 06-18) → date "2026-02-28", endDate "2026-06-18", unitIds 3개 */
  });
  test("미공개곡은 빠진다", () => {});
  test("dateToOffset", () => {
    expect(dateToOffset("2026-01-11", "2026-01-01", 2)).toBe(20);
  });
  test("같은 날 이벤트는 다른 줄", () => {
    const lanes = assignLanes(
      [ev("a", "2020-01-01"), ev("b", "2020-01-01"), ev("c", "2020-06-01")],
      14,
    );
    expect(lanes.get("a")).not.toBe(lanes.get("b"));
    expect(lanes.get("c")).toBe(0);
  });
  test("기간 이벤트는 끝날 때까지 그 줄을 차지한다", () => {});
  ```
- [ ] **Step 2:** FAIL → **Step 3:** 구현 → **Step 4:** PASS.
- [ ] **Step 5: page.tsx** — 데이터 조회 → `buildTimelineEvents` → `<TimelineView events />`. metadata title "활동 연혁".
- [ ] **Step 6: TimelineView** — 범례(곡 `ztmy-sky` / 앨범 `ztmy-sun` / 공연 `ztmy-purple`)를 토글 버튼으로(`aria-pressed`). `useAttendedUnits`로 `unitIds` 중 하나라도 체크된 공연은 `ztmy-magenta` 테두리. PC(`tablet:` 이상)는 `HorizontalTimeline`, 미만은 `VerticalTimeline` — 둘 다 렌더하고 CSS(`hidden tablet:block` / `tablet:hidden`)로 전환해 정적 HTML 불일치를 피한다.
- [ ] **Step 7: HorizontalTimeline** — 가로 스크롤 컨테이너, 연도 눈금, 점/기간 막대는 `dateToOffset`(시작 `pxPerDay` 값은 구현자 판단, 전체 기간이 대략 화면 3~5배 폭), 줄은 `assignLanes`. 겹치는 라벨은 숨기고 `hover`/`focus-visible`에서 표시. 마운트 시 `scrollLeft = scrollWidth`(최신 일정 위치). 각 점은 `<a>`(href 있으면).
- [ ] **Step 8: VerticalTimeline** — 같은 계산으로 세로 축(`top` = offset), 라벨은 축 오른쪽에 항상 표시, 마운트 시 맨 아래(최신)로 스크롤 — 스크롤 컨테이너는 `ZutopiaScrollArea`이므로 마지막 요소 `scrollIntoView({ block: "end" })`.
- [ ] **Step 9: 검증** — `tsc`, `lint`, `pnpm test`, `pnpm build`, `out/zutopia/timeline/index.html` 존재.
- [ ] **Step 10: 커밋 (승인 후)** — `feat: 즛토피아 활동 연혁 타임라인 추가`

---

## Self-Review 메모

- 스펙 대비: 0(T0) · 1(T1) · 공통 데이터(T2) · 2(T3) · 3 저장/집계/화면/백업/이미지(T4–T7) · 4(T8) — 빠진 항목 없음.
- "곡 상세 패널 항상 표시"(T3 Step 7), "못 들은 곡 미공개·어레인지 제외"(T5/T6 Step 1), "`?lastLive=1` 새 창"(T6 Step 3), "내 참전 표시"(T8 Step 6) 포함.

---

## 다음 계획으로 넘긴 것 (2026-11-05 사용자 요청)

- **즛토피아 전체 PC 폭 확대**: 지금 모든 즛토피아 페이지가 `ZutopiaScrollArea`의 `tablet:max-w-4xl`(콘텐츠 848px)을 같이 쓴다. 근거 없이 `/info`(줄글) 설정을 가져온 값이라, PC에서 1400~1600px로 넓히고 곡·앨범·공연 목록을 넓은 화면에 맞게 다시 배치한다. 이번 계획에선 참전 기록·활동 연혁 페이지만 먼저 넓힌다(`ZutopiaScrollArea`의 넓은 경로 목록).
