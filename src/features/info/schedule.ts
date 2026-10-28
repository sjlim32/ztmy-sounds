import { getEventEndDate, getEventStartDate, originEvent } from "@/data/event";

export type ScheduleKind = "matsuri" | "gather" | "concert";

export interface ScheduleItem {
  /** 현지(일본) 시각 "HH:mm" */
  start: string;
  /** 구간이 있는 일정만. 없으면 다음 일정 시작 전까지를 그 일정의 시간대로 본다. */
  end?: string;
  label: string;
  kind: ScheduleKind;
}

export const SCHEDULE_KIND_LABEL: Record<ScheduleKind, string> = {
  matsuri: "축제",
  gather: "집합",
  concert: "공연",
};

/** 공연 하나 — 날짜("YYYY-MM-DD")와 개연 시각("HH:mm", 현지). */
export interface ScheduleShow {
  date: string;
  time: string;
  venue?: string;
  /** "1/15(금)" 같은 표시용 날짜 */
  datesLabel?: string;
}

// 개장은 모든 공연이 개연 1시간 전(투어 각주 — 오카야마 4/11도 17:00 개연·16:00 개장).
const OPEN_BEFORE_MINUTES = 60;

function shiftTime(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** 그 공연의 당일 시간표 — 개장(OPEN) → 개연(START). */
export function getShowSchedule(time: string): ScheduleItem[] {
  return [
    {
      start: shiftTime(time, -OPEN_BEFORE_MINUTES),
      label: "개장 (OPEN)",
      kind: "concert",
    },
    { start: time, label: "개연 (START)", kind: "concert" },
  ];
}

export const SCHEDULE_NOTES = [
  "※ 개장은 개연 1시간 전 기준입니다.",
  "※ 미취학 아동 입장 불가",
];

// "2027.01.15" ~ "2027.01.15" → ["2027-01-15"]
function listDays(start: string, end: string): string[] {
  const toMs = (date: string) => {
    const [year, month, day] = date.split(".").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  const days: string[] = [];
  for (let ms = toMs(start); ms <= toMs(end); ms += 86_400_000) {
    days.push(new Date(ms).toISOString().slice(0, 10));
  }
  return days;
}

// /info가 안내하는 공연은 originEvent와 같은 공연이다(info.tsx 주석 참고).
// 투어면 공연 목록 그대로, 단일·다일 공연이면 날마다 같은 시각으로.
export const SCHEDULE_SHOWS: ScheduleShow[] = originEvent.performances
  ? originEvent.performances
  : listDays(getEventStartDate(originEvent), getEventEndDate(originEvent)).map(
      (date) => ({ date, time: originEvent.time }),
    );

export const SCHEDULE_DAYS = SCHEDULE_SHOWS.map((show) => show.date);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 투어 기간 라벨 ("1월 15일 ~ 5월 23일" 또는 단일/다일 공연 라벨)
export const SCHEDULE_DAYS_LABEL =
  originEvent.dateDisplay ??
  SCHEDULE_DAYS.map((day, index) => {
    const [year, month, date] = day.split("-").map(Number);
    const weekday =
      WEEKDAYS[new Date(Date.UTC(year, month - 1, date)).getUTCDay()];
    const sameMonth =
      index > 0 && Number(SCHEDULE_DAYS[index - 1].split("-")[1]) === month;
    return `${sameMonth ? "" : `${month}/`}${date}(${weekday})`;
  }).join("·");
