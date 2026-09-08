# 노래 DB 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 즛토피아 허브 페이지(`/zutopia`)에 "노래 DB" 카드/버튼을 추가하고, `/zutopia/songs`에서 곡 목록과 앨범 목록을 탭으로 전환해 보여주는 정적 페이지를 만든다.

**Architecture:** `output: "export"` 정적 사이트라 런타임 API가 없다 — Supabase 호출은 `@supabase/supabase-js`로 빌드 타임(서버 컴포넌트)에만 한 번 실행하고, 결과를 정적 HTML로 굽는다. `songs`/`albums`/`song_albums` 테이블을 PostgREST 임베딩으로 조인해서 곡별 소속 앨범, 앨범별 수록곡을 한 번의 요청으로 가져온다.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`), React 19, TypeScript, `@supabase/supabase-js`(신규), Tailwind CSS v4.

**Spec:** [docs/superpowers/specs/2026-09-08-song-db-page-design.md](../specs/2026-09-08-song-db-page-design.md) — 이 문서와 [docs/superpowers/plans/new-features.md](new-features.md) 6.2/6.3/6.5절이 스키마와 설계의 기준(source of truth)이다.

## Global Constraints

- `output: "export"`라 런타임 API 라우트 없음 — Supabase 호출은 서버 컴포넌트(`page.tsx`)에서 빌드 타임에만 실행한다. 클라이언트 컴포넌트에서 직접 fetch하지 않는다.
- 이 저장소엔 자동화 테스트 프레임워크가 없다(Vitest/Jest 미설치, 기존 테스트 파일 0개). 이 플랜은 새 테스트 러너를 도입하지 않고(범위 밖), 각 태스크를 `pnpm exec tsc --noEmit`(타입 체크) + 최종 태스크의 `pnpm build`(실제 Supabase 호출을 포함한 정적 빌드)로 검증한다.
- 이미 떠 있는 dev 서버(보통 `localhost:3000`)를 절대 재시작/종료하지 않는다 — Next 16.3+는 프로젝트당 서버 하나만 허용한다. 페이지 렌더 확인은 그 서버에 read-only `curl`로 한다. 서버가 전혀 안 떠 있으면 `pnpm dev`로 새로 띄운다(기존 서버를 죽이거나 다른 포트로 재실행하지 않는다).
- Tailwind 반응형 variant(`tablet:`/`pc:`/`wide:`)는 base 클래스와 한 문자열에 섞지 않고 `cn()`의 별도 인자(별도 줄)로 분리한다.
- `<img>` 태그를 쓸 때는 `// eslint-disable-next-line @next/next/no-img-element` 주석을 붙인다 — 기존 `src/app/(pages)/zutopia/[category]/page.tsx`와 동일한 패턴이며, 이 페이지에서 `next/image`는 쓰지 않는다.
- 커밋 전 `pnpm format`을 실행한다.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUB_KEY` 환경변수는 이미 `.env.local`에 있다(재설정 불필요). Cloudflare Pages 빌드 환경에 같은 값을 설정하는 것은 배포 전 체크리스트로, 이 플랜 범위 밖이다.
- `song_albums`엔 트랙 순서 컬럼이 없다 — 앨범 안 수록곡은 곡 제목 가나다순으로 정렬한다.
- `book_image_urls`는 이 페이지에서 쓰지 않는다.

---

### Task 1: 스펙/설계 문서 커밋

브레인스토밍 세션에서 이미 작성됐지만 아직 커밋 안 된 문서 두 개를 커밋한다. 코드 변경 없음.

**Files:**

- Modify: `docs/superpowers/plans/new-features.md`
- Create(이미 작성됨): `docs/superpowers/specs/2026-09-08-song-db-page-design.md`

- [ ] **Step 1: 변경 내용 확인**

Run: `git status && git diff docs/superpowers/plans/new-features.md`
Expected: 위 두 파일만 변경/신규 상태로 표시됨.

- [ ] **Step 2: 커밋**

```bash
git add docs/superpowers/plans/new-features.md docs/superpowers/specs/2026-09-08-song-db-page-design.md
git commit -m "docs: 노래 DB 스키마 반영 및 설계 문서 추가"
```

---

### Task 2: Supabase 빌드타임 클라이언트

`@supabase/supabase-js`를 추가하고, 코드 생성 없이 손으로 작성한 `Database` 타입으로 `songs`/`albums`/`song_albums` 조회에 대한 컴파일 타임 타입 안전성을 확보한다(임베딩 관계 포함).

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/lib/supabase/database.types.ts`
- Create: `src/lib/supabase/build-time-client.ts`

**Interfaces:**

- Produces: `Database` 타입(`src/lib/supabase/database.types.ts`), `createBuildTimeSupabaseClient(): SupabaseClient<Database>`(`src/lib/supabase/build-time-client.ts`) — Task 3에서 사용.

- [ ] **Step 1: 의존성 추가**

Run: `pnpm add @supabase/supabase-js`

- [ ] **Step 2: `Database` 타입 작성**

`src/lib/supabase/database.types.ts`:

```ts
export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string;
          title: string;
          title_ko: string | null;
          cover_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          title_ko?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          title_ko?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          title: string;
          title_ko: string | null;
          album_type: "full" | "mini" | "ep" | null;
          album_number: number | null;
          release_date: string;
          cover_image_url: string | null;
          book_image_urls: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          title_ko?: string | null;
          album_type?: "full" | "mini" | "ep" | null;
          album_number?: number | null;
          release_date: string;
          cover_image_url?: string | null;
          book_image_urls?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          title_ko?: string | null;
          album_type?: "full" | "mini" | "ep" | null;
          album_number?: number | null;
          release_date?: string;
          cover_image_url?: string | null;
          book_image_urls?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      song_albums: {
        Row: {
          song_id: string;
          album_id: string;
        };
        Insert: {
          song_id: string;
          album_id: string;
        };
        Update: {
          song_id?: string;
          album_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "song_albums_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "song_albums_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
```

`song_albums`의 `Relationships`가 `songs`/`albums` 쪽 컬럼을 가리키기 때문에, 나중에
`supabase.from("songs").select("*, song_albums(albums(*))")`처럼 반대 방향(자식 →
부모) 임베딩을 해도 타입이 정확히 해석된다 — 코드젠 없이 손으로 쓸 때도 FK가 있는
쪽(`song_albums`)에만 관계를 선언하면 된다.

- [ ] **Step 3: 빌드타임 클라이언트 작성**

`src/lib/supabase/build-time-client.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * 빌드 타임(정적 export 생성 시)에만 호출하는 Supabase 클라이언트.
 * output: "export"라 런타임 서버가 없으므로, 이 함수는 서버 컴포넌트의
 * 최상위(page.tsx)에서만 호출해야 하며 클라이언트 컴포넌트로 전달하면 안 된다.
 */
export function createBuildTimeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUB_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUB_KEY 환경변수가 필요합니다 (빌드 타임 데이터 페칭용).",
    );
  }

  return createClient<Database>(url, key);
}
```

- [ ] **Step 4: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add package.json pnpm-lock.yaml src/lib/supabase/database.types.ts src/lib/supabase/build-time-client.ts
git commit -m "feat: add supabase build-time client for zutopia song db"
```

---

### Task 3: 노래 DB 도메인 타입 + 데이터 페칭 함수

**Files:**

- Create: `src/features/zutopia/song-db/types.ts`
- Create: `src/features/zutopia/song-db/data.ts`

**Interfaces:**

- Consumes: `createBuildTimeSupabaseClient()`(Task 2, `@/lib/supabase/build-time-client`), `Database`(Task 2, `@/lib/supabase/database.types`)
- Produces: `Song`, `Album`, `SongWithAlbums`, `AlbumWithSongs` 타입, `getSongsWithAlbums(): Promise<SongWithAlbums[]>`, `getAlbumsWithSongs(): Promise<AlbumWithSongs[]>` — Task 6(page.tsx)에서 사용.

- [ ] **Step 1: 타입 작성**

`src/features/zutopia/song-db/types.ts`:

```ts
import type { Database } from "@/lib/supabase/database.types";

export type Song = Database["public"]["Tables"]["songs"]["Row"];
export type Album = Database["public"]["Tables"]["albums"]["Row"];

export interface SongWithAlbums extends Song {
  albums: Album[];
}

export interface AlbumWithSongs extends Album {
  songs: Song[];
}
```

- [ ] **Step 2: 데이터 페칭 함수 작성**

`src/features/zutopia/song-db/data.ts`:

```ts
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

export async function getSongsWithAlbums(): Promise<SongWithAlbums[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select(
      "id, title, title_ko, cover_image_url, created_at, song_albums(albums(*))",
    )
    .order("title");

  if (error) {
    throw new Error(`곡 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...song }) => ({
    ...song,
    albums: song_albums.map((row) => row.albums),
  }));
}

export async function getAlbumsWithSongs(): Promise<AlbumWithSongs[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*, song_albums(songs(*))")
    .order("release_date");

  if (error) {
    throw new Error(`앨범 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...album }) => ({
    ...album,
    songs: song_albums
      .map((row) => row.songs)
      .sort((a, b) => a.title.localeCompare(b.title)),
  }));
}
```

- [ ] **Step 3: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음. (실제 네트워크 호출 동작 확인은 Task 6에서 페이지와 함께 진행한다 — 이 두 함수만 단독으로 실행할 수 있는 테스트 러너가 이 저장소엔 없다.)

- [ ] **Step 4: 커밋**

```bash
git add src/features/zutopia/song-db/types.ts src/features/zutopia/song-db/data.ts
git commit -m "feat: add song db data fetching functions"
```

---

### Task 4: SongListView 컴포넌트

곡 카드 그리드. 인터랙션이 없으므로 서버 컴포넌트로 둔다.

**Files:**

- Create: `src/features/zutopia/song-db/SongListView.tsx`

**Interfaces:**

- Consumes: `SongWithAlbums`(Task 3, `./types`)
- Produces: `SongListView({ songs }: { songs: SongWithAlbums[] })` — Task 6에서 사용.

- [ ] **Step 1: 컴포넌트 작성**

`src/features/zutopia/song-db/SongListView.tsx`:

```tsx
import { cn } from "@/lib/utils";
import type { SongWithAlbums } from "./types";

const ALBUM_TYPE_LABEL: Record<string, string> = {
  full: "정규",
  mini: "미니",
  ep: "EP",
};

export function SongListView({ songs }: { songs: SongWithAlbums[] }) {
  if (songs.length === 0) {
    return <p className="text-sm text-white/50">아직 등록된 곡이 없습니다.</p>;
  }

  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2", "wide:grid-cols-3")}>
      {songs.map((song) => (
        <li
          key={song.id}
          className="flex gap-3 rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          {song.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.cover_image_url}
              alt={song.title}
              loading="lazy"
              className="size-16 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="size-16 shrink-0 rounded bg-white/5" aria-hidden />
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">
              {song.title}
            </p>
            {song.title_ko && (
              <p className="truncate text-sm text-white/50">{song.title_ko}</p>
            )}

            {song.albums.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {song.albums.map((album) => (
                  <li
                    key={album.id}
                    className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-white/60"
                  >
                    {album.album_type
                      ? `${ALBUM_TYPE_LABEL[album.album_type]} · `
                      : ""}
                    {album.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/features/zutopia/song-db/SongListView.tsx
git commit -m "feat: add song list view for song db page"
```

---

### Task 5: AlbumListView 컴포넌트

앨범 카드 그리드. 카드를 펼치면 수록곡이 보이는 토글 상태가 필요해 클라이언트 컴포넌트로 둔다.

**Files:**

- Create: `src/features/zutopia/song-db/AlbumListView.tsx`

**Interfaces:**

- Consumes: `AlbumWithSongs`(Task 3, `./types`)
- Produces: `AlbumListView({ albums }: { albums: AlbumWithSongs[] })` — Task 6에서 사용.

- [ ] **Step 1: 컴포넌트 작성**

`src/features/zutopia/song-db/AlbumListView.tsx`:

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AlbumWithSongs } from "./types";

const ALBUM_TYPE_LABEL: Record<string, string> = {
  full: "정규",
  mini: "미니",
  ep: "EP",
};

export function AlbumListView({ albums }: { albums: AlbumWithSongs[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (albums.length === 0) {
    return (
      <p className="text-sm text-white/50">아직 등록된 앨범이 없습니다.</p>
    );
  }

  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
      {albums.map((album) => {
        const isOpen = openId === album.id;
        return (
          <li
            key={album.id}
            className="overflow-hidden rounded-lg border border-white/10 bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : album.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              {album.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={album.cover_image_url}
                  alt={album.title}
                  loading="lazy"
                  className="size-16 shrink-0 rounded object-cover"
                />
              ) : (
                <div
                  className="size-16 shrink-0 rounded bg-white/5"
                  aria-hidden
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">
                  {album.album_type
                    ? `[${ALBUM_TYPE_LABEL[album.album_type]}] `
                    : ""}
                  {album.title}
                </p>
                {album.title_ko && (
                  <p className="truncate text-sm text-white/50">
                    {album.title_ko}
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-white/40">
                  {album.release_date}
                </p>
              </div>
            </button>

            {isOpen && (
              <ul className="border-t border-white/10 px-4 py-3">
                {album.songs.length === 0 ? (
                  <li className="text-sm text-white/40">
                    수록곡 정보가 없습니다.
                  </li>
                ) : (
                  album.songs.map((song) => (
                    <li key={song.id} className="py-1 text-sm text-white/70">
                      {song.title}
                      {song.title_ko && (
                        <span className="ml-2 text-white/40">
                          {song.title_ko}
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/features/zutopia/song-db/AlbumListView.tsx
git commit -m "feat: add album list view for song db page"
```

---

### Task 6: SongDbTabs + `/zutopia/songs` 라우트

곡/앨범 탭 전환 컨테이너와, 빌드 타임에 두 목록을 가져와 그대로 내려주는 페이지.

**Files:**

- Create: `src/features/zutopia/song-db/SongDbTabs.tsx`
- Create: `src/app/(pages)/zutopia/songs/page.tsx`

**Interfaces:**

- Consumes: `SongListView`(Task 4), `AlbumListView`(Task 5), `getSongsWithAlbums`/`getAlbumsWithSongs`(Task 3)
- Produces: `/zutopia/songs` 라우트 — Task 7에서 링크로 연결.

- [ ] **Step 1: 탭 컨테이너 작성**

`src/features/zutopia/song-db/SongDbTabs.tsx`:

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlbumListView } from "./AlbumListView";
import { SongListView } from "./SongListView";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

type Tab = "songs" | "albums";

const tabClass =
  "hover:border-ztmy-magenta/60 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white";
const activeTabClass = "border-ztmy-magenta/60 text-white";

export function SongDbTabs({
  songs,
  albums,
}: {
  songs: SongWithAlbums[];
  albums: AlbumWithSongs[];
}) {
  const [tab, setTab] = useState<Tab>("songs");

  return (
    <div>
      <div
        role="tablist"
        aria-label="노래 DB"
        className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "songs"}
          onClick={() => setTab("songs")}
          className={cn(tabClass, tab === "songs" && activeTabClass)}
        >
          곡 ({songs.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "albums"}
          onClick={() => setTab("albums")}
          className={cn(tabClass, tab === "albums" && activeTabClass)}
        >
          앨범 ({albums.length})
        </button>
      </div>

      <div className="mt-8">
        {tab === "songs" ? (
          <SongListView songs={songs} />
        ) : (
          <AlbumListView albums={albums} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 페이지 라우트 작성**

`src/app/(pages)/zutopia/songs/page.tsx`:

```tsx
import type { Metadata } from "next";
import {
  getAlbumsWithSongs,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { SongDbTabs } from "@/features/zutopia/song-db/SongDbTabs";

export const metadata: Metadata = {
  title: "노래 DB",
  description: "즛토마요 전체 곡과 앨범 목록입니다.",
};

export default async function ZutopiaSongDbPage() {
  const [songs, albums] = await Promise.all([
    getSongsWithAlbums(),
    getAlbumsWithSongs(),
  ]);

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
        노래 DB
      </p>

      <div className="mt-3">
        <SongDbTabs songs={songs} albums={albums} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 에러 없음.

- [ ] **Step 4: 개발 서버로 실제 렌더 확인**

이미 떠 있는 dev 서버가 있으면 그대로 쓰고, 없으면 `pnpm dev`로 새로 띄운다(기존 서버 재시작 금지).

Run: `curl -s http://localhost:3000/zutopia/songs | grep -o "노래 DB"`
Expected: `노래 DB` 출력(빌드 타임 Supabase 호출이 에러 없이 끝나 페이지가 렌더됐다는 뜻). 곡/앨범 테이블이 아직 비어 있으면 "아직 등록된 곡이 없습니다" 문구가 보이는 것도 정상이다.

- [ ] **Step 5: 커밋**

```bash
git add src/features/zutopia/song-db/SongDbTabs.tsx "src/app/(pages)/zutopia/songs/page.tsx"
git commit -m "feat: add /zutopia/songs page with song/album tabs"
```

---

### Task 7: 즛토피아 허브 페이지에 "노래 DB" 카드 추가

**Files:**

- Modify: `src/app/(pages)/zutopia/page.tsx`

**Interfaces:**

- Consumes: 없음(정적 링크만 추가)

- [ ] **Step 1: 카드 추가**

`src/app/(pages)/zutopia/page.tsx` 전체를 다음으로 교체:

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ZUTOPIA_CATEGORIES } from "@/features/zutopia/registry";

export default function ZutopiaHubPage() {
  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
      <li>
        <Link
          href="/zutopia/songs"
          className="hover:border-ztmy-magenta/60 group block rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/40"
        >
          <p className="hover:text-ztmy-pink text-lg font-semibold text-white transition-colors">
            노래 DB
          </p>
          <p className="mt-1 text-sm text-white/50">전체 곡과 앨범 목록</p>
        </Link>
      </li>

      {ZUTOPIA_CATEGORIES.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/zutopia/${category.slug}`}
            className="hover:border-ztmy-magenta/60 group block rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/40"
          >
            <p className="hover:text-ztmy-pink text-lg font-semibold text-white transition-colors">
              {category.label}
            </p>
            <p className="mt-1 text-sm text-white/50">{category.description}</p>
            <p className="mt-2 font-mono text-xs text-white/40">
              {category.entries.length}개 항목
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 에러 없음.

- [ ] **Step 3: 개발 서버로 렌더 확인**

Run: `curl -s http://localhost:3000/zutopia | grep -o '노래 DB'`
Expected: `노래 DB` 출력.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(pages)/zutopia/page.tsx"
git commit -m "feat: link 노래 DB card from zutopia hub page"
```

---

### Task 8: 최종 통합 검증

**Files:** 없음(검증 전용)

- [ ] **Step 1: 정식 정적 빌드**

Run: `pnpm build`
Expected: 빌드 성공, `out/zutopia/songs/index.html`(또는 동등 경로)이 생성됨. 이 단계에서 실제 Supabase 네트워크 호출이 실행되므로, Task 2~6에서 놓쳤을 수 있는 런타임 에러(환경변수 누락, 쿼리 오류 등)가 여기서 드러난다.

- [ ] **Step 2: 포맷/린트 최종 확인**

Run: `pnpm format:check && pnpm lint`
Expected: 에러 없음. `format:check`가 실패하면 `pnpm format` 실행 후 해당 태스크의 커밋에 변경분을 추가한다.

- [ ] **Step 3: 브라우저 수동 확인 안내**

이 세션엔 스크린샷/브라우저 자동화 도구가 없으므로, 사용자가 직접 `http://localhost:3000/zutopia`와 `http://localhost:3000/zutopia/songs`를 열어 "노래 DB" 카드 클릭 → 탭 전환 → (데이터가 있다면) 카드 레이아웃이 의도대로 보이는지 확인하도록 안내한다.
