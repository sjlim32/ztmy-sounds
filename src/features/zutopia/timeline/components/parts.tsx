import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/features/zutopia/timeline/events";
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

export const DOT = 12;

/** 축과 카드를 잇는 가는 세로선. 카드보다 먼저 그려 카드 밑에 깔린다. */
export function Stem({
  left,
  top,
  height,
}: {
  left: number;
  top: number;
  height: number;
}) {
  return (
    <div
      aria-hidden
      className="absolute w-px bg-white/20"
      style={{ left: left + DOT / 2 - 0.5, top, height }}
    />
  );
}

/** 축 위 종류별 점. */
export function Dot({
  kind,
  left,
  axisY,
}: {
  kind: TimelineEvent["kind"];
  left: number;
  axisY: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "border-background absolute z-10 border-2",
        KIND_DOT_CLASS[kind],
      )}
      style={{ left, top: axisY - DOT / 2, width: DOT, height: DOT }}
    />
  );
}

/** 일정 하나 카드(주 단계) — 커버·포스터 + 제목 + 날짜. */
export function EventCard({
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
        "flex items-center gap-2.5 rounded-lg p-1.5 pr-3 shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition-[filter] hover:brightness-125",
        KIND_CARD_CLASS[event.kind],
        attended > 0 && ATTENDED_CLASS,
      )}
    >
      <EventThumb
        src={event.imageUrl}
        className={album ? "size-14" : "size-10"}
      />
      <span className="flex max-w-[10rem] min-w-0 flex-col">
        {event.tag && (
          <span className="text-ztmy-sun truncate text-sm leading-tight">
            {[event.tag, ...extras].join(" · ")}
          </span>
        )}
        <span className="truncate text-sm leading-snug font-semibold text-white">
          {event.label}
        </span>
        {event.subLabel && (
          <span className="truncate text-sm leading-tight text-white/60">
            {event.subLabel}
          </span>
        )}
        <span className="truncate text-sm leading-tight text-white/45">
          {[eventDateText(event), ...(event.tag ? [] : extras)].join(" · ")}
        </span>
      </span>
    </TimelineItemLink>
  );
}

/** 종류별 수 한 줄("● 곡 8 ■ 앨범 1 ■ 공연 3"), 0인 종류는 뺀다. */
export function KindCounts({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  const counts = { song: 0, album: 0, live: 0 };
  for (const event of events) counts[event.kind] += 1;
  const items = (
    [
      ["song", "곡"],
      ["album", "앨범"],
      ["live", "공연"],
    ] as const
  ).filter(([kind]) => counts[kind] > 0);
  return (
    <span className={cn("flex flex-wrap gap-x-2.5 gap-y-0.5", className)}>
      {items.map(([kind, label]) => (
        <span key={kind} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("size-2.5 shrink-0", KIND_DOT_CLASS[kind])}
          />
          {label} {counts[kind]}
        </span>
      ))}
    </span>
  );
}
