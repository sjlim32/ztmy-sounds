"use client";

import { useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import { ThumbImage } from "@/components/ThumbImage";
import type { MouseEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FilterPanel,
  SortFilterBar,
  type SortFilterOption,
} from "@/features/zutopia/components/SortFilterBar";
import { GridIcon } from "@/components/icons/GridIcon";
import { ListIcon } from "@/components/icons/ListIcon";
import { VisitBadge } from "@/features/zutopia/lives/VisitBadge";
import { LIVE_TAG_CLASS } from "@/features/zutopia/lives/surface";
import {
  useListViewMode,
  type ListViewMode,
} from "@/features/zutopia/lives/useListViewMode";
import { posterTransitionName } from "@/features/zutopia/lives/poster-transition";
import {
  ENTRY_TYPE_DOT,
  ENTRY_TYPE_TAG,
  ENTRY_TYPE_LABEL,
  ENTRY_TYPE_ORDER,
  type ZutopiaEntry,
  type ZutopiaEntryType,
} from "@/features/zutopia/types";

type SortBy = "year" | "format";
type FormatFilter = "all" | ZutopiaEntryType;

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "year", label: "연도별" },
  { value: "format", label: "형식별" },
];

// 고른 형식 칩은 마젠타 대신 그 종류 색으로 옅게 칠한다 — 포스터 위 종류
// 태그와 같은 색이라 필터와 목록이 같은 색으로 읽힌다(마젠타는 내한 전용).
const FORMAT_ACTIVE_CLASS: Record<ZutopiaEntryType, string> = {
  tour: "border-ztmy-sky/80 bg-ztmy-sky/15 text-white hover:border-ztmy-sky",
  festival:
    "border-ztmy-purple bg-ztmy-purple/30 text-white hover:border-ztmy-purple",
  concert:
    "border-ztmy-pink/80 bg-ztmy-pink/15 text-white hover:border-ztmy-pink",
};

const VIEW_OPTIONS: SortFilterOption<ListViewMode>[] = [
  {
    value: "card",
    label: "카드로 보기",
    icon: <GridIcon className="h-4 w-4" />,
  },
  {
    value: "list",
    label: "리스트로 보기",
    icon: <ListIcon className="h-4 w-4" />,
  },
];

const ALL_YEAR = "all";

function entryYear(entry: ZutopiaEntry): string | null {
  return entry.startDate ? entry.startDate.slice(0, 4) : null;
}

/**
 * 상세로 들어갔다가 목록으로 돌아왔을 때 복원할 상태(필터 + 스크롤 위치).
 * /zutopia는 window가 아니라 ZutopiaScrollArea의 <main>이 스크롤되는 구조라
 * (docs/RULES.md) 브라우저 기본 스크롤 복원이 동작하지 않고, 필터도 로컬
 * state라 언마운트되면 사라진다 — 그래서 항목 클릭 시점에 직접 저장해 둔다.
 * ZUTOPIA는 경로가 바뀌면 맨 위로 되돌리지만(ZutopiaScrollArea, layout
 * effect), 이 복원은 그 뒤(passive effect)에 돌아서 공연 목록만 예외가 된다.
 *
 * 복귀 경로가 둘이라 popstate 감지가 아니라 "저장 → 다음 마운트에서 한 번
 * 소비" 방식을 쓴다: MO 헤더 뒤로가기는 router.back()(popstate)이지만 PC
 * 헤더의 "공연" 탭(ZutopiaHeaderNav)은 목록으로 가는 일반 Link(push)라서다.
 */
interface ListSnapshot {
  sortBy: SortBy;
  formatFilter: FormatFilter;
  yearFilter: string;
  scrollTop: number;
}

function snapshotKey(categorySlug: string) {
  return `zutopia-list-snapshot:${categorySlug}`;
}

// 이 모듈이 브라우저에서 한 번이라도 마운트됐는지. 첫 마운트는 정적
// export HTML의 hydration일 수 있어(첫 렌더가 서버 HTML과 같아야 함) 저장값을
// 쓰지 않는다 — 스냅샷은 목록에서 항목을 클릭해야만 생기므로, 실제로 복원할
// 상황(클라이언트 이동으로 목록 재마운트)에서는 이미 true다.
let hasMountedOnClient = false;

function readSnapshot(categorySlug: string): ListSnapshot | null {
  if (!hasMountedOnClient) return null;
  try {
    const raw = sessionStorage.getItem(snapshotKey(categorySlug));
    return raw ? (JSON.parse(raw) as ListSnapshot) : null;
  } catch {
    return null;
  }
}

function clearSnapshot(categorySlug: string) {
  try {
    sessionStorage.removeItem(snapshotKey(categorySlug));
  } catch {
    // 저장소를 못 쓰는 환경이면 애초에 저장된 것도 없다.
  }
}

function saveSnapshot(categorySlug: string, snapshot: ListSnapshot) {
  try {
    sessionStorage.setItem(snapshotKey(categorySlug), JSON.stringify(snapshot));
  } catch {
    // 저장소를 못 쓰는 환경(시크릿 모드 등)이면 복원만 포기한다.
  }
}

interface EntryGroup {
  key: string;
  label: string;
  entries: ZutopiaEntry[];
}

/**
 * /zutopia/lives 목록 — 곡·앨범 목록과 같은 필터 카드(FilterPanel)에 형식·
 * 연도·정렬·보기 줄을 쌓고, 오른쪽 위에 결과 개수(+ 필터 초기화).
 * 이전엔 ZutopiaCategoryTabs가 모든 항목을 탭 버튼으로 나열했는데, 투어가
 * 추가되며 항목 수가 계속 늘어날 예정이라 그 방식은 확장성이 없어 제거하고
 * 이 필터 UI로 대체했다([category]/layout.tsx 참고).
 *
 * lives/tours 구분 없이 하나의 ZutopiaEntry 목록으로 이미 합쳐져 들어온다
 * (registry.ts의 getLiveEntries 참고) — 여기서는 그 type 필드로만 형식을
 * 구분한다.
 */
export function LiveListView({
  categorySlug,
  entries,
}: {
  categorySlug: string;
  entries: ZutopiaEntry[];
}) {
  // useState 초기값은 StrictMode에서 두 번 호출될 수 있어 읽기만 하고,
  // 한 번만 소비되도록 지우는 건 아래 마운트 effect에서 한다.
  const [initialSnapshot] = useState(() => readSnapshot(categorySlug));
  const [sortBy, setSortBy] = useState<SortBy>(
    initialSnapshot?.sortBy ?? "year",
  );
  const [formatFilter, setFormatFilter] = useState<FormatFilter>(
    initialSnapshot?.formatFilter ?? "all",
  );
  const [yearFilter, setYearFilter] = useState(
    initialSnapshot?.yearFilter ?? ALL_YEAR,
  );
  const [viewMode, setViewMode] = useListViewMode();

  const rootRef = useRef<HTMLDivElement>(null);

  // passive effect라 ZutopiaScrollArea의 "경로가 바뀌면 맨 위로"(layout
  // effect)보다 늦게 돌아 덮어쓰이지 않는다. <main>의 scroll-smooth 때문에
  // instant를 명시한다.
  useEffect(() => {
    hasMountedOnClient = true;
    clearSnapshot(categorySlug);
    if (!initialSnapshot) return;
    rootRef.current
      ?.closest("main")
      ?.scrollTo({ top: initialSnapshot.scrollTop, behavior: "instant" });
  }, [categorySlug, initialSnapshot]);

  const handleEntryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // 새 탭/창으로 여는 클릭은 이 탭이 목록을 떠나지 않으니 저장하지 않는다.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
      return;
    saveSnapshot(categorySlug, {
      sortBy,
      formatFilter,
      yearFilter,
      scrollTop: rootRef.current?.closest("main")?.scrollTop ?? 0,
    });
  };

  // 형식 칩 개수는 고른 연도 안에서 센다 — 눌렀을 때 몇 개가 나오는지 미리 보이게.
  const formatCounts = useMemo(() => {
    const counts: Record<FormatFilter, number> = {
      all: 0,
      tour: 0,
      festival: 0,
      concert: 0,
    };
    for (const entry of entries) {
      if (yearFilter !== ALL_YEAR && entryYear(entry) !== yearFilter) continue;
      counts.all++;
      if (entry.type) counts[entry.type]++;
    }
    return counts;
  }, [entries, yearFilter]);

  // 연도 칩 — 고른 형식에 해당 공연이 없는 해는 흐리게(누를 수 없게).
  const years = useMemo(() => {
    const all = new Set<string>();
    const inFormat = new Set<string>();
    for (const entry of entries) {
      const year = entryYear(entry);
      if (!year) continue;
      all.add(year);
      if (formatFilter === "all" || entry.type === formatFilter)
        inFormat.add(year);
    }
    return [...all]
      .sort((a, b) => b.localeCompare(a))
      .map((year) => ({ year, empty: !inFormat.has(year) }));
  }, [entries, formatFilter]);

  const formatOptions = useMemo<SortFilterOption<FormatFilter>[]>(
    () =>
      (["all", ...ENTRY_TYPE_ORDER] as const).map((option) => ({
        value: option,
        label: option === "all" ? "전체" : ENTRY_TYPE_LABEL[option],
        count: formatCounts[option],
        disabled: formatCounts[option] === 0,
        ...(option !== "all" && {
          dotClassName: ENTRY_TYPE_DOT[option],
          activeClassName: FORMAT_ACTIVE_CLASS[option],
        }),
      })),
    [formatCounts],
  );

  const yearOptions = useMemo<SortFilterOption<string>[]>(
    () => [
      { value: ALL_YEAR, label: "전체" },
      ...years.map(({ year, empty }) => ({
        value: year,
        label: year,
        disabled: empty,
      })),
    ],
    [years],
  );

  const isFiltered = formatFilter !== "all" || yearFilter !== ALL_YEAR;

  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (formatFilter === "all" || entry.type === formatFilter) &&
          (yearFilter === ALL_YEAR || entryYear(entry) === yearFilter),
      ),
    [entries, formatFilter, yearFilter],
  );

  const groups = useMemo<EntryGroup[]>(() => {
    if (sortBy === "format") {
      return ENTRY_TYPE_ORDER.map((type) => ({
        key: type,
        label: ENTRY_TYPE_LABEL[type],
        entries: filtered.filter((entry) => entry.type === type),
      })).filter((group) => group.entries.length > 0);
    }

    const byYear = new Map<string, ZutopiaEntry[]>();
    for (const entry of filtered) {
      const year = entryYear(entry) ?? "기타";
      const bucket = byYear.get(year) ?? [];
      bucket.push(entry);
      byYear.set(year, bucket);
    }
    return [...byYear.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, yearEntries]) => ({
        key: year,
        label: year === "기타" ? year : `${year}년`,
        entries: yearEntries,
      }));
  }, [filtered, sortBy]);

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <FilterPanel
        summary={
          <>
            {/* 곡·앨범 목록의 "전체 N곡"·"전체 N개"와 같은 말투. */}
            <span className="whitespace-nowrap tabular-nums">
              {isFiltered
                ? `전체 ${entries.length}개 중 ${filtered.length}개`
                : `전체 ${entries.length}개`}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setFormatFilter("all");
                  setYearFilter(ALL_YEAR);
                }}
                className="hover:text-ztmy-pink rounded whitespace-nowrap text-white/50 underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                필터 초기화
              </button>
            )}
          </>
        }
      >
        <SortFilterBar
          label="형식"
          options={formatOptions}
          value={formatFilter}
          onChange={setFormatFilter}
          compact
        />
        <SortFilterBar
          label="연도"
          options={yearOptions}
          value={yearFilter}
          onChange={setYearFilter}
          compact
        />
        <SortFilterBar
          label="정렬"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
        />
        <SortFilterBar
          label="보기"
          groupLabel="보기 방식"
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={setViewMode}
        />
      </FilterPanel>

      {groups.length === 0 ? (
        <p className={cn("text-base text-white/50", "tablet:text-lg")}>
          조건에 맞는 항목이 없습니다.
        </p>
      ) : (
        // 그룹 사이는 카드 사이보다 훨씬 넓게 띄워, 연도가 바뀌는 지점이 바로 보이게 한다.
        // 필터·묶음·보기를 바꾸면 key가 바뀌어 새 결과가 살짝 올라오며 나타난다.
        <div
          key={`${formatFilter}-${yearFilter}-${sortBy}-${viewMode}`}
          className={cn(
            "animate-content-in flex flex-col gap-10",
            "tablet:gap-14",
          )}
        >
          {groups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`live-group-${group.key}`}
              className={cn("flex flex-col gap-4", "tablet:gap-5")}
            >
              {/* 연도(형식) 제목 + 개수 + 남은 폭을 채우는 가로선 — 선이 그룹의
            시작을 끊어 줘서, 카드가 이어지는 그리드 안에서도 경계가 분명하다. */}
              <div className="flex items-baseline gap-3">
                <h2
                  id={`live-group-${group.key}`}
                  className={cn(
                    "text-xl font-bold text-white tabular-nums",
                    "tablet:text-2xl",
                  )}
                >
                  {group.label}
                </h2>
                <span className="text-sm text-white/50 tabular-nums">
                  {group.entries.length}개
                </span>
                <span
                  aria-hidden
                  className="h-px flex-1 self-center bg-white/15"
                />
              </div>
              {viewMode === "list" ? (
                <ul className={cn("grid gap-2", "pc:grid-cols-2 pc:gap-x-4")}>
                  {group.entries.map((entry) => (
                    <li key={entry.slug} className="min-w-0">
                      <LiveRow
                        entry={entry}
                        href={`/zutopia/${categorySlug}/${entry.slug}`}
                        onClick={handleEntryClick}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul
                  className={cn(
                    // 모바일도 2열 — 1열이면 정사각 카드 한 장이 화면을 다 차지해
                    // 목록을 훑기 어렵다. 3열은 카드 위 글자가 포스터를 덮어서 안 쓴다.
                    "grid grid-cols-2 gap-3",
                    "tablet:gap-4",
                    "pc:grid-cols-3",
                    "wide:grid-cols-4",
                  )}
                >
                  {group.entries.map((entry) => (
                    <li key={entry.slug}>
                      <LiveCard
                        entry={entry}
                        href={`/zutopia/${categorySlug}/${entry.slug}`}
                        onClick={handleEntryClick}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

interface LiveItemProps {
  entry: ZutopiaEntry;
  href: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/** 종류 태그 — 면 전체가 종류 색이라 색만으로 바로 구분된다. */
function EntryTypeTag({
  type,
  className,
}: {
  type: ZutopiaEntryType;
  className?: string;
}) {
  return (
    <span className={cn(LIVE_TAG_CLASS, ENTRY_TYPE_TAG[type], className)}>
      {ENTRY_TYPE_LABEL[type]}
    </span>
  );
}

/** 카드 보기 한 장 — 포스터가 주인공, 글자는 그 아래 세 줄. */
function LiveCard({ entry, href, onClick }: LiveItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      transitionTypes={["nav-forward"]}
      className="group flex flex-col gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      {/* 상세 페이지 포스터와 같은 이름 — 상세로 갈 때 이 그림이 그 자리로 이어지며 커진다. */}
      <ViewTransition
        name={posterTransitionName(entry.slug)}
        share="morph"
        default="none"
      >
        <div
          className={cn(
            "relative aspect-square overflow-hidden rounded-lg bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
            // 내한 공연은 테두리와 그림 위 태그를 마젠타(홈의 내한 색)로 표시해
            // 목록에서 바로 눈에 띄게 한다.
            entry.visitOrdinal != null && "ring-ztmy-magenta ring-2",
          )}
        >
          {entry.thumbnail ? (
            <>
              {/* 정사각형이 아닌 포스터의 빈 칸을 같은 그림을 흐리게 깔아
            채운다 — 본 그림은 잘리지 않게 contain 그대로. 주소가 같아
            다운로드는 한 번이다. */}
              <ThumbImage
                src={entry.thumbnail}
                displayWidth={360}
                className="absolute inset-0 h-full w-full scale-125 object-cover blur-xl brightness-50"
              />
              <ThumbImage
                src={entry.thumbnail}
                displayWidth={360}
                alt={entry.name}
                className="relative h-full w-full object-contain transition-opacity group-hover:opacity-80"
              />
            </>
          ) : (
            <div className="h-full w-full bg-white/5" />
          )}
          {/* 종류·내한 태그를 그림 왼쪽 위에 나란히 — 상세 티켓 맨 위
        줄("콘서트 · 두 번째 내한")과 같은 순서. 종류 태그는 면
        전체가 종류 색이라 색만으로 바로 구분된다. 호버하면 포스터가
        온전히 보이게 태그를 숨긴다. */}
          {(entry.type || entry.visitOrdinal != null) && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 transition-opacity duration-200 group-hover:opacity-0">
              {entry.type && (
                <EntryTypeTag
                  type={entry.type}
                  className="shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                />
              )}
              {entry.visitOrdinal != null && (
                <VisitBadge
                  ordinal={entry.visitOrdinal}
                  className="shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                />
              )}
            </div>
          )}
        </div>
      </ViewTransition>

      {/* 글자는 그림 아래에 세 줄로만 — 원제, 한글 제목, 날짜·도시.
      겹쳐 놓으면 포스터 무늬에 묻혀 잘 안 읽힌다. */}
      <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
        <span
          className={cn(
            "group-hover:text-ztmy-pink truncate text-xs font-semibold text-white transition-colors",
            "tablet:text-sm",
          )}
        >
          {entry.name}
        </span>
        {entry.label !== entry.name && (
          <span
            className={cn("truncate text-xs text-white/70", "tablet:text-sm")}
          >
            {entry.label}
          </span>
        )}
        {/* 날짜는 숫자 폭을 맞춰 또렷하게, 도시는 자리가 모자라면
        먼저 줄어든다. */}
        <span
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-xs text-white/55",
            "tablet:text-sm",
          )}
        >
          <span className="shrink-0 font-medium whitespace-nowrap text-white/85 tabular-nums">
            {entry.date}
          </span>
          {entry.city && (
            <>
              <span className="text-white/30">·</span>
              <span className="truncate">{entry.city}</span>
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

/**
 * 리스트 보기 한 줄 — 작은 썸네일 + 제목·날짜, 오른쪽에 종류·내한 태그. 많은
 * 공연을 빠르게 훑는 용도라 포스터는 작게만 둔다.
 */
function LiveRow({ entry, href, onClick }: LiveItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      transitionTypes={["nav-forward"]}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-white/5 p-2 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
        // 내한 공연은 카드 보기와 같이 마젠타 테두리로 표시한다.
        entry.visitOrdinal != null ? "border-ztmy-magenta" : "border-white/10",
      )}
    >
      <ViewTransition
        name={posterTransitionName(entry.slug)}
        share="morph"
        default="none"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-black/30">
          {entry.thumbnail ? (
            <ThumbImage
              src={entry.thumbnail}
              displayWidth={56}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-white/5" />
          )}
        </div>
      </ViewTransition>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="group-hover:text-ztmy-pink truncate text-sm font-semibold text-white transition-colors">
          {entry.name}
        </span>
        {entry.label !== entry.name && (
          <span className="truncate text-xs text-white/70">{entry.label}</span>
        )}
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-white/55">
          <span className="shrink-0 font-medium whitespace-nowrap text-white/85 tabular-nums">
            {entry.date}
          </span>
          {entry.city && (
            <>
              <span className="text-white/30">·</span>
              <span className="truncate">{entry.city}</span>
            </>
          )}
        </span>
      </div>

      {(entry.type || entry.visitOrdinal != null) && (
        <div className="flex shrink-0 flex-col items-end gap-1">
          {entry.type && <EntryTypeTag type={entry.type} />}
          {entry.visitOrdinal != null && (
            <VisitBadge ordinal={entry.visitOrdinal} />
          )}
        </div>
      )}
    </Link>
  );
}
