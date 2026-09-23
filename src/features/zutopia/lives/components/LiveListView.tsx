"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SortFilterBar } from "@/features/zutopia/components/SortFilterBar";
import type { ZutopiaEntry, ZutopiaEntryType } from "@/features/zutopia/types";

type SortBy = "year" | "format";
type FormatFilter = "all" | Extract<ZutopiaEntryType, "festival" | "concert">;

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "year", label: "연도별" },
  { value: "format", label: "형식별" },
];

// "단독 공연"은 이 목록 문맥에서만 쓰는 라벨이다 — types.ts의 전역
// ENTRY_TYPE_LABEL(허브 카드 요약용, "콘서트")과는 별개로, 줏토마요 자신이
// 헤드라이너인 투어라는 의미를 이 페이지에서 더 분명히 드러낸다.
const FORMAT_OPTIONS: { value: FormatFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "festival", label: "페스티벌" },
  { value: "concert", label: "단독 공연" },
];
const FORMAT_GROUP_LABEL: Record<
  Extract<ZutopiaEntryType, "festival" | "concert">,
  string
> = {
  festival: "페스티벌",
  concert: "단독 공연",
};
const FORMAT_GROUP_ORDER: Extract<ZutopiaEntryType, "festival" | "concert">[] =
  ["festival", "concert"];

const ALL_YEAR = "all";

function entryYear(entry: ZutopiaEntry): string | null {
  return entry.startDate ? entry.startDate.slice(0, 4) : null;
}

/**
 * 상세로 들어갔다가 목록으로 돌아왔을 때 복원할 상태. /zutopia는 window가
 * 아니라 ZutopiaScrollArea의 <main>이 스크롤되는 구조라(docs/RULES.md) 브라우저
 * 기본 스크롤 복원이 동작하지 않고, 필터도 로컬 state라 언마운트되면
 * 사라진다 — 그래서 항목 클릭 시점에 직접 저장해 둔다.
 *
 * 복귀 경로가 둘이라 popstate 감지가 아니라 "저장 → 다음 마운트에서 한 번
 * 소비" 방식을 쓴다: MO 헤더 뒤로가기는 router.back()(popstate)이지만 PC
 * ZutopiaTopNav 뒤로가기는 상위 경로로 가는 일반 Link(push)라서다.
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
 * /zutopia/lives 목록 — 정렬(연도별/형식별) + 형식/연도 필터를 갖는다.
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
  const rootRef = useRef<HTMLDivElement>(null);

  // passive effect라 Next Link의 "페이지 상단으로 scrollIntoView"(layout
  // 단계)보다 늦게 돌아 덮어쓰이지 않는다. <main>의 scroll-smooth 때문에
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

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const entry of entries) {
      const year = entryYear(entry);
      if (year) years.add(year);
    }
    return [
      { value: ALL_YEAR, label: "전체" },
      ...[...years]
        .sort((a, b) => b.localeCompare(a))
        .map((year) => ({ value: year, label: `${year}년` })),
    ];
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (formatFilter !== "all" && entry.type !== formatFilter) {
          return false;
        }
        if (yearFilter !== ALL_YEAR && entryYear(entry) !== yearFilter) {
          return false;
        }
        return true;
      }),
    [entries, formatFilter, yearFilter],
  );

  const groups = useMemo<EntryGroup[]>(() => {
    if (sortBy === "format") {
      return FORMAT_GROUP_ORDER.map((type) => ({
        key: type,
        label: FORMAT_GROUP_LABEL[type],
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
      {/* SortFilterBar 자신은 폭을 스스로 정하지 않는다(AlbumListView처럼
      두 필터를 한 줄에 나란히 놓는 쓰임도 있어서 공용 컴포넌트에 w-full을
      강제하지 않음) — 여기서는 세 필터가 항상 세로로 쌓이므로 각 줄을
      w-full로 감싸, 선택값이 바뀌어도(버튼 텍스트 길이가 달라도) 카드
      폭이 흔들리지 않게 고정한다. */}
      <div className="tablet:px-4 tablet:py-3 flex w-full flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
        <div className="w-full">
          <SortFilterBar
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            label="정렬"
          />
        </div>
        <div className="w-full">
          <SortFilterBar
            options={FORMAT_OPTIONS}
            value={formatFilter}
            onChange={setFormatFilter}
            label="형식"
          />
        </div>
        <div className="w-full">
          <SortFilterBar
            options={yearOptions}
            value={yearFilter}
            onChange={setYearFilter}
            label="연도"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className={cn("text-base text-white/50", "tablet:text-lg")}>
          조건에 맞는 항목이 없습니다.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-3">
            <h2
              className={cn(
                "text-sm font-semibold text-white/60",
                "tablet:text-base",
              )}
            >
              {group.label}
            </h2>
            <ul
              className={cn(
                "grid gap-4",
                "tablet:grid-cols-2",
                "pc:grid-cols-3",
              )}
            >
              {group.entries.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/zutopia/${categorySlug}/${entry.slug}`}
                    onClick={handleEntryClick}
                    className="group relative block aspect-square overflow-hidden rounded-lg bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                  >
                    {entry.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.thumbnail}
                        alt={entry.name}
                        loading="lazy"
                        className="h-full w-full object-contain transition-opacity group-hover:opacity-80"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/5" />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      {/* 모바일은 호버가 없어 원제 밑에 한글 제목을 항상
                      같이 보여준다. 태블릿 이상은 마우스 오버가 있으니
                      평소엔 원제(최대 2줄)만 보이다가 호버 시 한글 제목
                      1줄로 교체한다 — 안 보이는 쪽을 아예 display:none으로
                      빼서, 지금 실제로 보이는 텍스트의 줄 수만큼만 칸이
                      차지하게 한다(그래서 tablet 이상은 전환이 즉시
                      바뀐다). */}
                      <span className="block">
                        <span
                          className={cn(
                            "line-clamp-2 block text-sm font-semibold break-keep text-white",
                            "tablet:group-hover:hidden tablet:text-sm",
                          )}
                        >
                          {entry.name}
                        </span>
                        <span
                          className={cn(
                            "block truncate text-base text-white/80",
                            "tablet:text-ztmy-pink tablet:mt-0 tablet:font-semibold tablet:hidden tablet:text-sm tablet:group-hover:block",
                          )}
                        >
                          {entry.label}
                        </span>
                      </span>
                      <p className="mt-1 text-sm text-white/70">
                        {entry.city && `${entry.city} · `}
                        {entry.date}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
