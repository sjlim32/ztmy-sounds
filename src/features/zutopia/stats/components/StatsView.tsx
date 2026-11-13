"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThumbImage } from "@/components/ThumbImage";
import { SidePanel } from "@/components/SidePanel";
import { cn } from "@/lib/utils";
import { FOCUS_RING, SOFT_BUTTON_CLASS } from "@/components/button-styles";
import {
  FilterPanel,
  SortFilterBar,
  type SortFilterOption,
} from "@/features/zutopia/components/SortFilterBar";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import type { StatRecord, StatRow, StatSection } from "../types";

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
export function StatsView({ sections }: { sections: StatSection[] }) {
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

  return (
    <div className="flex flex-col gap-8">
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
                <li key={record.id} className="min-w-0">
                  <RecordCard
                    record={record}
                    onOpen={() => {
                      setShown(record);
                      setOpen(true);
                    }}
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
        onClose={() => setOpen(false)}
      >
        {shown && <FullTable key={shown.id} record={shown} />}
      </SidePanel>
    </div>
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
              {leader.cells[0]}
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
                {row.cells[0]}
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

/** 전체 순위표 — 넓지 않은 화면에선 표만 가로로 넘긴다. 1~3위 순위는 마젠타. */
function RecordTable({
  record,
  rows,
}: {
  record: StatRecord;
  rows: StatRow[];
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/15 text-left text-white/55">
            <th scope="col" className="py-2 pr-3 font-medium">
              순위
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              이름
            </th>
            {record.columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="py-2 pr-3 font-medium whitespace-nowrap"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
