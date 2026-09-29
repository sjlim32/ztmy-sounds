"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { DrawerCloseButton } from "@/features/zutopia/song-db/components/DrawerCloseButton";
import { SongDbDrawer } from "@/features/zutopia/song-db/components/SongDbDrawer";
import { ParenText } from "@/features/zutopia/lives/ParenText";
import { Setlist } from "@/features/zutopia/lives/Setlist";
import type { TourDateEntry } from "@/features/zutopia/lives/types";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function parseIsoDate(iso: string): {
  year: string;
  month: string;
  day: string;
  md: string;
  weekday: string;
} {
  const [year, month, day] = iso.split("T")[0].split("-");
  // 시간대 영향 없이 요일만 구하려고 UTC로 만든다.
  const weekday =
    WEEKDAYS[new Date(Date.UTC(+year, +month - 1, +day)).getUTCDay()];
  return { year, month, day, md: `${month}.${day}`, weekday };
}

function formatTourDateLabel(
  start: { month: string; day: string; md: string },
  end: { month: string; day: string; md: string } | null,
): string {
  if (!end) return start.md;
  if (start.month === end.month) {
    return `${start.md}–${end.day}`;
  }
  return `${start.md}–${end.md}`;
}

/**
 * 투어 상세의 공연 일정 — 공연일은 자기 상세 페이지가 없어서, 행을 누르면
 * 곡/앨범 DB와 같은 우측 드로어로 그 공연의 포스터·추가 이미지와
 * 세트리스트를 연다. 목록 안에 펼치면 일정 행과 세트리스트 행이 같은 모양의
 * 리스트로 이어져 구분이 안 돼서 드로어로 분리했다.
 */
export function TourDateList({ dates }: { dates: TourDateEntry[] }) {
  const [selected, setSelected] = useState<TourDateEntry | null>(null);
  // SongDbDrawer 포커스 effect가 onClose 참조가 바뀔 때마다 재실행되므로
  // 고정한다.
  const close = useCallback(() => setSelected(null), []);
  // 해를 넘기는 투어일 때만 날짜 칸에 연도를 붙인다 — 대부분은 위 티켓의
  // 투어 기간으로 연도가 이미 보인다.
  const showYear =
    new Set(dates.map((date) => date.startDate.slice(0, 4))).size > 1;

  return (
    <>
      <ul
        className={cn("flex flex-col gap-1.5 pt-3", "tablet:gap-2 tablet:pt-4")}
      >
        {dates.map((date) => (
          <li key={date.id}>
            <TourDateRow
              date={date}
              showYear={showYear}
              isSelected={selected?.id === date.id}
              onClick={() =>
                setSelected((current) =>
                  current?.id === date.id ? null : date,
                )
              }
            />
          </li>
        ))}
      </ul>

      <SongDbDrawer
        selected={selected}
        onClose={close}
        ariaLabel={
          selected ? `${selected.date} ${selected.venue} 세트리스트` : undefined
        }
        renderContent={(date) => <TourDatePanel date={date} onClose={close} />}
      />
    </>
  );
}

function TourDatePanel({
  date,
  onClose,
}: {
  date: TourDateEntry;
  onClose: () => void;
}) {
  return (
    <div className={cn("flex flex-col gap-5 p-4", "tablet:gap-6 tablet:p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "font-mono text-xs tracking-[0.15em] text-white/50",
              "tablet:text-sm",
            )}
          >
            {date.date}
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold break-keep text-white",
              "tablet:text-2xl",
            )}
          >
            <ParenText text={date.venue} />
          </p>
          <p className={cn("text-sm text-white/60", "tablet:text-base")}>
            <ParenText text={date.region} />
          </p>
        </div>
        <DrawerCloseButton onClick={onClose} />
      </div>

      {date.posterImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={date.posterImageUrl}
          alt={`${date.date} ${date.venue} 포스터`}
          className="max-h-[50vh] max-w-full self-center rounded-lg object-contain"
        />
      )}

      {date.additionalImageUrls.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ZoomableImageGroup
            images={date.additionalImageUrls.map((url, i) => ({
              src: url,
              alt: `${date.date} ${date.venue} 추가 이미지 ${i + 1}`,
            }))}
            thumbnailWidth={96}
            thumbnailHeight={96}
          />
        </div>
      )}

      {date.setlist.length > 0 ? (
        <Setlist entries={date.setlist} />
      ) : (
        <p className={cn("text-sm text-white/50", "tablet:text-base")}>
          세트리스트가 곧 업데이트됩니다.
        </p>
      )}
    </div>
  );
}

/**
 * 공연 일정 한 줄 — 왼쪽 날짜 칸(MM.DD + 요일)과 오른쪽 도시/장소를 크기·
 * 굵기로 확실히 나눠, 세로로 훑을 때 날짜와 도시가 각각 한 열로 읽히게
 * 한다. 한국 공연은 ztmy-sun "내한" 태그로 강조한다.
 */
function TourDateRow({
  date,
  showYear,
  isSelected,
  onClick,
}: {
  date: TourDateEntry;
  showYear: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const start = parseIsoDate(date.startDate);
  const end =
    date.endDate && date.endDate !== date.startDate
      ? parseIsoDate(date.endDate)
      : null;
  const isKorea = date.country === "한국";
  const dateLabel = formatTourDateLabel(start, end);

  return (
    // data-song-db-item: 드로어가 열린 채로 다른 공연일을 누르면 닫지 않고
    // 내용만 바꾸게 한다(SongDbDrawer 바깥 클릭 처리 참고).
    <button
      type="button"
      data-song-db-item=""
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn(
        "group flex w-full items-stretch overflow-hidden rounded-md border text-left transition-colors",
        isSelected
          ? "border-ztmy-pink/60 bg-white/10"
          : "border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/5",
      )}
    >
      <span
        className={cn(
          "flex w-24 shrink-0 flex-col items-center justify-center border-r border-dashed border-white/15 px-1 py-2.5",
          "tablet:w-28 tablet:py-3",
        )}
      >
        {showYear && (
          <span className="font-mono text-[10px] text-white/40">
            {end && start.year !== end.year
              ? `${start.year}–${end.year}`
              : start.year}
          </span>
        )}
        <span
          className={cn(
            "text-center font-mono font-bold tracking-tight whitespace-nowrap text-white tabular-nums",
            end
              ? start.month === end.month
                ? "tablet:text-base text-[13px]"
                : "tablet:text-sm text-[11px]"
              : "tablet:text-lg text-base",
          )}
        >
          {dateLabel}
        </span>
        <span
          className={cn(
            "font-mono text-[10px] font-medium tracking-[0.15em] text-white/60",
            "tablet:text-xs",
          )}
        >
          {end ? `${start.weekday}–${end.weekday}` : start.weekday}
        </span>
      </span>

      <span
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5",
          "tablet:px-4 tablet:py-3",
        )}
      >
        <span className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-base font-semibold transition-colors",
              "tablet:text-lg",
              isSelected
                ? "text-ztmy-pink"
                : "group-hover:text-ztmy-pink text-white",
            )}
          >
            {date.city}
          </span>
          {date.cityOriginal && (
            <span className={cn("text-xs text-white/40", "tablet:text-sm")}>
              {date.cityOriginal}
            </span>
          )}
          {isKorea && (
            <span
              className={cn(
                "bg-ztmy-sun self-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold text-black",
                "tablet:text-xs",
              )}
            >
              내한
            </span>
          )}
        </span>
        <span
          className={cn("truncate text-xs text-white/60", "tablet:text-sm")}
        >
          <ParenText text={date.venue} />
        </span>
      </span>

      <span className="flex shrink-0 items-center pr-3">
        <ChevronLeftIcon className="h-3.5 w-3.5 rotate-180 text-white/30 transition-colors group-hover:text-white/70" />
      </span>
    </button>
  );
}
