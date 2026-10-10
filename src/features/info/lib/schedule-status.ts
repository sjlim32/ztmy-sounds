import type { ScheduleItem } from "@/features/info/schedule";

export type ScheduleItemState = "past" | "now" | "upcoming";

export type ScheduleStatus =
  | { phase: "before"; daysUntil: number }
  | {
      phase: "today";
      states: ScheduleItemState[];
      /** 아직 시작 전인 첫 일정. 전부 시작했으면 null. */
      nextIndex: number | null;
    }
  | { phase: "ended" };

// 일정표의 시각은 공연장 현지(일본) 시각이라, 방문자 기기의 시간대와
// 무관하게 일본 시각으로 "지금"을 구한다(한국과 시차 없음).
const VENUE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getVenueNow(nowMs: number): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    VENUE_TIME_FORMATTER.formatToParts(nowMs).map((part) => [
      part.type,
      part.value,
    ]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/**
 * 지금이 공연 전/당일/종료 후 중 언제인지, 당일이면 각 일정이 지났는지·
 * 진행 중인지를 계산한다. end가 없는 일정은 다음(더 늦은) 일정이 시작할
 * 때까지를 그 일정의 시간대로 보고, 마지막 일정은 그날 끝까지로 본다.
 */
export function getScheduleStatus(
  nowMs: number,
  days: string[],
  items: ScheduleItem[],
): ScheduleStatus {
  const { date, minutes } = getVenueNow(nowMs);

  if (!days.includes(date)) {
    const nextDay = days.find((day) => day > date);
    return nextDay
      ? { phase: "before", daysUntil: dayDiff(date, nextDay) }
      : { phase: "ended" };
  }

  const states = items.map((item): ScheduleItemState => {
    const start = toMinutes(item.start);
    if (minutes < start) return "upcoming";

    const laterStart = items
      .map((other) => toMinutes(other.start))
      .find((otherStart) => otherStart > start);
    const end = item.end ? toMinutes(item.end) : (laterStart ?? 24 * 60);
    return minutes < end ? "now" : "past";
  });

  const nextIndex = states.indexOf("upcoming");
  return {
    phase: "today",
    states,
    nextIndex: nextIndex === -1 ? null : nextIndex,
  };
}
