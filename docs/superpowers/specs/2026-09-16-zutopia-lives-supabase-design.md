# zutopia lives Supabase 연동

## 배경

Supabase 스키마가 개편되어 `songs`에 `original_song_id`/`version_name`(어레인지 버전)이 추가되고, `tours`/`lives`/`setlists` 테이블이 새로 생겼다. 이 문서는 그중 `lives`(지난 공연) 데이터를 Supabase로 옮기는 부분만 다룬다. `songs`의 어레인지 버전 표시는 별도로 `song-db/data.ts`에서 처리 완료됨(이 문서 범위 아님).

`/zutopia/lives/*`(지난 공연) 경로는 원래 전부 정적 데이터였다:

- `src/features/zutopia/registry.ts`의 `ZUTOPIA_CATEGORIES` — "lives" 카테고리 하나, `entries` 배열에 공연 메타(slug/label/name/date/thumbnail/type)를 하드코딩.
- `src/features/zutopia/lives/<슬러그>/` — 공연 하나당 폴더 하나. `data.ts`(티켓/이미지 등 상세 정보), `content.mdx`(실제 렌더링, 세트리스트 곡별 링크 포함), `SongLink.tsx`(세트리스트 한 줄 컴포넌트).
- `/zutopia/[category]/page.tsx`, `layout.tsx`, `[slug]/page.tsx`가 전부 `registry.ts`를 동기적으로 읽어 목록/탭/상세를 그린다. `[slug]/page.tsx`는 `"카테고리/슬러그"` 문자열을 키로 MDX 컴포넌트를 매핑하는 `CONTENT_BY_KEY`를 통해 렌더링한다.

유일한 예시였던 `sound-planet-2026`(공연은 이미 종료됨)은 이 스펙과 별개로 완전히 제거했다 — `src/features/zutopia/lives/sound-planet-2026/` 폴더, `public/assets/zutopia/sound-planet-2026/` 이미지, `registry.ts`의 해당 `entries` 항목, 그리고 항목이 하나도 없으면 `output: "export"` 빌드가 실패하는 문제(`generateStaticParams()`가 빈 배열을 반환) 때문에 `[category]/[slug]/page.tsx` 라우트 자체도 함께 삭제했다. 그 결과 지금은 "lives" 카테고리에 항목이 0개이고, `/zutopia/[category]/[slug]` 라우트가 존재하지 않는 상태에서 이 스펙을 시작한다 — 아래 설계는 기존 파일을 "수정"하는 게 아니라 대부분 새로 만드는 것이다.

## 목표

- `/zutopia`(허브), `/zutopia/lives`(목록), `/zutopia/lives/[slug]`(상세)의 **목록 메타 + 세트리스트**를 Supabase(`lives`, `setlists`, `songs`)에서 가져오도록 바꾼다.
- 세트리스트의 곡별 응원 가이드 링크(`/guide/[songId]`)는 기존 `song-db`의 `getGuideHref`를 그대로 재사용해 표시한다.
- 티켓 링크, 섹션별 이미지, 공지사항 등 `content.mdx`의 나머지 수동 콘텐츠는 지금처럼 파일당 하나씩 유지한다 — 이번 작업으로 건드리지 않는다.

## 비목표

- `tours` 테이블 연동 — 지금은 투어 없는 단독 공연만 있어 범위에서 제외한다. `lives.tour_id`는 타입만 존재하고 조회/조인하지 않는다.
- 세트리스트 곡별 영상(직캠 등) 링크 — `setlists` 스키마에 해당 컬럼이 없다. DB에 없는 정보이므로 표시하지 않는다. 대신 그 곡의 `/guide/[songId]` 가이드 페이지가 있으면 그 링크를 붙인다(없으면 링크 없는 일반 텍스트 행).
- `lives`/`setlists`에 실제 데이터를 채워 넣는 작업(운영자가 Supabase에 직접 입력) — 이 문서는 애플리케이션 코드 변경만 다룬다.
- "지난 공연" 외의 향후 카테고리(굿즈 등) — 카테고리 자체는 지금처럼 `registry.ts`에 정적으로 남는다.

## 목표 구조

```
src/app/(pages)/zutopia/[category]/
  [slug]/page.tsx             # 신규 — "lives" 카테고리는 getLiveBySlug(slug)로 렌더링

src/features/zutopia/
  guide-link.ts               # song-db/guide-link.ts에서 이동 — song-db와 lives가 공유
  registry.ts                 # 카테고리 정의 + getEntries() 로더로 변경
  lives/
    data.ts                   # 신규 — getLiveEntries(), getLiveBySlug(slug)
    types.ts                  # 신규 — LiveDetail, LiveSetlistEntry
    SongLink.tsx               # 신규 — 세트리스트 한 줄 컴포넌트(href optional)
  song-db/
    guide-link.ts              # 삭제 (zutopia/guide-link.ts로 이동)
    data.ts                     # import 경로만 갱신
```

새 공연이 추가될 때 사진/공지 등 수동 콘텐츠가 필요하면, 그때 `lives/<슬러그>/content.mdx` 같은 폴더를 다시 만들면 된다 — 지금은 그 예시가 없으므로 이 스펙에서 미리 만들지 않는다(YAGNI).

## 데이터 흐름

### `lives` 목록 (허브/카테고리 페이지)

`src/features/zutopia/lives/data.ts`에 다음을 추가한다:

```ts
export async function getLiveEntries(): Promise<ZutopiaEntry[]>;
```

- `lives` 테이블에서 `status = 'ACTIVE'`인 행을 `live_date` 내림차순으로 조회.
- `ZutopiaEntry`(`registry.ts`)로 매핑: `slug`, `label = title_ko`, `name = title`, `date`(= `live_date`를 "YYYY년 M월 D일" 형식으로 포맷하는 새 헬퍼), `thumbnail = poster_image_url ?? icon_image_url ?? ""`, `type`(DB의 `FESTIVAL`/`CONCERT`/`EVENT` → 소문자 `festival`/`concert`/`event`).
- `ZutopiaEntryType`에 `"event"`를 추가하고 `ENTRY_TYPE_LABEL`에 `"행사"`를 등록한다(`registry.ts`).

### `lives` 상세 + 세트리스트

```ts
export async function getLiveBySlug(slug: string): Promise<LiveDetail | null>;
```

- `lives` 테이블에서 slug로 단건 조회(`status = 'ACTIVE'`), 동시에 `setlists(track_number, is_encore, songs(id, slug, title, title_ko))`를 임베드.
- `is_encore` 오름차순(본편 먼저) → `track_number` 오름차순으로 정렬.
- 각 세트리스트 항목을 `{ songId, title, titleKo, guideHref }`로 매핑 — `guideHref`는 `getGuideHref(song.slug)`(공유 위치로 이동한 `zutopia/guide-link.ts`) 재사용.
- `LiveDetail`은 `Database["public"]["Tables"]["lives"]["Row"]`에 `setlist: LiveSetlistEntry[]`를 얹은 타입으로 `lives/types.ts`(신규, song-db/types.ts와 같은 역할)에 정의한다.

### `guide-link.ts` 공유

`src/features/zutopia/song-db/guide-link.ts`를 `src/features/zutopia/guide-link.ts`로 옮긴다(`git mv`). `song-db/data.ts`와 새 `lives/data.ts` 양쪽에서 `@/features/zutopia/guide-link`로 참조한다 — song-db가 lives를 참조하는(또는 그 반대) 부자연스러운 의존 방향을 피하기 위함이다.

### `registry.ts` 변경

`ZutopiaCategory.entries: ZutopiaEntry[]`(정적 배열)를 `getEntries: () => Promise<ZutopiaEntry[]>`(함수)로 바꾼다. "lives" 카테고리는 `getEntries: getLiveEntries`로 연결한다. `summarizeEntryTypes`는 이미 `ZutopiaEntry[]`를 인자로 받으므로 시그니처 변경이 필요 없다 — 호출부가 `await category.getEntries()` 결과를 넘기도록만 바뀐다.

### 라우트 변경 (전부 entries를 비동기로 받도록 수정)

- `src/app/(pages)/zutopia/page.tsx`: `ZUTOPIA_CATEGORIES.map(...)` 전에 각 카테고리의 `getEntries()`를 `Promise.all`로 미리 resolve.
- `src/app/(pages)/zutopia/[category]/layout.tsx`: `category.getEntries()`를 await한 뒤, 엔트리가 포함된 형태로 `ZutopiaCategoryTabs`에 넘긴다(탭 컴포넌트는 클라이언트 컴포넌트라 이미 resolve된 배열만 props로 받는다).
- `src/app/(pages)/zutopia/[category]/page.tsx`: `category.entries` 대신 `await category.getEntries()`로 카드 목록을 그린다. 항목이 0개일 때의 "아직 등록된 항목이 없습니다." 안내 문구는 이미 있으므로 그대로 둔다.
- `src/app/(pages)/zutopia/[category]/[slug]/page.tsx` (신규 파일 — sound-planet-2026 정리 과정에서 삭제됨):
  - `generateStaticParams`를 `async`로 작성하고, 카테고리별 `await getEntries()` 결과로 슬러그 목록을 만든다. "lives"에 항목이 아직 하나도 없으면(카테고리 전체 합쳐 빈 배열) `output: "export"` 빌드가 실패한다는 점을 유의한다 — 실제 공연이 하나라도 Supabase에 등록된 뒤에 이 라우트를 다시 배포해야 한다.
  - `generateMetadata`/본문 렌더링에서 "lives" 카테고리는 `getLiveBySlug(slug)`로 얻은 `LiveDetail`을 `CONTENT_BY_KEY`가 매핑한 MDX 컴포넌트에 `<Content live={liveDetail} />` 형태로 props로 전달한다. `CONTENT_BY_KEY`는 지금 빈 객체이므로, 새 공연에 수동 콘텐츠(티켓/사진 등)가 필요할 때만 그 공연의 `content.mdx`를 만들어 등록한다.

### 세트리스트 렌더링 컴포넌트

`src/features/zutopia/lives/SongLink.tsx`(신규)를 만든다 — 과거 `sound-planet-2026/SongLink.tsx`와 같은 역할(세트리스트 한 줄: 번호 + 제목)이되, `href`를 `string | null | undefined`로 받아 값이 있으면 `SiteLink`로, 없으면 링크 없는 `<span>`으로 렌더링한다(가이드 페이지가 없는 곡도 텍스트로는 보여줘야 하므로).

새 공연의 `content.mdx`(필요할 때만 생성)에서는 아래처럼 `props.live.setlist`를 순회해 세트리스트를 그린다:

```mdx
<ul className="...">
  {props.live.setlist.map((entry, i) => (
    <li key={entry.songId}>
      <SongLink href={entry.guideHref} index={i + 1}>
        {entry.titleKo} ({entry.title})
      </SongLink>
    </li>
  ))}
</ul>
```

곡 수("세트리스트 (N Songs)")도 `props.live.setlist.length`로 동적화한다.

## 에러 처리

- `getLiveEntries`/`getLiveBySlug`는 song-db의 기존 함수들과 동일하게, Supabase 에러 발생 시 한국어 메시지로 `Error`를 던진다(빌드 타임 실패 → 빌드 로그에서 바로 원인 확인).
- `getLiveBySlug`가 행을 못 찾으면(삭제/슬러그 오타) `null`을 반환하고, 페이지에서 `notFound()` 처리한다 — 기존 `[category]/page.tsx`의 `if (!category) notFound()` 패턴과 동일.

## 검증 계획

1. `pnpm exec tsc --noEmit` — 타입 오류 0건.
2. `pnpm run lint`, `pnpm run format:check`.
3. `pnpm run build` — `output: "export"` 정적 빌드가 `generateStaticParams`의 비동기 Supabase 호출과 함께 정상적으로 완료되는지 확인(빌드 타임에 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUB_KEY` 필요 — 로컬 `.env.local`에 이미 존재). Supabase `lives`에 아직 행이 하나도 없으면 이 라우트 자체가 생성되지 않아 빌드가 실패한다 — 최소 1건은 등록된 뒤에 검증한다.
4. dev 서버에서 `/zutopia`, `/zutopia/lives` 육안 확인: 항목이 없을 땐 "아직 등록된 항목이 없습니다." 문구가, 실제 공연을 하나 등록하면 카드 메타(콘서트/페스티벌 개수)·탭·상세 페이지 세트리스트(가이드 있는 곡은 링크, 없는 곡은 일반 텍스트)가 정상적으로 나오는지.

## 리스크

- 이 스펙만으로는 "lives" 카테고리에 실제 항목이 여전히 0개다 — Supabase에 공연을 최소 1건(및 그 세트리스트, 관련 `songs` 행)을 등록해야 위 검증 계획의 3·4번을 실행할 수 있다. 데이터 입력은 이 스펙의 비목표이므로 별도로 진행한다.
- self-FK(`songs.original_song_id`)와 마찬가지로, `lives`/`setlists`의 Supabase embed도 supabase-js 타입 추론이 배열/객체를 잘못 판단할 수 있다 — 필요하면 `song-db/data.ts`에서 이미 쓴 것과 같은 캐스팅 패턴을 재사용한다.
