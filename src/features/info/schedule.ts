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
 * 공연 당일 시간표 — 축제 AREA, 집합, 공연 일정을 시간순 한 줄기로 합친 것.
 * /info의 일정표와 홈의 당일 안내가 같이 쓰므로 시간이 바뀌면 여기만 고친다.
 * 양일(10/10·11) 일정이 같아서 날짜별로 나누지 않았다.
 */
export const SCHEDULE: ScheduleItem[] = [
  { start: "09:30", label: "입장 및 참가권 판매", kind: "matsuri" },
  { start: "10:00", label: "축제 AREA 개장", kind: "matsuri" },
  {
    start: "10:30",
    end: "15:00",
    label: "SIDE STAGE '낮의 연회'",
    kind: "matsuri",
  },
  { start: "15:00", label: '일반 Area "A, B, C, G, H"', kind: "gather" },
  { start: "15:30", label: "개장", kind: "concert" },
  { start: "16:00", label: '프리미엄 Area "P1~P6"', kind: "gather" },
  { start: "16:15", label: '일반 Area "D, E, F, N"', kind: "gather" },
  { start: "17:30", label: "축제 AREA 종료", kind: "matsuri" },
  { start: "17:30", label: "개연", kind: "concert" },
];

export const SCHEDULE_NOTES = [
  "축제 AREA는 입장 무료, 각 워크샵 및 미니게임은 별도 참가권 판매",
  "※ 우천 결행 ・ 황천 중지",
];

/** 일정표의 "집합 장소 지도"로 펼쳐 보여줄 이미지. */
export const GATHER_MAP_IMAGES = [
  { src: "/assets/info/gather_map.webp", alt: "집합 장소 지도" },
  { src: "/assets/info/gather_02.webp", alt: "집합 시간·집합 장소 일람" },
];

// "2026.10.10" ~ "2026.10.11" → ["2026-10-10", "2026-10-11"]
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

// ["2026-10-10", "2026-10-11"] → "10/10(토)·11(일)"
export const SCHEDULE_DAYS_LABEL = SCHEDULE_DAYS.map((day, index) => {
  const [year, month, date] = day.split("-").map(Number);
  const weekday =
    WEEKDAYS[new Date(Date.UTC(year, month - 1, date)).getUTCDay()];
  const sameMonth =
    index > 0 && Number(SCHEDULE_DAYS[index - 1].split("-")[1]) === month;
  return `${sameMonth ? "" : `${month}/`}${date}(${weekday})`;
}).join("·");
