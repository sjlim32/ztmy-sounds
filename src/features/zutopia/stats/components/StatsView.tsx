"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbImage } from "@/components/ThumbImage";
import { SidePanel } from "@/components/SidePanel";
import { cn } from "@/lib/utils";
import { FOCUS_RING, SOFT_BUTTON_CLASS } from "@/components/button-styles";
import {
  FilterPanel,
  SortFilterBar,
  ZUTOPIA_SURFACE_CLASS,
  type SortFilterOption,
} from "@/features/zutopia/components/SortFilterBar";
import type { StatRecord, StatRow, StatSection } from "../types";

type SectionFilter = "all" | StatSection["id"];

/** 카드에 1위 아래로 보여 줄 줄 수(2~5위). 나머지는 "자세히 보기" 표에서. */
const RUNNER_UP_COUNT = 4;

/**
 * 통계 페이지 — 곡·앨범·공연·장소 구역마다 기록 카드. 카드는 1위를 크게
 * (그림·이름·대표 값·설명), 그 아래 2~5위를 한 줄씩, 맨 아래 "자세히 보기"를
 * 누르면 옆 창(SidePanel)에 전체 순위표가 열린다. 위 필터 카드(곡·공연 목록과
 * 같은 모양)로 구역을 골라 볼 수 있다. 값은 빌드 때 다 계산돼 내려온다(compute.ts).
 */
export function StatsView({ sections }: { sections: StatSection[] }) {
  const [filter, setFilter] = useState<SectionFilter>("all");
  const [openRecord, setOpenRecord] = useState<StatRecord | null>(null);
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
      <FilterPanel summary={<span>지난 공연 기준 · 기록 {recordCount}개</span>}>
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
                    onOpen={() => setOpenRecord(record)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <SidePanel
        open={openRecord !== null}
        title={openRecord?.title ?? ""}
        subtitle={openRecord?.description}
        onClose={() => setOpenRecord(null)}
      >
        {openRecord && <RecordTable record={openRecord} />}
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
  const coLeaders = record.rows.filter((row) => row.rank === 1).length;

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
            <div className="flex items-center gap-2">
              <RowName row={leader} className="text-lg font-bold" />
              {coLeaders > 1 && (
                <span className="shrink-0 rounded bg-white/10 px-1.5 text-xs leading-5 font-semibold text-white/80">
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

      {record.rows.length > 1 && (
        <button
          type="button"
          onClick={onOpen}
          className={cn(SOFT_BUTTON_CLASS, "mt-auto self-start")}
        >
          자세히 보기
          <span className="text-white/55 tabular-nums">
            전체 {record.rows.length}
          </span>
        </button>
      )}
    </article>
  );
}

/** 이름 — 상세 페이지가 있으면 링크(목록→상세와 같은 화면 전환). */
function RowName({ row, className }: { row: StatRow; className?: string }) {
  const base = cn("min-w-0 truncate", className);
  if (!row.href) return <span className={base}>{row.name}</span>;
  return (
    <Link
      href={row.href}
      transitionTypes={["nav-forward"]}
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

/** 전체 순위표 — 넓지 않은 화면에선 표만 가로로 넘긴다. 1~3위 순위는 마젠타. */
function RecordTable({ record }: { record: StatRecord }) {
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
          {record.rows.map((row) => (
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
                      <span className="block text-xs break-keep text-white/50">
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
