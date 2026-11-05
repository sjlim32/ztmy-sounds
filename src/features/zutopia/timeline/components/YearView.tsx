import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";
import {
  bucketEvents,
  pickHighlights,
} from "@/features/zutopia/timeline/buckets";
import type { TimelineEvent } from "@/features/zutopia/timeline/events";
import { EventThumb } from "./EventThumb";
import { ATTENDED_CLASS, KIND_DOT_CLASS } from "./kind-style";
import { KindCounts } from "./parts";

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
        const highlights = pickHighlights(list, 4);
        const names = list.filter((event) => event.kind !== "song");
        const attended = list.some((event) => attendedCounts.has(event.id));
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
              <button
                type="button"
                onClick={() => onOpen(`${year}-07-01`)}
                aria-label={`${year}년 확대해서 보기`}
                className={cn(
                  "flex max-h-full w-full flex-col gap-3 overflow-hidden rounded-xl bg-[color-mix(in_oklab,white_7%,var(--color-background))] p-3 text-left shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition-[filter] hover:brightness-125",
                  FOCUS_RING,
                  attended && ATTENDED_CLASS,
                )}
              >
                <KindCounts events={list} className="text-sm text-white/80" />
                <span className="grid grid-cols-2 gap-1.5">
                  {highlights.map((event) => (
                    <EventThumb
                      key={event.id}
                      src={event.imageUrl}
                      className="aspect-square w-full"
                    />
                  ))}
                </span>
                {names.length > 0 && (
                  <span className="flex flex-col gap-1">
                    {names.slice(0, 4).map((event) => (
                      <span
                        key={event.id}
                        className="flex min-w-0 items-center gap-1.5 text-sm text-white/85"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 shrink-0",
                            KIND_DOT_CLASS[event.kind],
                          )}
                        />
                        <span className="truncate">{event.label}</span>
                      </span>
                    ))}
                    {names.length > 4 && (
                      <span className="text-sm text-white/50">
                        외 {names.length - 4}개
                      </span>
                    )}
                  </span>
                )}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
