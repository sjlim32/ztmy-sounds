import { bucketEvents } from "@/features/zutopia/timeline/buckets";
import type { TimelineEvent } from "@/features/zutopia/timeline/events";
import { YearSummaryCard } from "./summary-cards";

/**
 * 연 단계 — 해마다 요약 카드 하나: 종류별 수, 대표 그림 4장(앨범 → 공연 → 곡),
 * 앨범·공연 이름(내가 간 공연이 있는 해는 마젠타 테두리). 누르면 그 해로 확대(월 단계).
 */
export function YearView({
  events,
  years,
  x,
  top,
  height,
  attendedCounts,
  onOpen,
}: {
  events: TimelineEvent[];
  years: string[];
  x: (date: string) => number;
  top: number;
  height: number;
  attendedCounts: ReadonlyMap<string, number>;
  onOpen: (midDate: string) => void;
}) {
  const buckets = new Map(
    bucketEvents(events, "year").map((bucket) => [bucket.key, bucket]),
  );
  return (
    <>
      {years.map((year) => {
        const left = x(`${year}-01-01`);
        const width = x(`${Number(year) + 1}-01-01`) - left;
        const list = buckets.get(year)?.events ?? [];
        return (
          <div
            key={year}
            className="absolute flex items-center px-2"
            style={{ left, width, top, height }}
          >
            {list.length === 0 ? (
              <p className="w-full text-center text-sm text-white/35">
                일정 없음
              </p>
            ) : (
              <YearSummaryCard
                events={list}
                attended={list.some((event) => attendedCounts.has(event.id))}
                onOpen={() => onOpen(`${year}-07-01`)}
                className="max-h-full"
              />
            )}
          </div>
        );
      })}
    </>
  );
}
