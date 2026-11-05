"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  countByYear,
  dateToOffset,
  type TimelineEvent,
} from "@/features/zutopia/timeline/events";
import { EventThumb } from "./EventThumb";
import {
  ATTENDED_CLASS,
  eventDateText,
  eventExtras,
  eventTitle,
  KIND_CARD_CLASS,
  KIND_DOT_CLASS,
} from "./kind-style";
import { TimelineItemLink } from "./TimelineItemLink";

/** 카드 사이 빈칸 = 앞 일정과의 날짜 차이 × 0.6px(최소 8, 최대 160). */
const GAP_PX_PER_DAY = 0.6;
const MIN_GAP = 8;
const MAX_GAP = 160;
const DOT = 12;

/**
 * 세로 축(모바일) — 위가 옛날, 아래가 최근. 해마다 위에 붙는 머리(큰 연도 + 그
 * 해 곡·앨범·공연 수), 그 아래 그림 카드. 카드 사이 빈칸이 실제 시간 간격에
 * 비례한다(dateToOffset, 가까우면 붙이고 아주 멀면 최대 높이까지). 왼쪽 축에
 * 종류별 점. 처음엔 맨 아래(가장 최근)로 스크롤한다.
 */
export function VerticalTimeline({
  events,
  attendedCounts,
}: {
  events: TimelineEvent[];
  attendedCounts: ReadonlyMap<string, number>;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const years = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const year = event.date.slice(0, 4);
      const list = groups.get(year);
      if (list) list.push(event);
      else groups.set(year, [event]);
    }
    return [...groups.entries()];
  }, [events]);
  const counts = useMemo(() => countByYear(events), [events]);

  useEffect(() => {
    const el = endRef.current;
    // 태블릿 이상에선 이 축이 숨겨져 있다(offsetParent 없음) — 그땐 건드리지 않는다.
    if (el?.offsetParent) el.scrollIntoView({ block: "end" });
  }, []);

  return (
    <div className="flex flex-col">
      {years.map(([year, list]) => (
        <section key={year}>
          <h2 className="bg-background sticky top-0 z-10 flex items-baseline gap-3 border-b border-white/10 py-2.5">
            <span className="font-mono text-2xl font-semibold tracking-wider text-white">
              {year}
            </span>
            <span className="text-sm text-white/55">
              곡 {counts[year].song} · 앨범 {counts[year].album} · 공연{" "}
              {counts[year].live}
            </span>
          </h2>
          <ol className="relative py-3 pl-7">
            <span
              aria-hidden
              className="absolute top-0 bottom-0 left-[9px] w-0.5 bg-white/20"
            />
            {list.map((event, index) => {
              const prev = index === 0 ? `${year}-01-01` : list[index - 1].date;
              const gap = Math.min(
                MAX_GAP,
                Math.max(
                  MIN_GAP,
                  dateToOffset(event.date, prev, GAP_PX_PER_DAY),
                ),
              );
              return (
                <li
                  key={event.id}
                  className="relative"
                  style={{ marginTop: index === 0 ? 0 : gap }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "border-background absolute top-1/2 -left-[26px] z-[1] -translate-y-1/2 border-2",
                      KIND_DOT_CLASS[event.kind],
                    )}
                    style={{ width: DOT + 4, height: DOT + 4 }}
                  />
                  <VerticalCard
                    event={event}
                    attended={attendedCounts.get(event.id) ?? 0}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <div ref={endRef} className="h-px" />
    </div>
  );
}

function VerticalCard({
  event,
  attended,
}: {
  event: TimelineEvent;
  attended: number;
}) {
  const album = event.kind === "album";
  const extras = eventExtras(event);
  return (
    <TimelineItemLink
      href={event.href}
      title={eventTitle(event)}
      className={cn(
        "flex items-center gap-3 rounded-lg p-1.5 pr-3 transition-[filter] active:brightness-125",
        KIND_CARD_CLASS[event.kind],
        attended > 0 && ATTENDED_CLASS,
      )}
    >
      <EventThumb
        src={event.imageUrl}
        className={album ? "size-14" : "size-11"}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        {event.tag && (
          <span className="text-ztmy-sun truncate text-sm leading-tight">
            {[event.tag, ...extras].join(" · ")}
          </span>
        )}
        <span className="truncate text-base leading-snug font-medium text-white">
          {event.label}
        </span>
        <span className="truncate text-sm leading-tight text-white/55">
          {[eventDateText(event), event.subLabel, ...(event.tag ? [] : extras)]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </TimelineItemLink>
  );
}
