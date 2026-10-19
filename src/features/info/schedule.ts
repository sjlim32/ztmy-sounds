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

/**
 * 투어 첫 공연(히로시마 HBG홀) 당일 일정 안내.
 */
export const SCHEDULE: ScheduleItem[] = [
  { start: "17:00", label: "개장 (OPEN)", kind: "concert" },
  { start: "18:00", label: "개연 (START)", kind: "concert" },
];

export const SCHEDULE_NOTES = [
  "※ 공연별 개장/개연 시각은 투어 일정표를 확인해 주세요.",
  "※ 미취학 아동 입장 불가",
];

/** 일정표 펼침 시 보여줄 투어 스케줄 이미지. */
export const GATHER_MAP_IMAGES = [
  {
    src: "/assets/info/apicula-denki_schedule.webp",
    alt: "아피쿠라 전기 투어 일정",
  },
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
export const SCHEDULE_DAYS = listDays(
  getEventStartDate(originEvent),
  getEventEndDate(originEvent),
);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// ["2027-01-15"] → "1/15(금)"
export const SCHEDULE_DAYS_LABEL = SCHEDULE_DAYS.map((day, index) => {
  const [year, month, date] = day.split("-").map(Number);
  const weekday =
    WEEKDAYS[new Date(Date.UTC(year, month - 1, date)).getUTCDay()];
  const sameMonth =
    index > 0 && Number(SCHEDULE_DAYS[index - 1].split("-")[1]) === month;
  return `${sameMonth ? "" : `${month}/`}${date}(${weekday})`;
}).join("·");
