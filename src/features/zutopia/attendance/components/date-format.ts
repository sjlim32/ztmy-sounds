import { weekdayIndex } from "@/lib/ymd";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-03-14" → "2026.03.14 (토)" — 날짜 문자열 그대로 UTC로 읽어 시간대 영향이 없다. */
export function formatDateWithWeekday(date: string): string {
  return `${date.slice(0, 10).replaceAll("-", ".")} (${WEEKDAYS[weekdayIndex(date)]})`;
}
