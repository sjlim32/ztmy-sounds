import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatKoreanMonthDay } from "@/lib/ymd";
import { formatDayShow } from "@/features/zutopia/lives/shows";
import { splitParenSuffix } from "@/features/zutopia/lives/split-paren-suffix";
import { formatTourPeriod } from "@/features/zutopia/lives/tour-period";
import { versionSpan } from "@/features/zutopia/lives/tour-versions";
import type { TourDateEntry } from "@/features/zutopia/lives/types";

const DASHED = "border-ztmy-purple/40 border-dashed";

type TicketCell = {
  label: string;
  value: ReactNode;
  /** 값 아래 흐린 한 줄 */
  sub?: string | null;
  /** 말줄임될 때 마우스를 올리면 보이는 전체 글자 */
  title?: string;
};

/**
 * 투어 상세 세트리스트 카드 맨 위의 보딩 티켓 띠 — 공연 상세 티켓(LiveTicket)과 같은 모티프
 * (위 색 띠, 점선으로 나뉜 칸, 아래 가로 점선 절취선). 칸 셋을 한 줄에: 앞 두 칸은 글자
 * 폭만큼, 마지막 칸이 남는 폭을 쓰고 넘치면 말줄임 — 칸마다 최소 100px. 글자는 줄바꿈 없이, 라벨은 한국어.
 */
function TicketStrip({
  cells,
}: {
  cells: [TicketCell, TicketCell, TicketCell];
}) {
  const cellClass = cn("min-w-0 px-3 py-2.5 whitespace-nowrap", "tablet:px-5");
  return (
    <div className="relative">
      <div className="from-ztmy-magenta to-ztmy-purple absolute inset-x-0 top-0 h-0.5 bg-linear-to-r" />
      <div className="grid grid-cols-[minmax(100px,auto)_minmax(100px,auto)_minmax(100px,1fr)]">
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={cn(cellClass, index > 0 && cn(DASHED, "border-l"))}
          >
            <p className="text-sm text-white/50">{cell.label}</p>
            <p
              className="mt-0.5 truncate text-sm font-medium text-white"
              title={cell.title}
            >
              {cell.value}
            </p>
            {cell.sub && (
              <p className="truncate text-sm text-white/55">{cell.sub}</p>
            )}
          </div>
        ))}
      </div>
      <div className={cn(DASHED, "border-t")} />
    </div>
  );
}

/** 모바일은 연도를 빼 한 줄에 들어가게(연도는 위 머리의 기간에 있다). */
function YearOnWide({ year }: { year: string }) {
  return <span className="tablet:inline hidden">{year}년 </span>;
}

/**
 * 고른 공연일 세트리스트 카드의 티켓 — 날짜(요일, 아래 DAY/회차·개장/시작 시각) · 도시
 * (아래 원어) · 공연장(한국어 이름, 아래 원어).
 */
export function TourDateTicket({ date }: { date: TourDateEntry }) {
  const times = [
    date.openTime && `개장 ${date.openTime}`,
    date.startTime && `시작 ${date.startTime}`,
  ]
    .filter(Boolean)
    .join(" · ");
  // live_venue는 "日本武道館 (일본무도관)" — 일정 목록처럼 한국어 이름을 크게.
  const { main, suffix } = splitParenSuffix(date.venue);
  const venue = suffix ?? main;
  return (
    <TicketStrip
      cells={[
        {
          label: "날짜",
          value: (
            <>
              <YearOnWide year={date.startDate.slice(0, 4)} />
              {formatKoreanMonthDay(date.startDate, { weekday: true })}
            </>
          ),
          sub: [formatDayShow(date.dayNumber, date.showLabel), times]
            .filter(Boolean)
            .join(" · "),
        },
        { label: "도시", value: date.city, sub: date.cityOriginal },
        {
          label: "공연장",
          value: venue,
          title: venue,
          sub: suffix ? main : null,
        },
      ]}
    />
  );
}

/**
 * 공통 셋리(판 하나 또는 고른 판) 카드의 티켓 — 그 판을 따른 공연일의 기간 · 공연 횟수 ·
 * 거친 도시(날짜 순서대로, 아래 "n개 도시"). 값은 tour-versions.ts versionSpan. 해가 같으면
 * 모바일은 연도를 뺀다. 공연일이 없으면(모두 취소 등) 그리지 않는다.
 */
export function TourSpanTicket({ dates }: { dates: TourDateEntry[] }) {
  const span = versionSpan(dates);
  if (!span) return null;
  const year = span.start.slice(0, 4);
  const period = formatTourPeriod(span.start, span.end);
  const sameYear = span.end.slice(0, 4) === year;
  const cities = span.cities.join(" · ");
  return (
    <TicketStrip
      cells={[
        {
          label: "기간",
          value: sameYear ? (
            <>
              <YearOnWide year={year} />
              {period.slice(`${year}년 `.length)}
            </>
          ) : (
            period
          ),
        },
        { label: "공연", value: `${span.shows}회` },
        {
          label: "지역",
          value: cities,
          title: cities,
          sub: span.cities.length > 1 ? `${span.cities.length}개 도시` : null,
        },
      ]}
    />
  );
}
