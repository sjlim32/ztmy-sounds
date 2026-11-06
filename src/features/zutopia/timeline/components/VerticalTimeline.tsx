"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";
import {
  bucketEvents,
  type ZoomLevel,
} from "@/features/zutopia/timeline/buckets";
import {
  DEFAULT_ZOOM_LEVEL,
  stepZoom,
  ZOOM_LABEL,
  ZOOM_ORDER,
} from "@/features/zutopia/timeline/zoom";
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
  TAG_TEXT_CLASS,
  UPCOMING_CLASS,
} from "./kind-style";
import { ClusterCard, YearSummaryCard } from "./summary-cards";
import { TimelineItemLink } from "./TimelineItemLink";

/** 카드 사이 빈칸 = 앞 일정과의 날짜 차이 × 0.6px(최소 8, 최대 160). */
const GAP_PX_PER_DAY = 0.6;
const MIN_GAP = 8;
const MAX_GAP = 160;
const DOT = 12;
/** 위에 붙는 단계 버튼 줄(h-16, 위 20px는 스크롤 페이드 마스크 자리)과 해 머리
 * 높이 — 옮겨 갈 때 가리지 않게 그만큼 내린다. */
const BAR_HEIGHT = 64;
const YEAR_HEADER_HEIGHT = 52;

/**
 * 세로 축(모바일) — 위가 옛날, 아래가 최근. PC와 같은 세 단계:
 * 연(해마다 요약 카드) · 월(해 안에서 달마다 묶음 카드) · 주(일정 하나하나,
 * 카드 사이 빈칸이 실제 시간 간격에 비례). 맨 위에 단계 버튼, 해마다 위에 붙는
 * 머리(큰 연도 + 그 해 곡·앨범·공연 수). 요약·묶음을 누르면 한 단계 확대하고
 * 그 해로 옮긴다. 처음엔 맨 아래(가장 최근)로 스크롤 — 바깥 스크롤 상자(main)의
 * scrollTop만 바꾼다(scrollIntoView는 body까지 움직일 수 있다, RULES.md).
 */
export function VerticalTimeline({
  events,
  attendedCounts,
}: {
  events: TimelineEvent[];
  attendedCounts: ReadonlyMap<string, number>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState<ZoomLevel>(DEFAULT_ZOOM_LEVEL);
  // 단계를 바꾼 뒤 옮겨 갈 곳 — 그 해 머리, 달이 있으면 그 달 첫 카드.
  const pendingRef = useRef<{ year: string; month: string | null } | null>(
    null,
  );
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

  const main = () => rootRef.current?.closest("main") ?? null;

  useEffect(() => {
    const root = rootRef.current;
    const box = main();
    // 태블릿 이상에선 이 축이 숨겨져 있다(offsetParent 없음) — 그땐 건드리지 않는다.
    // main은 scroll-smooth라 즉시 이동을 명시한다(2018년부터 흘러내리지 않게).
    if (root?.offsetParent && box)
      box.scrollTo({ top: box.scrollHeight, behavior: "instant" });
  }, []);

  useLayoutEffect(() => {
    const target = pendingRef.current;
    const box = main();
    const root = rootRef.current;
    if (!target || !box || !root) return;
    pendingRef.current = null;
    const section = root.querySelector<HTMLElement>(
      `[data-year="${target.year}"]`,
    );
    if (!section) return;
    const monthEl = target.month
      ? section.querySelector<HTMLElement>(`[data-month="${target.month}"]`)
      : null;
    // 위에 붙는 단계 버튼 줄(+ 달로 갈 땐 해 머리까지)에 가리지 않게 그만큼 내린다.
    const offset = monthEl ? BAR_HEIGHT + YEAR_HEADER_HEIGHT + 8 : BAR_HEIGHT;
    const top =
      (monthEl ?? section).getBoundingClientRect().top -
      box.getBoundingClientRect().top;
    box.scrollTo({ top: box.scrollTop + top - offset, behavior: "instant" });
  }, [level]);

  // 지금 화면 맨 위쪽에 걸친 해
  const currentYear = () => {
    const box = main();
    const root = rootRef.current;
    if (!box || !root) return null;
    const top = box.getBoundingClientRect().top + BAR_HEIGHT + 8;
    for (const section of root.querySelectorAll<HTMLElement>("[data-year]"))
      if (section.getBoundingClientRect().bottom > top)
        return section.dataset.year ?? null;
    return null;
  };
  const changeLevel = (
    next: ZoomLevel,
    year: string | null,
    month: string | null = null,
  ) => {
    if (next === level) return;
    pendingRef.current = year ? { year, month } : null;
    setLevel(next);
  };
  const openAt = (year: string, month: string | null = null) =>
    changeLevel(stepZoom(level, 1), year, month);

  return (
    <div ref={rootRef} className="flex flex-col">
      <div
        role="group"
        aria-label="확대 단계"
        className="bg-background sticky top-0 z-20 flex h-16 items-center gap-1 pt-5 pb-1"
      >
        {ZOOM_ORDER.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={level === item}
            onClick={() => changeLevel(item, currentYear())}
            className={cn(
              "h-9 flex-1 rounded-md text-sm font-medium transition-colors",
              FOCUS_RING,
              level === item
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/60",
            )}
          >
            {ZOOM_LABEL[item]}
          </button>
        ))}
      </div>
      {years.map(([year, list]) => (
        <section key={year} data-year={year}>
          <h2 className="bg-background sticky top-16 z-10 flex items-baseline gap-3 border-b border-white/10 py-2.5">
            <span className="font-mono text-2xl font-semibold tracking-wider text-white">
              {year}
            </span>
            <span className="text-sm text-white/55">
              곡 {counts[year].song} · 앨범 {counts[year].album} · 단콘{" "}
              {counts[year].live}
            </span>
          </h2>
          {level === "year" && (
            <div className="py-3">
              <YearSummaryCard
                events={list}
                attended={list.some((event) => attendedCounts.has(event.id))}
                onOpen={() => openAt(year)}
              />
            </div>
          )}
          {level === "month" && (
            <ol className="flex flex-col gap-2.5 py-3">
              {bucketEvents(list, "month").map((bucket) => (
                <li
                  key={bucket.key}
                  data-month={bucket.key}
                  className="flex gap-3"
                >
                  <span className="w-9 shrink-0 pt-2 text-right text-sm font-semibold text-white/60">
                    {Number(bucket.key.slice(5, 7))}월
                  </span>
                  <ClusterCard
                    events={bucket.events}
                    attended={bucket.events.some((event) =>
                      attendedCounts.has(event.id),
                    )}
                    onOpen={() => openAt(year, bucket.key)}
                    className="min-w-0 flex-1"
                  />
                </li>
              ))}
            </ol>
          )}
          {level === "week" && (
            <ol className="relative py-3 pl-7">
              <span
                aria-hidden
                className="absolute top-0 bottom-0 left-[9px] w-0.5 bg-white/20"
              />
              {list.map((event, index) => {
                const prev =
                  index === 0 ? `${year}-01-01` : list[index - 1].date;
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
                    data-month={event.date.slice(0, 7)}
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
          )}
        </section>
      ))}
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
        event.upcoming && UPCOMING_CLASS,
      )}
    >
      <EventThumb
        src={event.imageUrl}
        className={album ? "size-14" : "size-11"}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        {event.tag && (
          <span
            className={cn(
              "truncate text-sm leading-tight",
              TAG_TEXT_CLASS[event.kind],
            )}
          >
            {[event.tag, ...extras].join(" · ")}
          </span>
        )}
        <span className="truncate text-base leading-snug font-medium text-white">
          {event.label}
        </span>
        <span className="truncate text-sm leading-tight text-white/60">
          {[eventDateText(event), event.subLabel, ...(event.tag ? [] : extras)]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </TimelineItemLink>
  );
}
