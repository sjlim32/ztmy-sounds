import { cn } from "@/lib/utils";
import {
  assignLanes,
  type TimelineEvent,
} from "@/features/zutopia/timeline/events";
import { textLines } from "@/features/zutopia/timeline/interaction";
import { eventDateText, eventExtras } from "./kind-style";
import { Dot, DOT, EventCard, EVENT_TEXT_WIDTH, Stem } from "./parts";

/** 카드 최대 폭(그림 + 제목 10rem). 같은 줄의 다음 일정은 이만큼 떨어져야 한다. */
export const WEEK_CARD_WIDTH = 248;
/** 공연 카드 아래: 틈(4) + 기간 막대(6) */
const LIVE_BAR = 10;
/** 줄과 줄 사이 */
const LANE_SPACING = 8;
export const STEM_GAP = 16;

/**
 * 카드 높이 어림 — 제목을 말줄임 없이 줄바꿈하므로 글 길이로 줄 수를 어림한다
 * (EventCard와 같은 글자 크기·줄 간격). 넉넉하게 잡아 카드가 겹치지 않게.
 */
function eventCardHeight(event: TimelineEvent): number {
  const extras = eventExtras(event);
  const lines = (text: string | null | undefined) =>
    textLines(text ?? "", EVENT_TEXT_WIDTH, 14);
  const text =
    (event.tag ? lines([event.tag, ...extras].join(" · ")) * 17.5 : 0) +
    lines(event.label) * 19.25 +
    lines(event.subLabel) * 17.5 +
    lines([eventDateText(event), ...(event.tag ? [] : extras)].join(" · ")) *
      17.5;
  const thumb = event.kind === "album" ? 56 : 40;
  return 12 + Math.max(thumb, text);
}

/** 줄마다 높이(그 줄에서 가장 큰 카드) → 줄 i가 시작하는 위치(누적) */
function laneOffsets(
  events: TimelineEvent[],
  lanes: Map<string, number>,
  extra: number,
): number[] {
  const heights: number[] = [];
  for (const event of events) {
    const lane = lanes.get(event.id) ?? 0;
    heights[lane] = Math.max(
      heights[lane] ?? 0,
      eventCardHeight(event) + extra + LANE_SPACING,
    );
  }
  const offsets = [0];
  for (const height of heights) offsets.push(offsets.at(-1)! + (height ?? 0));
  return offsets;
}

/** 주 단계 줄 나누기 — 높이 계산(축 위치)에 쓰려고 바깥에서 먼저 부른다. */
export function weekLayout(events: TimelineEvent[], pxPerDay: number) {
  const cardDays = Math.ceil((WEEK_CARD_WIDTH + 12) / pxPerDay);
  const lives = events.filter((event) => event.kind === "live");
  const releases = events.filter((event) => event.kind !== "live");
  const liveLanes = assignLanes(lives, cardDays);
  const releaseLanes = assignLanes(releases, cardDays);
  const liveOffsets = laneOffsets(lives, liveLanes, LIVE_BAR);
  const releaseOffsets = laneOffsets(releases, releaseLanes, 0);
  return {
    lives,
    releases,
    liveLanes,
    releaseLanes,
    liveOffsets,
    releaseOffsets,
    liveBand: liveOffsets.at(-1) || 72,
    releaseBand: releaseOffsets.at(-1) || 80,
  };
}

/**
 * 주 단계 — 일정 하나하나를 실제 날짜 위치에 카드로. 공연은 축 위(투어는 카드
 * 아래 실제 기간 막대), 발매는 축 아래, 카드가 겹치면 다른 줄(assignLanes).
 */
export function WeekView({
  layout,
  x,
  axisY,
  attendedCounts,
}: {
  layout: ReturnType<typeof weekLayout>;
  x: (date: string) => number;
  axisY: number;
  attendedCounts: ReadonlyMap<string, number>;
}) {
  const {
    lives,
    releases,
    liveLanes,
    releaseLanes,
    liveOffsets,
    releaseOffsets,
  } = layout;
  const releaseTop = axisY + STEM_GAP + 4;
  const liveBottom = (event: TimelineEvent) =>
    axisY - STEM_GAP - liveOffsets[liveLanes.get(event.id) ?? 0];
  const releaseCardTop = (event: TimelineEvent) =>
    releaseTop + releaseOffsets[releaseLanes.get(event.id) ?? 0];

  return (
    <>
      {lives.map((event) => (
        <Stem
          key={`stem:${event.id}`}
          left={x(event.date)}
          top={liveBottom(event)}
          height={axisY - liveBottom(event)}
        />
      ))}
      {releases.map((event) => (
        <Stem
          key={`stem:${event.id}`}
          left={x(event.date)}
          top={axisY}
          height={releaseCardTop(event) - axisY}
        />
      ))}
      {[...lives, ...releases].map((event) => (
        <Dot
          key={event.id}
          kind={event.kind}
          left={x(event.date)}
          axisY={axisY}
        />
      ))}
      {lives.map((event) => {
        const left = x(event.date);
        const barWidth = event.endDate
          ? Math.max(DOT, x(event.endDate) - left + DOT)
          : 0;
        return (
          <div
            key={event.id}
            className="absolute z-20 flex flex-col items-start gap-1 focus-within:z-40 hover:z-40"
            // 아래 끝(기간 막대)을 줄의 바닥에 맞춘다 — 카드 높이가 제목 길이에 따라 달라서.
            style={{
              left: left - 2,
              top: liveBottom(event),
              transform: "translateY(-100%)",
            }}
          >
            <EventCard
              event={event}
              attended={attendedCounts.get(event.id) ?? 0}
            />
            <span
              aria-hidden
              className={cn(
                "block h-1.5 rounded-sm",
                barWidth > 0 && "bg-ztmy-purple",
              )}
              style={{ width: barWidth, marginLeft: 2 }}
            />
          </div>
        );
      })}
      {releases.map((event) => (
        <div
          key={event.id}
          className="absolute z-20 focus-within:z-40 hover:z-40"
          style={{ left: x(event.date) - 2, top: releaseCardTop(event) }}
        >
          <EventCard event={event} attended={0} />
        </div>
      ))}
    </>
  );
}
