"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { TOUR_SCHEDULE } from "@/features/info/data/tour-schedule";
import { SCHEDULE_DAYS, SCHEDULE_SHOWS } from "@/features/info/schedule";
import { getVenueNow } from "@/features/info/lib/schedule-status";
import { useScheduleStatus } from "@/features/info/lib/use-schedule-status";

// "18(월)·19(화)"처럼 이틀 공연은 가운데 점으로 이어 적는다 — 공연 횟수는 날짜 수.
function countShows(dates: string): number {
  return dates.split("·").length;
}

// 표 데이터엔 연도가 없어서 투어 공연 목록의 연도를 쓴다(투어가 한 해 안에 있음).
const TOUR_YEAR = SCHEDULE_DAYS[0]?.slice(0, 4) ?? "";

/** 한 줄의 공연 날짜들 — 1월 "18(월)·19(화)" → ["2027-01-18", "2027-01-19"]. */
function rowDates(month: number, dates: string): string[] {
  return [...dates.matchAll(/(\d+)\(/g)].map(
    (match) =>
      `${TOUR_YEAR}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`,
  );
}

type RowState = "past" | "next" | "upcoming";

/**
 * 투어 전체 일정표 — 날짜 / 도시 / 장소 / 인원수(정원) 순의 표. 월마다 구분
 * 줄(그 달 공연 횟수)을 넣는다. /info 일정 탭과 홈 공연 안내 패널이 같이 쓴다.
 * showTime이면 개연 시각도 보여준다 — 태블릿 이상은 별도 칸, 모바일은 날짜
 * 아래(좁은 화면에 칸을 하나 더 두기엔 장소 이름이 너무 좁아진다).
 * today(현지 날짜)와 nextDate(다음·오늘 공연 날짜)를 주면 지난 공연은 흐리게,
 * 다음 공연 줄은 강조한다. collapsePast면 지난 공연은 접어 두고 맨 위
 * "지난 공연 보기"로 펼친다(투어 중간에도 다음 공연이 바로 보이게).
 */
export function TourScheduleTable({
  showTime = false,
  today,
  nextDate,
  dimPast = true,
  collapsePast = false,
  className,
}: {
  showTime?: boolean;
  today?: string;
  nextDate?: string;
  /** false면 today를 받아도 지난 공연을 흐리게 하지 않는다("오늘" 표시에만 씀). */
  dimPast?: boolean;
  collapsePast?: boolean;
  className?: string;
}) {
  const [isPastOpen, setPastOpen] = useState(false);
  const getRowState = (month: number, dates: string): RowState => {
    const days = rowDates(month, dates);
    if (nextDate && days.includes(nextDate)) return "next";
    if (today && days.every((day) => day < today)) return "past";
    return "upcoming";
  };

  const columns = showTime ? 5 : 4;
  const groups = TOUR_SCHEDULE.map((group) => ({
    ...group,
    rows: group.shows.map((show) => ({
      show,
      state: getRowState(group.month, show.dates),
    })),
  }));
  const pastCount = groups
    .flatMap((group) => group.rows)
    .filter((row) => row.state === "past")
    .reduce((sum, row) => sum + countShows(row.show.dates), 0);
  const hidePast = collapsePast && pastCount > 0 && !isPastOpen;

  return (
    <table className={cn("w-full border-collapse text-sm", className)}>
      <thead>
        <tr className="border-b border-white/15 text-left text-xs text-white/55">
          <th scope="col" className="py-1.5 pr-2 font-medium">
            날짜
          </th>
          <th scope="col" className="py-1.5 pr-2 font-medium">
            도시
          </th>
          <th scope="col" className="py-1.5 pr-2 font-medium">
            장소
          </th>
          {showTime && (
            <th
              scope="col"
              className={cn(
                "hidden py-1.5 pr-2 font-medium",
                "tablet:table-cell",
              )}
            >
              개연
            </th>
          )}
          <th scope="col" className="py-1.5 text-right font-medium">
            인원수
          </th>
        </tr>
      </thead>

      {collapsePast && pastCount > 0 && (
        <tbody>
          <tr>
            <td colSpan={columns} className="pt-2">
              <button
                type="button"
                aria-expanded={isPastOpen}
                onClick={() => setPastOpen((open) => !open)}
                className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                지난 공연 {pastCount}회 {isPastOpen ? "접기" : "보기"}
                <ChevronDownIcon
                  className={cn(
                    "h-3 w-3 transition-transform",
                    isPastOpen && "rotate-180",
                  )}
                />
              </button>
            </td>
          </tr>
        </tbody>
      )}

      {groups.map((group) => {
        const rows = hidePast
          ? group.rows.filter((row) => row.state !== "past")
          : group.rows;
        if (rows.length === 0) return null;
        return (
          <tbody key={group.month}>
            <tr>
              <th
                scope="rowgroup"
                colSpan={columns}
                className="text-ztmy-pink pt-3 pb-1 text-left text-xs font-bold"
              >
                {group.label}
                <span className="ml-1.5 font-mono font-normal text-white/45">
                  {group.rows.reduce(
                    (sum, row) => sum + countShows(row.show.dates),
                    0,
                  )}
                  회
                </span>
              </th>
            </tr>
            {rows.map(({ show, state }) => {
              return (
                <tr
                  key={`${show.dates}-${show.venue}`}
                  aria-current={state === "next" ? "date" : undefined}
                  className={cn(
                    "border-b border-white/5 align-top",
                    state === "past" && dimPast && "opacity-40",
                    state === "next" && "bg-ztmy-pink/15",
                  )}
                >
                  {/* 이틀 공연은 좁은 화면에서 가운데 점 뒤에서 줄을 바꿀 수 있게 */}
                  <td className="py-1.5 pr-2 font-mono text-xs break-keep text-white/90">
                    {group.month}/{show.dates.replace("·", "·​")}
                    {showTime && (
                      <span
                        className={cn("block text-white/50", "tablet:hidden")}
                      >
                        {show.time}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2 whitespace-nowrap text-white/70">
                    {show.pref}
                  </td>
                  <td className="py-1.5 pr-2 break-keep text-white">
                    {show.venue}
                    {state === "next" && (
                      <span className="bg-ztmy-pink ml-1.5 inline-block rounded-full px-1.5 py-px align-middle text-[11px] font-bold text-white">
                        {nextDate === today ? "오늘" : "다음 공연"}
                      </span>
                    )}
                  </td>
                  {showTime && (
                    <td
                      className={cn(
                        "hidden py-1.5 pr-2 font-mono text-xs text-white/70",
                        "tablet:table-cell",
                      )}
                    >
                      {show.time}
                    </td>
                  )}
                  <td className="py-1.5 text-right font-mono text-xs break-keep text-white/80">
                    {show.capacity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        );
      })}
    </table>
  );
}

/**
 * 지금 시각을 스스로 구독해 다음 공연 줄만 강조하는 일정표 — 상태를 넘겨줄
 * 수 없는 /info(MDX 안 서버 컴포넌트)용. 지난 공연은 흐리게 하지 않는다.
 */
export function LiveTourScheduleTable({ showTime }: { showTime?: boolean }) {
  const status = useScheduleStatus();
  const next =
    status && status.phase !== "ended"
      ? SCHEDULE_SHOWS[status.showIndex]?.date
      : undefined;

  return (
    <TourScheduleTable
      showTime={showTime}
      today={status ? getVenueNow(status.nowMs).date : undefined}
      nextDate={next}
      dimPast={false}
    />
  );
}
