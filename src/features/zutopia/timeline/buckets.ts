import { addDays, weekdayIndex } from "@/lib/ymd";
import type {
  TimelineEvent,
  TimelineKind,
} from "@/features/zutopia/timeline/events";

/** 확대 단계 — 연(해 요약) · 월(달 묶음) · 주(일정 하나하나). */
export type ZoomLevel = "year" | "month" | "week";

export interface Bucket {
  key: string;
  /** [start, end) YYYY-MM-DD */
  start: string;
  end: string;
  events: TimelineEvent[];
}

export { addDays };

/** 날짜가 든 해·달·주(월요일 시작)의 키와 [시작, 끝). */
export function bucketRange(
  date: string,
  level: ZoomLevel,
): { key: string; start: string; end: string } {
  const year = Number(date.slice(0, 4));
  if (level === "year")
    return {
      key: String(year),
      start: `${year}-01-01`,
      end: `${year + 1}-01-01`,
    };
  if (level === "month") {
    const month = Number(date.slice(5, 7));
    const next =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;
    return {
      key: date.slice(0, 7),
      start: `${date.slice(0, 7)}-01`,
      end: next,
    };
  }
  const weekday = (weekdayIndex(date) + 6) % 7; // 월=0 … 일=6
  const start = addDays(date, -weekday);
  return { key: start, start, end: addDays(start, 7) };
}

/** 일정을 시작일이 든 해·달·주로 묶는다. 시기순, 묶음 안은 들어온 순서. */
export function bucketEvents(
  events: TimelineEvent[],
  level: ZoomLevel,
): Bucket[] {
  const buckets = new Map<string, Bucket>();
  for (const event of events) {
    const range = bucketRange(event.date, level);
    const bucket = buckets.get(range.key);
    if (bucket) bucket.events.push(event);
    else buckets.set(range.key, { ...range, events: [event] });
  }
  return [...buckets.values()].sort((a, b) => a.start.localeCompare(b.start));
}

/** 범위 [start, end) 안의 달 눈금(매달 1일)이나 주 눈금(월요일). */
export function timeTicks(
  range: { start: string; end: string },
  level: "month" | "week",
): { date: string }[] {
  const ticks: { date: string }[] = [];
  let current =
    level === "month"
      ? bucketRange(range.start, "month").start
      : bucketRange(range.start, "week").start;
  if (current < range.start)
    current =
      level === "month"
        ? bucketRange(range.start, "month").end
        : addDays(current, 7);
  while (current < range.end) {
    ticks.push({ date: current });
    current =
      level === "month"
        ? bucketRange(current, "month").end
        : addDays(current, 7);
  }
  return ticks;
}

const HIGHLIGHT_ORDER: Record<TimelineKind, number> = {
  album: 0,
  live: 1,
  song: 2,
};

/** 요약에 보일 대표 일정 n개 — 앨범 → 공연 → 곡 순(같으면 날짜순). */
export function pickHighlights(
  events: TimelineEvent[],
  count: number,
): TimelineEvent[] {
  return [...events]
    .sort(
      (a, b) =>
        HIGHLIGHT_ORDER[a.kind] - HIGHLIGHT_ORDER[b.kind] ||
        a.date.localeCompare(b.date),
    )
    .slice(0, count);
}

/**
 * 지금 보고 있는 시기 문구 — 연: 화면에 보이는 첫 해 – 마지막 해, 월: 가운데
 * 날짜의 "2026년 3월", 주: 가운데 날짜가 든 주(월~일) "2026년 3월 16일 – 22일".
 */
export function viewLabel(
  level: ZoomLevel,
  centerDate: string,
  visibleStart: string,
  visibleEnd: string,
): string {
  if (level === "year") {
    const first = visibleStart.slice(0, 4);
    const last = visibleEnd.slice(0, 4);
    return first === last ? first : `${first} – ${last}`;
  }
  const year = Number(centerDate.slice(0, 4));
  const month = Number(centerDate.slice(5, 7));
  if (level === "month") return `${year}년 ${month}월`;
  const { start } = bucketRange(centerDate, "week");
  const end = addDays(start, 6);
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const tail =
    ey !== sy
      ? `${ey}년 ${em}월 ${ed}일`
      : em !== sm
        ? `${em}월 ${ed}일`
        : `${ed}일`;
  return `${sy}년 ${sm}월 ${sd}일 – ${tail}`;
}

/** 묶음 카드 그림 — 앨범이 있으면 앨범 커버 하나만, 없으면 대표 3개. */
export function clusterThumbs(events: TimelineEvent[]): TimelineEvent[] {
  const album = events.find((event) => event.kind === "album");
  return album ? [album] : pickHighlights(events, 3);
}
