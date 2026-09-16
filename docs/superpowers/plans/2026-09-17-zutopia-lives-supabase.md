# zutopia lives Supabase 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/zutopia`(허브), `/zutopia/lives`(목록), `/zutopia/lives/[slug]`(상세)의 공연 목록·메타·세트리스트를 정적 데이터 대신 Supabase(`lives`, `setlists`, `songs`)에서 가져오도록 바꾼다.

**Architecture:** `registry.ts`의 정적 `entries` 배열을 카테고리별 `getEntries()` 비동기 로더로 바꾸고, "lives" 카테고리는 새 `src/features/zutopia/lives/data.ts`(Supabase 조회)를 연결한다. 세트리스트 곡의 응원 가이드 링크는 `song-db`와 공유하는 `zutopia/guide-link.ts`로 해결한다. 티켓/사진 등 수동 콘텐츠는 이번 작업 범위 밖(필요할 때 `content.mdx`를 새로 만들면 됨).

**Tech Stack:** Next.js 16 (App Router, Turbopack, `output: "export"`), TypeScript, Supabase(`@supabase/supabase-js`), pnpm. 이 프로젝트에는 유닛 테스트가 없으므로, 각 태스크의 "테스트"는 `pnpm exec tsc --noEmit`(모듈 해석·타입 검사) + 필요한 경우 실제 Supabase에 대한 1회성 확인 스크립트로 대신한다.

**Spec:** `docs/superpowers/specs/2026-09-16-zutopia-lives-supabase-design.md`

## Global Constraints

- `tours` 테이블은 연동하지 않는다(비목표) — `lives.tour_id`는 조회하지 않는다.
- 세트리스트 곡별 영상(직캠 등) 링크는 표시하지 않는다 — 응원 가이드(`/guide/[songId]`) 링크만 붙이고, 없으면 링크 없는 일반 텍스트 행으로 표시한다.
- 티켓/사진/공지 등 수동 콘텐츠는 이번 작업에서 만들지 않는다(YAGNI) — `CONTENT_BY_KEY`는 빈 객체로 시작한다.
- Supabase `lives` 테이블에 아직 실제 데이터가 0건이므로, `/zutopia/[category]/[slug]` 라우트가 생기는 순간 `output: "export"` 빌드가 `generateStaticParams()`의 빈 배열 때문에 실패할 수 있다 — 이는 알려진 리스크이며, 최소 1건이 Supabase에 등록된 뒤에야 `pnpm run build`가 통과한다. 코드로 우회하지 않는다.
- 커밋은 태스크별로 하되, 실제 `git commit` 실행 전에는 사용자에게 커밋 메시지를 제안하고 승인받는다(이 프로젝트의 기존 규칙).
- import 경로는 이 프로젝트의 기존 컨벤션대로 `@/`로 시작하는 절대 경로를 쓴다.

---

## Task 1: `guide-link.ts`를 `song-db`에서 `zutopia` 공용 위치로 이동

**Files:**

- Move: `src/features/zutopia/song-db/guide-link.ts` → `src/features/zutopia/guide-link.ts`
- Modify: `src/features/zutopia/song-db/data.ts` (import 경로만)

**Interfaces:**

- Consumes: 없음
- Produces: `@/features/zutopia/guide-link`(`getGuideHref(slug: string): string | null`) — Task 4(`lives/data.ts`)가 이 경로를 그대로 쓴다

- [ ] **Step 1: git mv로 이동**

```bash
git mv src/features/zutopia/song-db/guide-link.ts src/features/zutopia/guide-link.ts
```

- [ ] **Step 2: `song-db/data.ts`의 import 경로 수정**

`src/features/zutopia/song-db/data.ts` 최상단의 `import { getGuideHref } from "./guide-link";`를 다음으로 교체한다:

```ts
import { getGuideHref } from "@/features/zutopia/guide-link";
```

- [ ] **Step 3: 남은 참조 확인 및 타입체크**

```bash
grep -rn "song-db/guide-link" src && echo "누락 발견!" || echo "OK: 남은 참조 없음"
pnpm exec tsc --noEmit
```

Expected: "OK: 남은 참조 없음" 출력, `tsc --noEmit` 에러 0건.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `refactor: share guide-link between song-db and lives features`

```bash
git add -A
git commit -m "refactor: share guide-link between song-db and lives features"
```

---

## Task 2: `lives/types.ts` 작성

**Files:**

- Create: `src/features/zutopia/lives/types.ts`

**Interfaces:**

- Consumes: `Database["public"]["Tables"]["lives"]["Row"]`(`@/lib/supabase/database.types`, 이미 존재)
- Produces: `Live`, `LiveSetlistEntry`, `LiveDetail` — Task 4가 이 타입들을 반환 타입으로 쓴다

- [ ] **Step 1: 파일 작성**

```ts
import type { Database } from "@/lib/supabase/database.types";

export type Live = Database["public"]["Tables"]["lives"]["Row"];

export interface LiveSetlistEntry {
  songId: string;
  title: string;
  titleKo: string;
  // 이 곡의 응원 가이드(/guide/[songId])가 있으면 그 경로, 없으면 null.
  guideHref: string | null;
}

export interface LiveDetail extends Live {
  setlist: LiveSetlistEntry[];
}
```

- [ ] **Step 2: 타입체크**

```bash
pnpm exec tsc --noEmit
```

Expected: 에러 0건.

- [ ] **Step 3: 커밋 (사용자 승인 후)**

제안 메시지: `feat: add lives feature types`

```bash
git add -A
git commit -m "feat: add lives feature types"
```

---

## Task 3: `registry.ts`에 `"event"` 타입 추가 (구조는 아직 정적 유지)

`lives/data.ts`(Task 4)가 Supabase의 `EVENT` 타입을 `ZutopiaEntryType`으로 매핑하려면 그 값이 먼저 타입에 존재해야 한다. `entries` 배열을 함수로 바꾸는 더 큰 변경(Task 5)보다 먼저, 이 작은 타입 추가만 분리해서 처리한다 — 그래야 Task 4가 그 자체로 타입체크를 통과한다.

**Files:**

- Modify: `src/features/zutopia/registry.ts`

**Interfaces:**

- Consumes: 없음
- Produces: `ZutopiaEntryType`(이제 `"concert" | "festival" | "event"`) — Task 4가 참조한다

- [ ] **Step 1: 타입/라벨/순서에 `"event"` 추가**

`src/features/zutopia/registry.ts`의 상단부를 다음으로 바꾼다(파일의 나머지 — `ZutopiaEntry`/`ZutopiaCategory`/`ZUTOPIA_CATEGORIES`/`getZutopiaCategory`/`summarizeEntryTypes` — 는 이 태스크에서 그대로 둔다):

```ts
export type ZutopiaEntryType = "concert" | "festival" | "event";

const ENTRY_TYPE_LABEL: Record<ZutopiaEntryType, string> = {
  concert: "콘서트",
  festival: "페스티벌",
  event: "행사",
};
// summarizeEntryTypes가 항상 이 순서로 보여주기 위한 목록.
const ENTRY_TYPE_ORDER: ZutopiaEntryType[] = ["concert", "festival", "event"];
```

(기존의 `export type ZutopiaEntryType = "concert" | "festival";`, `ENTRY_TYPE_LABEL`, `ENTRY_TYPE_ORDER` 세 선언을 위 세 줄로 교체하는 것 — `entries: []`를 포함한 나머지는 변경하지 않는다.)

- [ ] **Step 2: 타입체크**

```bash
pnpm exec tsc --noEmit
```

Expected: 에러 0건 (`entries`/`ZutopiaCategory` 구조는 아직 안 바꿨으므로 기존 소비자 코드도 그대로 통과해야 한다).

- [ ] **Step 3: 커밋 (사용자 승인 후)**

제안 메시지: `feat: add "event" as a zutopia entry type`

```bash
git add -A
git commit -m "feat: add \"event\" as a zutopia entry type"
```

---

## Task 4: `lives/data.ts` — `getLiveEntries`/`getLiveBySlug`

**Files:**

- Create: `src/features/zutopia/lives/data.ts`

**Interfaces:**

- Consumes: `@/lib/supabase/build-time-client`(`createBuildTimeSupabaseClient`), `@/features/zutopia/guide-link`(`getGuideHref`, Task 1), `./types`(`LiveDetail`, Task 2), `@/features/zutopia/registry`의 `ZutopiaEntry`/`ZutopiaEntryType`(Task 3에서 `"event"` 포함하도록 이미 넓혀짐)
- Produces: `getLiveEntries(): Promise<ZutopiaEntry[]>`, `getLiveBySlug(slug: string): Promise<LiveDetail | null>` — Task 5(`registry.ts`)와 Task 10(`[slug]/page.tsx`)이 그대로 가져다 쓴다

- [ ] **Step 1: 파일 작성**

```ts
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getGuideHref } from "@/features/zutopia/guide-link";
// registry.ts가 이 파일을 import하므로(Task 5, getEntries 연결), 여기서는
// 타입만 가져와 순환 참조를 피한다 — `import type`은 컴파일 시 완전히
// 제거되어 런타임 순환 require가 생기지 않는다.
import type {
  ZutopiaEntry,
  ZutopiaEntryType,
} from "@/features/zutopia/registry";
import type { LiveDetail } from "./types";

/** "2026-09-06" -> "2026년 9월 6일" (기존 정적 데이터 표기와 동일한 형식). */
function formatLiveDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

const LIVE_TYPE_TO_ENTRY_TYPE: Record<string, ZutopiaEntryType> = {
  FESTIVAL: "festival",
  CONCERT: "concert",
  EVENT: "event",
};

/** 허브/카테고리 목록 카드용 — lives 테이블에서 활성 공연만 최신순으로. */
export async function getLiveEntries(): Promise<ZutopiaEntry[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("lives")
    .select(
      "slug, title, title_ko, live_date, poster_image_url, icon_image_url, type",
    )
    .eq("status", "ACTIVE")
    .order("live_date", { ascending: false });

  if (error) {
    throw new Error(`공연 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map((live) => ({
    slug: live.slug,
    label: live.title_ko,
    name: live.title,
    date: formatLiveDate(live.live_date),
    thumbnail: live.poster_image_url ?? live.icon_image_url ?? "",
    type: LIVE_TYPE_TO_ENTRY_TYPE[live.type],
  }));
}

/**
 * 상세 페이지용 — 공연 정보 + 세트리스트(본편 먼저, 앙코르 나중, 각각
 * track_number 오름차순). 없는 슬러그는 null(호출부에서 notFound() 처리).
 */
export async function getLiveBySlug(slug: string): Promise<LiveDetail | null> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("lives")
    .select(
      "*, setlists(track_number, is_encore, songs!inner(id, slug, title, title_ko))",
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .eq("setlists.songs.status", "ACTIVE")
    .maybeSingle();

  if (error) {
    throw new Error(`공연 정보를 가져오지 못했습니다: ${error.message}`);
  }
  if (!data) return null;

  const { setlists, ...live } = data;
  const setlist = [...setlists]
    .sort(
      (a, b) =>
        Number(a.is_encore) - Number(b.is_encore) ||
        a.track_number - b.track_number,
    )
    .map((entry) => ({
      songId: entry.songs.id,
      title: entry.songs.title,
      titleKo: entry.songs.title_ko,
      guideHref: getGuideHref(entry.songs.slug),
    }));

  return { ...live, setlist };
}
```

- [ ] **Step 2: 타입체크**

```bash
pnpm exec tsc --noEmit
```

Expected: 에러 0건.

- [ ] **Step 3: 실제 Supabase로 동작 확인 (1회성 스크립트)**

`lives` 테이블에 아직 실제 데이터가 없으므로, 지금은 "에러 없이 빈 결과가 오는지"와 "존재하지 않는 slug가 null을 반환하는지"만 확인한다. 프로젝트 루트에 임시 파일을 만들어 실행하고 바로 지운다:

```bash
cat > _verify-lives-data.mjs << 'EOF'
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUB_KEY);

const { data: entries, error: e1 } = await supabase
  .from("lives")
  .select("slug, title, title_ko, live_date, poster_image_url, icon_image_url, type")
  .eq("status", "ACTIVE")
  .order("live_date", { ascending: false });
console.log("entries:", JSON.stringify(entries), "error:", e1);

const { data: one, error: e2 } = await supabase
  .from("lives")
  .select("*, setlists(track_number, is_encore, songs!inner(id, slug, title, title_ko))")
  .eq("slug", "no-such-slug")
  .eq("status", "ACTIVE")
  .eq("setlists.songs.status", "ACTIVE")
  .maybeSingle();
console.log("bySlug:", JSON.stringify(one), "error:", e2);
EOF
node _verify-lives-data.mjs
rm -f _verify-lives-data.mjs
```

Expected: 둘 다 `error: null`, `entries: []`, `bySlug: null` (테이블이 비어 있으므로). 에러가 나면 컬럼명/조인 문법을 다시 확인한다.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `feat: add Supabase-backed lives data fetchers`

```bash
git add -A
git commit -m "feat: add Supabase-backed lives data fetchers"
```

---

## Task 5: `registry.ts` — 정적 `entries`를 `getEntries()` 로더로 전환

**Files:**

- Modify: `src/features/zutopia/registry.ts` (전체 재작성 — Task 3에서 이미 넓힌 `ZutopiaEntryType` 포함)

**Interfaces:**

- Consumes: `@/features/zutopia/lives/data`(`getLiveEntries`, Task 4)
- Produces: `ZutopiaCategory`(`entries` 필드 대신 `getEntries: () => Promise<ZutopiaEntry[]>`), `getZutopiaCategory`, `summarizeEntryTypes`(시그니처 변경 없음) — Task 6~10(라우트 전부)이 `category.getEntries()`를 쓴다

- [ ] **Step 1: 전체 내용 교체**

`src/features/zutopia/registry.ts` 전체를 다음으로 바꾼다:

```ts
import { getLiveEntries } from "@/features/zutopia/lives/data";

export type ZutopiaEntryType = "concert" | "festival" | "event";

const ENTRY_TYPE_LABEL: Record<ZutopiaEntryType, string> = {
  concert: "콘서트",
  festival: "페스티벌",
  event: "행사",
};
// summarizeEntryTypes가 항상 이 순서로 보여주기 위한 목록.
const ENTRY_TYPE_ORDER: ZutopiaEntryType[] = ["concert", "festival", "event"];

export interface ZutopiaEntry {
  slug: string;
  label: string;
  name: string;
  date: string;
  thumbnail: string;
  // 허브 카드 메타 문구("N개의 콘서트, N개의 페스티벌")를 만드는 데만 쓴다.
  // 나중에 이 카테고리처럼 나뉘지 않는 대분류가 생기면 생략해도 된다.
  type?: ZutopiaEntryType;
}

export interface ZutopiaCategory {
  slug: string;
  label: string;
  description: string;
  // 허브(/zutopia) 카드 배경 이미지. entries[0]의 썸네일을 빌려 쓰면 그
  // 항목이 바뀌거나 순서가 바뀔 때 카테고리 대표 이미지도 같이 흔들리므로,
  // 카테고리 자체의 고정 이미지를 따로 둔다.
  image?: string;
  // 카테고리 안의 항목 목록을 가져오는 함수. "lives"처럼 Supabase 등
  // 외부 데이터 소스를 쓸 수 있어 비동기다.
  getEntries: () => Promise<ZutopiaEntry[]>;
}

// 즛토피아는 "지난 공연" 말고도 나중에 다른 대분류(예: 굿즈, 디스코그래피 등)가
// 늘어날 수 있어서, 카테고리 하나 아래에 항목들이 딸리는 2단 구조로 둡니다.
// URL도 그대로 /zutopia/<카테고리 슬러그>/<항목 슬러그>가 됩니다.
//
// 새 카테고리를 추가할 땐 이 배열에 { slug, label, description, getEntries }를
// 하나 더하면 됩니다. 카테고리 안에 새 항목을 추가할 땐(예: Supabase에 공연을
// 추가) 목록/탭에는 바로 나타나지만, 사진/공지 등 수동 콘텐츠가 필요하면
// [category]/[slug]/page.tsx의 CONTENT_BY_KEY에도 등록해야 상세 페이지가
// 보입니다.
export const ZUTOPIA_CATEGORIES: ZutopiaCategory[] = [
  {
    slug: "lives",
    label: "지난 공연",
    description: "공연 및 세트리스트 정보",
    image: "/assets/zutopia/components/lives.webp",
    getEntries: getLiveEntries,
  },
];

export function getZutopiaCategory(slug: string): ZutopiaCategory | undefined {
  return ZUTOPIA_CATEGORIES.find((category) => category.slug === slug);
}

// 허브 카드 메타 문구를 만든다. entries에 type이 하나라도 있으면 타입별
// 개수로("N개의 콘서트, N개의 페스티벌"), 없으면("굿즈" 같은 나중 카테고리)
// 기존처럼 "N개 항목"으로 돌아간다.
export function summarizeEntryTypes(entries: ZutopiaEntry[]): string {
  const counts = new Map<ZutopiaEntryType, number>();
  for (const entry of entries) {
    if (!entry.type) continue;
    counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return `${entries.length}개 항목`;
  }

  return ENTRY_TYPE_ORDER.filter((type) => counts.has(type))
    .map((type) => `${counts.get(type)}개의 ${ENTRY_TYPE_LABEL[type]}`)
    .join(", ");
}
```

- [ ] **Step 2: 타입체크 (아직 소비자들이 옛 `entries` 필드를 쓰므로 에러가 나는 게 정상)**

```bash
pnpm exec tsc --noEmit
```

Expected: `src/app/(pages)/zutopia/page.tsx`, `[category]/layout.tsx`, `[category]/page.tsx`, `ZutopiaCategoryTabs.tsx`에서 `category.entries` 관련 타입 에러가 나야 한다 — 이 에러들은 Task 6~8에서 해소한다. 여기서는 registry.ts 자체의 새 코드에 문법/타입 오류가 없는지만 확인하면 된다(위 파일들의 에러 메시지가 전부 "entries 없음/getEntries 관련"인지 눈으로 훑어 확인).

- [ ] **Step 3: 커밋은 하지 않는다**

이 태스크 단독으로는 빌드가 깨진 상태다 — Task 8까지 마친 뒤 한 번에 커밋한다(아래 Task 8의 커밋 스텝 참고).

---

## Task 6: `ZutopiaCategoryTabs` — resolve된 entries를 props로 받도록 변경

**Files:**

- Modify: `src/features/zutopia/components/ZutopiaCategoryTabs.tsx`
- Modify: `src/app/(pages)/zutopia/[category]/layout.tsx`

**Interfaces:**

- Consumes: `ZutopiaEntry[]`(Task 5)
- Produces: `ZutopiaCategoryTabs({ categorySlug, categoryLabel, entries })` — `category` 객체 대신 이미 resolve된 값들을 받는다

- [ ] **Step 1: `ZutopiaCategoryTabs.tsx` 수정**

전체를 다음으로 바꾼다:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ZutopiaEntry } from "@/features/zutopia/registry";
import { ACTIVE_TAB_CLASS, TAB_CLASS } from "./tab-styles";

/**
 * [category]/layout.tsx의 탭 nav. 현재 어느 탭에 있는지(전체 목록 vs 특정
 * 항목) 시각적으로/aria-current로 표시하려면 현재 경로가 필요한데,
 * [category]/layout.tsx는 metadata를 export하는 서버 컴포넌트라
 * usePathname을 쓸 수 없어서 이 부분만 클라이언트 컴포넌트로 분리했습니다.
 *
 * entries는 카테고리에 따라 정적/Supabase 등 출처가 다를 수 있어 이 부모가
 * 이미 await로 resolve한 배열을 그대로 props로 받습니다.
 */
export function ZutopiaCategoryTabs({
  categorySlug,
  categoryLabel,
  entries,
}: {
  categorySlug: string;
  categoryLabel: string;
  entries: ZutopiaEntry[];
}) {
  const pathname = usePathname();
  const allHref = `/zutopia/${categorySlug}`;
  const isAllActive = pathname === allHref;

  return (
    <nav
      aria-label={categoryLabel}
      className="mt-3 flex flex-wrap gap-2 border-b border-white/10 pb-4"
    >
      <Link
        href={allHref}
        aria-current={isAllActive ? "page" : undefined}
        className={cn(TAB_CLASS, isAllActive && ACTIVE_TAB_CLASS)}
      >
        전체
      </Link>
      {entries.map((entry) => {
        const href = `/zutopia/${categorySlug}/${entry.slug}`;
        const isActive = pathname === href;
        return (
          <Link
            key={entry.slug}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(TAB_CLASS, isActive && ACTIVE_TAB_CLASS)}
          >
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: `[category]/layout.tsx` 수정**

전체를 다음으로 바꾼다:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getZutopiaCategory } from "@/features/zutopia/registry";
import { ZutopiaCategoryTabs } from "@/features/zutopia/components/ZutopiaCategoryTabs";
import { ZutopiaSectionHeader } from "@/features/zutopia/components/ZutopiaSectionHeader";

export async function generateMetadata(
  props: LayoutProps<"/zutopia/[category]">,
): Promise<Metadata> {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) return {};

  return {
    title: category.label,
    description: category.description,
  };
}

/**
 * 카테고리 하나(예: "지난 공연") 안에서 목록 페이지와 항목 상세 페이지가
 * 공유하는 레이아웃 — 탭처럼 보이는 nav로 그 카테고리 안의 항목들을
 * 전환합니다. 항목마다 실제 URL(/zutopia/[category]/[slug])이 따로 있는
 * "독립 라우트" 구조라, 북마크/공유가 그대로 되고 항목별 SEO 메타데이터도
 * 분리됩니다.
 */
export default async function ZutopiaCategoryLayout(
  props: LayoutProps<"/zutopia/[category]">,
) {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) notFound();

  const entries = await category.getEntries();

  return (
    <div>
      <ZutopiaSectionHeader
        title={category.label}
        description={category.description}
      />

      <ZutopiaCategoryTabs
        categorySlug={category.slug}
        categoryLabel={category.label}
        entries={entries}
      />

      <div className="mt-8">{props.children}</div>
    </div>
  );
}
```

- [ ] **Step 3: 타입체크**

```bash
pnpm exec tsc --noEmit
```

Expected: `ZutopiaCategoryTabs.tsx`/`[category]/layout.tsx` 관련 에러는 사라져야 한다 (`[category]/page.tsx`, `zutopia/page.tsx`의 `category.entries` 에러는 아직 남아있는 게 정상 — Task 7/8에서 해소).

---

## Task 7: `[category]/page.tsx` — 목록 페이지를 `getEntries()` 기반으로

**Files:**

- Modify: `src/app/(pages)/zutopia/[category]/page.tsx`

**Interfaces:**

- Consumes: `category.getEntries()`(Task 5)
- Produces: 없음(리프 페이지)

- [ ] **Step 1: 전체 내용 교체**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ZUTOPIA_CATEGORIES,
  getZutopiaCategory,
} from "@/features/zutopia/registry";

export function generateStaticParams() {
  return ZUTOPIA_CATEGORIES.map((category) => ({ category: category.slug }));
}

export default async function ZutopiaCategoryPage(
  props: PageProps<"/zutopia/[category]">,
) {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) notFound();

  const entries = await category.getEntries();

  if (entries.length === 0) {
    return (
      <p className={cn("text-base text-white/50", "tablet:text-lg")}>
        아직 등록된 항목이 없습니다.
      </p>
    );
  }

  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
      {entries.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/zutopia/${category.slug}/${entry.slug}`}
            className="group block overflow-hidden rounded-lg bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.thumbnail}
              alt={entry.name}
              loading="lazy"
              className="aspect-video w-full object-cover transition-opacity group-hover:opacity-80"
            />
            <div className="p-4">
              <p className="hover:text-ztmy-pink text-lg font-semibold text-white transition-colors">
                {entry.label}
              </p>
              <p className="mt-1 text-sm text-white/50">{entry.date}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: 타입체크**

```bash
pnpm exec tsc --noEmit
```

Expected: 이 파일 관련 에러는 사라져야 한다 (`zutopia/page.tsx`의 에러만 아직 남아있는 게 정상 — Task 8에서 해소).

---

## Task 8: `/zutopia/page.tsx` — 허브 페이지 카드 메타를 `getEntries()` 기반으로

**Files:**

- Modify: `src/app/(pages)/zutopia/page.tsx`

**Interfaces:**

- Consumes: `category.getEntries()`(Task 5), `summarizeEntryTypes`(registry.ts, 시그니처 변경 없음)
- Produces: 없음(리프 페이지)

- [ ] **Step 1: 전체 내용 교체**

```tsx
import { cn } from "@/lib/utils";
import { ARTIST } from "@/data/artist";
import {
  ZUTOPIA_CATEGORIES,
  summarizeEntryTypes,
} from "@/features/zutopia/registry";
import { ZutopiaHubCard } from "@/features/zutopia/components/ZutopiaHubCard";
import { ZutopiaSectionHeader } from "@/features/zutopia/components/ZutopiaSectionHeader";
import { getSongsCount, getAlbumsCount } from "@/features/zutopia/song-db/data";

export default async function ZutopiaHubPage() {
  const [songCount, albumCount, categoryCards] = await Promise.all([
    getSongsCount(),
    getAlbumsCount(),
    Promise.all(
      ZUTOPIA_CATEGORIES.map(async (category) => ({
        category,
        entries: await category.getEntries(),
      })),
    ),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <ZutopiaSectionHeader
        title="ZUTOPIA"
        description={`${ARTIST.name.jp} 기록 저장소`}
      />

      <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
        <li>
          <ZutopiaHubCard
            href="/zutopia/songs"
            title="디스코그래피"
            description="전체 곡과 앨범 목록"
            meta={`${songCount}곡 · ${albumCount}개 앨범`}
            imageUrl="/assets/zutopia/components/song_db.webp"
          />
        </li>

        {categoryCards.map(({ category, entries }) => (
          <li key={category.slug}>
            <ZutopiaHubCard
              href={`/zutopia/${category.slug}`}
              title={category.label}
              description={category.description}
              meta={summarizeEntryTypes(entries)}
              imageUrl={category.image}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: 타입체크 — 이 시점에 Task 5~8 전체가 깨끗해야 함**

```bash
pnpm exec tsc --noEmit
pnpm run lint
```

Expected: 둘 다 에러 0건.

- [ ] **Step 3: 포맷팅**

```bash
pnpm exec prettier --write \
  src/features/zutopia/registry.ts \
  src/features/zutopia/components/ZutopiaCategoryTabs.tsx \
  "src/app/(pages)/zutopia/[category]/layout.tsx" \
  "src/app/(pages)/zutopia/[category]/page.tsx" \
  "src/app/(pages)/zutopia/page.tsx"
```

- [ ] **Step 4: 커밋 (사용자 승인 후) — Task 5~8을 한 번에**

제안 메시지: `refactor: make zutopia category entries load asynchronously`

```bash
git add -A
git commit -m "refactor: make zutopia category entries load asynchronously"
```

---

## Task 9: `lives/SongLink.tsx` — 세트리스트 한 줄 컴포넌트 (공유, href optional)

**Files:**

- Create: `src/features/zutopia/lives/SongLink.tsx`

**Interfaces:**

- Consumes: `@/lib/utils`(`cn`), `@/components/SiteLink`(`SiteLink`)
- Produces: `SongLink({ href, index, children })` — 새 공연의 `content.mdx`가 세트리스트를 그릴 때 이 컴포넌트를 쓴다(지금 당장 참조하는 곳은 없음 — Supabase에 공연이 추가되고 그 공연의 content.mdx가 만들어질 때 쓰인다)

- [ ] **Step 1: 파일 작성**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";

const indexBadgeClass = cn(
  "w-6 shrink-0 font-mono text-xs tabular-nums",
  "text-white/30",
);

const songLinkClass = cn(
  "group flex w-full items-center gap-3 px-4 py-2.5 no-underline transition-colors",
  "text-sm text-white/80 hover:bg-white/5 hover:text-white",
  "tablet:text-base",
);

const songTextClass = cn(
  "flex w-full items-center gap-3 px-4 py-2.5",
  "text-sm text-white/60",
  "tablet:text-base",
);

/**
 * 세트리스트 트랙 한 줄 — 번호 + 제목. 응원 가이드(guideHref)가 있는 곡만
 * 링크로 만들고(SiteLink가 외부 링크 아이콘까지 자동으로 붙임), 없는 곡은
 * 링크 없는 일반 텍스트 행으로 보여준다(Supabase setlists 스키마에 곡별
 * 영상 링크가 없어서, 가이드 링크가 유일한 후보다).
 */
export function SongLink({
  href,
  index,
  children,
}: {
  href?: string | null;
  index: number;
  children: ReactNode;
}) {
  const number = String(index).padStart(2, "0");

  if (!href) {
    return (
      <span className={songTextClass}>
        <span className={indexBadgeClass}>{number}</span>
        <span className="flex-1">{children}</span>
      </span>
    );
  }

  return (
    <SiteLink href={href} className={songLinkClass}>
      <span className={cn(indexBadgeClass, "group-hover:text-white/50")}>
        {number}
      </span>
      <span className="flex-1">{children}</span>
    </SiteLink>
  );
}
```

- [ ] **Step 2: 타입체크 및 포맷**

```bash
pnpm exec tsc --noEmit
pnpm exec prettier --write src/features/zutopia/lives/SongLink.tsx
```

Expected: 에러 0건.

- [ ] **Step 3: 커밋 (사용자 승인 후)**

제안 메시지: `feat: add shared setlist row component for lives content`

```bash
git add -A
git commit -m "feat: add shared setlist row component for lives content"
```

---

## Task 10: `[category]/[slug]/page.tsx` 재생성 — lives 상세 페이지

**Files:**

- Create: `src/app/(pages)/zutopia/[category]/[slug]/page.tsx` (sound-planet-2026 정리 과정에서 삭제된 라우트 — 여기서 다시 만든다)

**Interfaces:**

- Consumes: `getZutopiaCategory`, `ZUTOPIA_CATEGORIES`(registry.ts), `getLiveBySlug`(Task 4), `LiveDetail`(Task 2)
- Produces: 없음(리프 페이지). 새 공연의 `content.mdx`를 만들 때는 `CONTENT_BY_KEY`에 `"lives/<슬러그>": Component` 형태로 등록하면 된다.

- [ ] **Step 1: 파일 작성**

```tsx
import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import {
  ZUTOPIA_CATEGORIES,
  getZutopiaCategory,
} from "@/features/zutopia/registry";
import { getLiveBySlug } from "@/features/zutopia/lives/data";
import type { LiveDetail } from "@/features/zutopia/lives/types";

// 공연/항목마다 MDX 콘텐츠 구조(어떤 섹션이 있는지 등)가 다를 수 있어서, 억지로
// 공통 템플릿화하지 않고 "카테고리/항목" 슬러그로 MDX 파일을 매핑합니다. 새
// 항목을 추가할 땐 이 맵에 한 줄만 더하면 됩니다.
//
// 주의: Supabase에 새 공연을 추가하면 /zutopia/lives 목록과 탭에는 바로
// 나타나지만, 여기 등록하기 전까진 상세 페이지는 404입니다 — 최소한 이
// 세트리스트만 보여주는 content.mdx라도 만들어 등록해야 합니다.
const CONTENT_BY_KEY: Record<string, ComponentType<{ live: LiveDetail }>> = {};

export async function generateStaticParams() {
  const paramsByCategory = await Promise.all(
    ZUTOPIA_CATEGORIES.map(async (category) => {
      const entries = await category.getEntries();
      return entries.map((entry) => ({
        category: category.slug,
        slug: entry.slug,
      }));
    }),
  );
  return paramsByCategory.flat();
}

export async function generateMetadata(
  props: PageProps<"/zutopia/[category]/[slug]">,
): Promise<Metadata> {
  const { category: categorySlug, slug } = await props.params;
  const category = getZutopiaCategory(categorySlug);
  if (!category) return {};

  const live = await getLiveBySlug(slug);
  if (!live) return {};

  return {
    title: `${live.title_ko} | ${category.label}`,
    description: `${live.title} 아카이브.`,
  };
}

export default async function ZutopiaEntryPage(
  props: PageProps<"/zutopia/[category]/[slug]">,
) {
  const { category: categorySlug, slug } = await props.params;
  const category = getZutopiaCategory(categorySlug);
  if (!category) notFound();

  const live = await getLiveBySlug(slug);
  if (!live) notFound();

  const Content = CONTENT_BY_KEY[`${categorySlug}/${slug}`];
  if (!Content) notFound();

  return <Content live={live} />;
}
```

- [ ] **Step 2: 타입체크 및 lint**

```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm exec prettier --write "src/app/(pages)/zutopia/[category]/[slug]/page.tsx"
```

Expected: 둘 다 에러 0건.

- [ ] **Step 3: 프로덕션 빌드 시도 — 실패가 정상일 수 있음**

```bash
rm -rf .next
pnpm run build
```

Expected 두 가지 경우:

- Supabase `lives`에 아직 활성 공연이 0건이면, `generateStaticParams()`가 빈 배열을 반환해 `/zutopia/[category]/[slug]`에서 `output: "export"` 빌드가 **실패한다 — 이것이 정상**이다(Global Constraints에 명시된 알려진 리스크). 에러 메시지가 "returned an empty array from generateStaticParams()"인지 확인하고, 다른 원인의 에러가 아닌지만 확인한다.
- Supabase `lives`에 활성 공연이 1건 이상 있으면 빌드가 통과해야 한다. 이 경우 해당 공연의 상세 페이지는 `CONTENT_BY_KEY`에 등록된 게 없으므로 404가 되는 게 맞다(수동 콘텐츠는 비목표) — `/zutopia/lives`에서 카드/탭까지는 정상 노출되는지 dev 서버로 확인한다.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

제안 메시지: `feat: recreate zutopia lives detail route backed by Supabase`

```bash
git add -A
git commit -m "feat: recreate zutopia lives detail route backed by Supabase"
```

---

## Self-Review 체크리스트 (계획 작성자용, 완료함)

- **스펙 커버리지:** 스펙의 "데이터 흐름" 5개 절(lives 목록, lives 상세, guide-link 공유, registry.ts 변경, 라우트 변경) 전부 Task 1~8, 10에 포함됨. "세트리스트 렌더링 컴포넌트" 절은 Task 9. "에러 처리" 절(Supabase 에러 시 한국어 Error, null 반환 시 notFound)은 Task 4/10 코드에 반영됨. "검증 계획"의 tsc/lint/build 3개는 각 태스크 + Task 10에 반영됨.
- **비목표 침범 없음:** `tours` 미조회, 세트리스트 영상 링크 없음, `CONTENT_BY_KEY` 빈 채로 시작 — Global Constraints와 Task 10에 명시.
- **순서 문제 수정:** 최초 초안에서는 Task "lives/data.ts 작성"이 `ZutopiaEntryType`에 `"event"`가 추가되기 전에 그 값을 참조해 그 자체로 타입체크에 실패했다 — Task 3(타입만 먼저 추가)을 분리해 lives/data.ts(Task 4) 전에 배치함으로써 각 태스크가 독립적으로 `tsc --noEmit`을 통과하도록 고쳤다.
- **플레이스홀더 스캔:** "TBD"/"나중에" 문구 없음. 모든 step에 실행 가능한 실제 코드/명령어 있음.
- **타입 일관성:** `ZutopiaEntry`(Task 5)의 필드명(`slug/label/name/date/thumbnail/type`)이 `getLiveEntries`(Task 4)의 반환 객체와 정확히 일치. `LiveDetail`(Task 2)의 `setlist: LiveSetlistEntry[]`가 `getLiveBySlug`(Task 4)의 반환값과 일치. `ZutopiaCategoryTabs`의 새 props(`categorySlug`/`categoryLabel`/`entries`)가 Task 6의 `[category]/layout.tsx` 호출부와 일치.
