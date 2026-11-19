"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThumbImage } from "@/components/ThumbImage";
import { SidePanel } from "@/components/SidePanel";
import { ShareButton } from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import {
  ACTIVE_FILTER_CHIP_CLASS,
  FILTER_CHIP_CLASS,
  FOCUS_RING,
  LINK_BUTTON_CLASS,
  SOFT_BUTTON_CLASS,
} from "@/components/button-styles";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { getFeedbackUrl } from "@/lib/feedback";
import {
  FilterPanel,
  SortFilterBar,
  type SortFilterOption,
} from "@/features/zutopia/components/SortFilterBar";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import {
  DEFAULT_SORT,
  filterRows,
  nextSort,
  sortRows,
  type SortColumn,
  type SortState,
} from "../table-sort";
import {
  MISSING_SETLIST_RECORD_ID,
  type StatCell,
  type StatRecord,
  type StatRow,
  type StatSection,
  type StatSummary,
  type StatTrend,
} from "../types";

type SectionFilter = "all" | StatSection["id"];

/** 카드에 1위 아래로 보여 줄 줄 수(2~5위). 나머지는 "자세히 보기" 표에서. */
const RUNNER_UP_COUNT = 4;

// 전체 순위표 — 빌드 때 만든 /zutopia/stats.json을 처음 열 때 한 번 받는다
// (페이지엔 기록마다 앞 5줄만 실려 있다). 실패하면 다음에 다시 받는다.
let tablesPromise: Promise<Record<string, StatRow[]>> | null = null;
function loadTables() {
  tablesPromise ??= fetch("/zutopia/stats.json")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<Record<string, StatRow[]>>;
    })
    .catch((error: unknown) => {
      tablesPromise = null;
      throw error;
    });
  return tablesPromise;
}

/**
 * 통계 페이지 — 곡·앨범·공연·장소 구역마다 기록 카드. 카드는 1위를 크게
 * (그림·이름·대표 값·설명), 그 아래 2~5위를 한 줄씩, 맨 아래 "자세히 보기"를
 * 누르면 옆 창(SidePanel)에 전체 순위표가 열린다(stats.json에서 받음). 위 필터
 * 카드(곡·공연 목록과 같은 모양)로 구역을 골라 볼 수 있다. 값은 빌드 때 다
 * 계산돼 내려온다(compute.ts). 창이 닫히며 미끄러지는 동안에도 마지막 기록을
 * 그대로 보여 주려고 연 기록(shown)과 열림 여부(open)를 따로 둔다.
 */
export function StatsView({
  sections,
  summary,
}: {
  sections: StatSection[];
  summary: StatSummary;
}) {
  const [filter, setFilter] = useState<SectionFilter>("all");
  const [shown, setShown] = useState<StatRecord | null>(null);
  const [open, setOpen] = useState(false);
  const recordCount = sections.reduce(
    (sum, section) => sum + section.records.length,
    0,
  );
  const options: SortFilterOption<SectionFilter>[] = [
    { value: "all", label: "전체", count: recordCount },
    ...sections.map((section) => ({
      value: section.id,
      label: section.title,
      count: section.records.length,
    })),
  ];
  const visible = sections.filter(
    (section) => filter === "all" || section.id === filter,
  );
  // 기록마다 공유 주소(/zutopia/stats#기록id) — 열면 주소에 붙이고 닫으면 뗀다.
  // replaceState라 뒤로 가기 기록은 쌓이지 않는다.
  const openRecord = (record: StatRecord) => {
    setShown(record);
    setOpen(true);
    window.history.replaceState(null, "", `#${record.id}`);
  };
  const closeRecord = () => {
    setOpen(false);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  };

  // 주소에 #기록id가 있으면(공유 링크로 들어왔거나 주소를 고쳤을 때) 그 기록을 연다.
  useEffect(() => {
    const records = [
      ...sections.flatMap((section) => section.records),
      summary.missing,
    ];
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const record = records.find((item) => item.id === id);
      if (!record) return;
      setShown(record);
      setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [sections, summary.missing]);

  return (
    <div className="flex flex-col gap-8">
      <SummaryRow
        summary={summary}
        onOpenMissing={() => openRecord(summary.missing)}
      />

      <FilterPanel>
        <SortFilterBar
          label="구역"
          groupLabel="통계 구역 고르기"
          options={options}
          value={filter}
          onChange={setFilter}
        />
      </FilterPanel>

      <div key={filter} className="animate-content-in flex flex-col gap-10">
        {visible.map((section) => (
          <section key={section.id} className="flex flex-col gap-4">
            {/* 카드 밖 제목 — 공연 목록 연도 제목과 같은 모양(배경 위 글자 그림자) */}
            <h2 className="flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              <span className="tablet:text-2xl text-xl font-bold text-white">
                {section.title}
              </span>
              <span className="text-sm text-white/55 tabular-nums">
                {section.records.length}
              </span>
              <span aria-hidden className="h-px flex-1 bg-white/15" />
            </h2>
            <ul className="tablet:grid-cols-2 pc:grid-cols-3 grid grid-cols-1 gap-4">
              {section.records.map((record) => (
                // id — 공유 주소(#기록id)로 들어오면 그 카드로 스크롤된다(헤더에 가리지 않게 여백).
                <li
                  key={record.id}
                  id={record.id}
                  className="min-w-0 scroll-mt-24"
                >
                  <RecordCard
                    record={record}
                    onOpen={() => openRecord(record)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <SidePanel
        open={open}
        title={shown?.title ?? ""}
        subtitle={shown?.description}
        onClose={closeRecord}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {shown?.id === MISSING_SETLIST_RECORD_ID && (
            <a
              href={getFeedbackUrl({ title: "세트리스트 제보" })}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_BUTTON_CLASS}
            >
              세트리스트 제보하기
            </a>
          )}
          {/* 이 기록 주소(#기록id) 공유 — 복사 안내는 버튼 아래로(창 위쪽에서 잘리지 않게) */}
          <ShareButton tooltipClassName="top-full bottom-auto left-0 right-auto mt-2 mb-0" />
        </div>
        {shown && <FullTable key={shown.id} record={shown} />}
      </SidePanel>
    </div>
  );
}

/**
 * 맨 위 요약 줄 — 공연일 수·세트리스트 확보율·라이브로 부른 곡·해외 공연을 타일로.
 * 확보율 타일엔 얇은 막대(같은 색 계열의 옅은 바탕 위 채움)와, 세트리스트가 없는
 * 공연 목록을 옆 창으로 여는 버튼을 둔다 — 곡 기록을 얼마나 믿을 수 있는지 보이게.
 */
function SummaryRow({
  summary,
  onOpenMissing,
}: {
  summary: StatSummary;
  onOpenMissing: () => void;
}) {
  return (
    <ul className="tablet:grid-cols-4 grid grid-cols-2 gap-3">
      {summary.items.map((item) => (
        <li
          key={item.label}
          className={cn("flex flex-col gap-1 p-4", ZUTOPIA_SURFACE_CLASS)}
        >
          <p className="text-sm text-white/60">{item.label}</p>
          <p className="tablet:text-3xl text-2xl font-semibold text-white tabular-nums">
            {item.value}
          </p>
          {item.ratio != null && (
            <span
              role="presentation"
              className="bg-ztmy-pink/20 mt-1 h-2 overflow-hidden rounded-full"
            >
              <span
                className="bg-ztmy-pink block h-full rounded-full"
                style={{ width: `${Math.round(item.ratio * 100)}%` }}
              />
            </span>
          )}
          {item.note && (
            <p className="text-sm text-white/50 tabular-nums">{item.note}</p>
          )}
          {item.ratio != null && summary.missing.total > 0 && (
            <button
              type="button"
              onClick={onOpenMissing}
              className={cn(
                "mt-auto self-start rounded-sm pt-1 text-sm text-white/75 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white",
                FOCUS_RING,
              )}
            >
              비어 있는 공연 {summary.missing.total}개
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function RecordCard({
  record,
  onOpen,
}: {
  record: StatRecord;
  onOpen: () => void;
}) {
  const [leader, ...rest] = record.rows;
  const coLeaders = record.leaderCount;

  return (
    <article
      className={cn("flex h-full flex-col gap-4 p-4", ZUTOPIA_SURFACE_CLASS)}
    >
      <header>
        <h3 className="tablet:text-lg text-base font-semibold text-white">
          {record.title}
        </h3>
        <p className="mt-0.5 text-sm text-white/55">{record.description}</p>
      </header>

      {leader ? (
        <div className="flex items-start gap-3">
          {leader.image && (
            <ThumbImage
              src={leader.image}
              displayWidth={64}
              className="size-16 shrink-0 rounded-md bg-black/40 object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {/* 1위 이름은 두 줄까지(공연·투어 이름이 길다), 넘치면 title로 전체 이름 */}
              <RowName
                row={leader}
                className="line-clamp-2 text-lg leading-snug font-bold break-keep whitespace-normal"
              />
              {coLeaders > 1 && (
                <span className="mt-0.5 shrink-0 rounded bg-white/10 px-1.5 text-sm leading-6 font-semibold whitespace-nowrap text-white/80">
                  공동 1위 {coLeaders}
                </span>
              )}
            </div>
            {leader.sub && (
              <p className="truncate text-sm text-white/60">{leader.sub}</p>
            )}
            <p className="text-ztmy-magenta mt-1 text-3xl font-bold tabular-nums">
              <CellText cell={leader.cells[0]} />
            </p>
            {leader.note && (
              <p className="mt-0.5 text-sm break-keep text-white/60">
                {leader.note}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/55">아직 기록이 없어요.</p>
      )}

      {record.trend && <TrendBars trend={record.trend} />}

      {rest.length > 0 && (
        <ol className="flex flex-col border-t border-white/10 pt-2">
          {rest.slice(0, RUNNER_UP_COUNT).map((row) => (
            <li
              key={row.key}
              className="flex items-baseline gap-3 py-1 text-sm"
            >
              <span className="w-5 shrink-0 text-right text-white/45 tabular-nums">
                {row.rank}
              </span>
              <RowName row={row} className="flex-1 text-white/85" />
              <span className="shrink-0 font-medium text-white tabular-nums">
                <CellText cell={row.cells[0]} />
              </span>
            </li>
          ))}
        </ol>
      )}

      {record.total > 1 && (
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={`${record.title} 전체 순위 보기 (${record.total}개)`}
          className={cn(SOFT_BUTTON_CLASS, "mt-auto self-start")}
        >
          자세히 보기
          <span className="text-white/55 tabular-nums">
            전체 {record.total}
          </span>
        </button>
      )}
    </article>
  );
}

/**
 * 1위의 연도별 미니 막대 — 한 가지 색(분홍) 세로 막대, 막대 사이 2px, 위 끝만
 * 둥글게. 위 줄엔 평소 가장 많았던 해를, 막대에 마우스를 올리거나(포커스) 누르면
 * 그 해 값을 보여 준다. 가로축은 첫 해·마지막 해만 글자로. 화면 읽기 프로그램엔
 * 해마다 값을 목록으로 읽어 준다(sr-only).
 */
function TrendBars({ trend }: { trend: StatTrend }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...trend.points.map((point) => point.value));
  if (trend.points.length < 2) return null;
  const peakIndex = trend.points.reduce(
    (best, point, index) =>
      point.value > trend.points[best].value ? index : best,
    0,
  );
  const highlightIndex = trend.highlight
    ? trend.points.findIndex((point) => point.label === trend.highlight)
    : -1;
  const focus =
    trend.points[active ?? (highlightIndex >= 0 ? highlightIndex : peakIndex)];

  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-white/55">{trend.label}</span>
        <span aria-hidden className="text-white/80 tabular-nums">
          {focus.label}년 {focus.value.toLocaleString("ko-KR")}
          {trend.unit}
        </span>
      </figcaption>
      <div
        aria-hidden
        className="flex h-12 items-end gap-0.5"
        onMouseLeave={() => setActive(null)}
      >
        {trend.points.map((point, index) => (
          <span
            key={point.label}
            onMouseEnter={() => setActive(index)}
            onClick={() => setActive(index)}
            title={`${point.label}년 ${point.value}${trend.unit}`}
            // 마우스 대상은 막대보다 크게(칸 전체 높이).
            className="flex h-full min-w-0 flex-1 cursor-default items-end"
          >
            <span
              className={cn(
                "block w-full rounded-t-[4px] transition-opacity",
                point.value === 0 ? "bg-white/10" : "bg-ztmy-pink",
                active != null && active !== index && "opacity-50",
                highlightIndex >= 0 &&
                  active == null &&
                  index !== highlightIndex &&
                  "opacity-50",
              )}
              style={{
                // 0인 해도 바닥선이 보이게 2px.
                height: point.value === 0 ? 2 : `${(point.value / max) * 100}%`,
              }}
            />
          </span>
        ))}
      </div>
      <div
        aria-hidden
        className="flex justify-between text-sm text-white/45 tabular-nums"
      >
        <span>{trend.points[0].label}</span>
        <span>{trend.points.at(-1)!.label}</span>
      </div>
      <ul className="sr-only">
        {trend.points.map((point) => (
          <li key={point.label}>
            {point.label}년 {point.value}
            {trend.unit}
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** 이름 — 상세 페이지가 있으면 링크(목록→상세와 같은 화면 전환). */
function RowName({ row, className }: { row: StatRow; className?: string }) {
  const base = cn("min-w-0 truncate", className);
  if (!row.href)
    return (
      <span className={base} title={row.name}>
        {row.name}
      </span>
    );
  return (
    <Link
      href={row.href}
      title={row.name}
      className={cn(
        base,
        "rounded-sm transition-colors hover:text-white hover:underline hover:decoration-white/40 hover:underline-offset-4",
        FOCUS_RING,
      )}
    >
      {row.name}
    </Link>
  );
}

/** 전체 순위표를 받아 그린다(받는 동안·실패 안내 포함). */
function FullTable({ record }: { record: StatRecord }) {
  const [rows, setRows] = useState<StatRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loadTables().then(
      (tables) => !cancelled && setRows(tables[record.id] ?? record.rows),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [record, attempt]);

  if (failed)
    return (
      <p role="status" className="py-10 text-center text-sm text-white/60">
        전체 순위를 불러오지 못했어요.{" "}
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
          className={cn(
            "rounded text-white underline decoration-white/40 underline-offset-4",
            FOCUS_RING,
          )}
        >
          다시 시도
        </button>
      </p>
    );
  if (!rows)
    return (
      <p role="status" className="py-10 text-center text-sm text-white/55">
        불러오는 중…
      </p>
    );
  return <RecordTable record={record} rows={rows} />;
}

/**
 * 순위표 한 칸 — 공연 칸은 날짜를 위 작은 줄(옅게), 공연 이름을 아래 줄로 나누고,
 * 공연 상세가 있으면 이름이 링크(이름 칸 RowName과 같은 모양).
 */
function CellText({ cell }: { cell: StatCell }) {
  if (typeof cell === "string") return cell;
  return (
    <>
      <span className="block text-sm text-white/45">{cell.date}</span>
      {cell.href ? (
        <Link
          href={cell.href}
          className={cn(
            "block rounded-sm transition-colors hover:text-white hover:underline hover:decoration-white/40 hover:underline-offset-4",
            FOCUS_RING,
          )}
        >
          {cell.label}
        </Link>
      ) : (
        <span className="block">{cell.label}</span>
      )}
    </>
  );
}

/** 검색칸을 보여 줄 최소 줄 수 — 몇 줄 안 되는 표엔 두지 않는다. */
const SEARCH_MIN_ROWS = 10;

/**
 * 전체 순위표 — 위에 검색칸(이름·원제·날짜·도시), 열 이름을 누르면 그 열로 정렬
 * (값 열은 큰 것부터, 다시 누르면 뒤집기 — table-sort.ts). 태블릿 이상은 표(넓지
 * 않으면 표만 가로로 넘김), 모바일은 줄마다 카드(칸 이름: 값). 1~3위 순위는 마젠타.
 */
function RecordTable({
  record,
  rows,
}: {
  record: StatRecord;
  rows: StatRow[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const shownRows = sortRows(filterRows(rows, query), sort);
  const headers: { column: SortColumn; label: string }[] = [
    { column: "rank", label: "순위" },
    { column: "name", label: "이름" },
    ...record.columns.map((label, index) => ({ column: index, label })),
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.length >= SEARCH_MIN_ROWS && (
        <div className="group relative">
          <SearchIcon className="group-focus-within:text-ztmy-magenta pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-white/55 transition-colors" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={`${record.title} 순위에서 찾기`}
            placeholder="이름으로 찾기"
            className={cn(
              // 모바일 Safari 확대를 막으려고 text-base 이상.
              "h-11 w-full rounded-lg border border-white/15 bg-black/40 pr-3 pl-10 text-base text-white transition-colors placeholder:text-white/45 hover:border-white/30",
              "focus:border-ztmy-magenta/70 focus:ring-ztmy-magenta/15 focus:ring-4 focus:outline-none",
            )}
          />
        </div>
      )}
      {/* 모바일은 표 머리칸이 없어 정렬 기준을 칩 줄로 고른다 */}
      <div
        role="group"
        aria-label="정렬 기준"
        className="tablet:hidden flex flex-wrap gap-1.5"
      >
        {headers.map((header) => (
          <SortButton
            key={String(header.column)}
            header={header}
            sort={sort}
            onSort={(column) => setSort(nextSort(sort, column))}
            chip
          />
        ))}
      </div>

      {query && (
        <p role="status" className="text-sm text-white/55">
          {shownRows.length > 0
            ? `${shownRows.length}줄 찾음`
            : "찾는 이름이 없어요."}
        </p>
      )}

      {/* 모바일 — 줄마다 카드 */}
      <ol className="tablet:hidden flex flex-col">
        {shownRows.map((row) => (
          <li
            key={row.key}
            className="flex gap-3 border-b border-white/5 py-3 last:border-b-0"
          >
            <span
              className={cn(
                "w-6 shrink-0 text-right text-sm font-semibold tabular-nums",
                row.rank <= 3 ? "text-ztmy-magenta" : "text-white/55",
              )}
            >
              {row.rank}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <RowHead row={row} />
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {row.cells.map((cell, index) => (
                  <div key={index} className="contents">
                    <dt className="text-white/50">{record.columns[index]}</dt>
                    <dd
                      className={cn(
                        "min-w-0 break-keep tabular-nums",
                        index === 0
                          ? "font-semibold text-white"
                          : "text-white/75",
                      )}
                    >
                      <CellText cell={cell} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ol>

      {/* 태블릿 이상 — 표 */}
      <div className="tablet:block -mx-4 hidden overflow-x-auto px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/15 text-left text-white/55">
              {headers.map((header) => (
                <th
                  key={String(header.column)}
                  scope="col"
                  aria-sort={
                    sort.column === header.column
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className="py-1 pr-3 font-medium whitespace-nowrap"
                >
                  <SortButton
                    header={header}
                    sort={sort}
                    onSort={(column) => setSort(nextSort(sort, column))}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shownRows.map((row) => (
              <tr key={row.key} className="border-b border-white/5 align-top">
                <td
                  className={cn(
                    "py-2 pr-3 font-semibold tabular-nums",
                    row.rank <= 3 ? "text-ztmy-magenta" : "text-white/55",
                  )}
                >
                  {row.rank}
                </td>
                <td className="min-w-40 py-2 pr-3">
                  <RowHead row={row} />
                </td>
                {row.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={cn(
                      "py-2 pr-3 tabular-nums",
                      index === 0
                        ? "font-semibold whitespace-nowrap text-white"
                        : "min-w-24 break-keep text-white/70",
                    )}
                  >
                    <CellText cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 순위표 줄의 이름 칸 — 그림(있으면) + 이름(링크) + 아래 작은 줄. */
function RowHead({ row }: { row: StatRow }) {
  return (
    <span className="flex items-center gap-2">
      {row.image && (
        <ThumbImage
          src={row.image}
          displayWidth={32}
          className="size-8 shrink-0 rounded bg-black/40 object-cover"
        />
      )}
      <span className="min-w-0">
        <RowName
          row={row}
          className="block font-medium break-keep whitespace-normal text-white"
        />
        {row.sub && (
          <span className="block text-sm break-keep text-white/50">
            {row.sub}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * 정렬 버튼 — 표 머리칸(chip 아님)이나 모바일 정렬 줄(chip)에. 지금 정렬 중인
 * 열엔 방향 화살표(↑ 작은 것부터, ↓ 큰 것부터).
 */
function SortButton({
  header,
  sort,
  onSort,
  chip = false,
}: {
  header: { column: SortColumn; label: string };
  sort: SortState;
  onSort: (column: SortColumn) => void;
  chip?: boolean;
}) {
  const active = sort.column === header.column;
  const arrow = active ? (sort.direction === "asc" ? "↑" : "↓") : null;
  return (
    <button
      type="button"
      onClick={() => onSort(header.column)}
      aria-pressed={chip ? active : undefined}
      className={cn(
        chip
          ? cn(FILTER_CHIP_CLASS, active && ACTIVE_FILTER_CHIP_CLASS)
          : cn(
              "-mx-1 inline-flex items-center gap-1 rounded px-1 py-1 transition-colors hover:text-white",
              active && "text-white",
              FOCUS_RING,
            ),
      )}
    >
      {header.label}
      {arrow && <span aria-hidden>{arrow}</span>}
    </button>
  );
}
