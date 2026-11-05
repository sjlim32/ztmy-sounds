import { cn } from "@/lib/utils";
import {
  assignLanes,
  type TimelineEvent,
} from "@/features/zutopia/timeline/events";
import { Dot, DOT, EventCard, Stem } from "./parts";

/** 카드 최대 폭(그림 + 제목 10rem). 같은 줄의 다음 일정은 이만큼 떨어져야 한다. */
export const WEEK_CARD_WIDTH = 248;
/** 공연 한 줄: 카드(52) + 틈(4) + 기간 막대(6). */
const LIVE_BLOCK = 62;
export const LIVE_LANE = 68;
/** 발매 한 줄: 앨범 카드(분류 + 한국어 + 일본어 + 날짜 네 줄, 약 84)가 가장 크다. */
export const RELEASE_LANE = 92;
export const STEM_GAP = 16;

function laneCount(lanes: Map<string, number>) {
  let max = -1;
  for (const lane of lanes.values()) max = Math.max(max, lane);
  return Math.max(1, max + 1);
}

/** 주 단계 줄 나누기 — 높이 계산(축 위치)에 쓰려고 바깥에서 먼저 부른다. */
export function weekLayout(events: TimelineEvent[], pxPerDay: number) {
  const cardDays = Math.ceil((WEEK_CARD_WIDTH + 12) / pxPerDay);
  const lives = events.filter((event) => event.kind === "live");
  const releases = events.filter((event) => event.kind !== "live");
  const liveLanes = assignLanes(lives, cardDays);
  const releaseLanes = assignLanes(releases, cardDays);
  return {
    lives,
    releases,
    liveLanes,
    releaseLanes,
    liveBand: laneCount(liveLanes) * LIVE_LANE,
    releaseBand: laneCount(releaseLanes) * RELEASE_LANE,
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
  const { lives, releases, liveLanes, releaseLanes } = layout;
  const releaseTop = axisY + STEM_GAP + 4;
  const liveBottom = (event: TimelineEvent) =>
    axisY - STEM_GAP - (liveLanes.get(event.id) ?? 0) * LIVE_LANE;
  const releaseCardTop = (event: TimelineEvent) =>
    releaseTop + (releaseLanes.get(event.id) ?? 0) * RELEASE_LANE;

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
            style={{ left: left - 2, top: liveBottom(event) - LIVE_BLOCK }}
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
