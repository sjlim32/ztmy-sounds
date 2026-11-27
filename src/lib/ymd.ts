/**
 * "YYYY-MM-DD" 날짜 문자열 계산 — 공연·발매일은 시각 없는 날짜라 전부 UTC
 * 자정으로 보고 셈한다(보는 사람의 시간대에 따라 하루씩 밀리지 않게). 뒤에
 * 시각("T…")이 붙어 있어도 앞 10자만 쓴다.
 */

const DAY_MS = 86_400_000;

/** 1970-01-01부터 며칠째인지(날짜 차이 계산용). */
export function dayNumber(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** 날짜에 n일 더하기(빼기). */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** 두 날짜 사이 일수(to − from). */
export function diffDays(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

/** 요일 번호(일=0 … 토=6). */
export function weekdayIndex(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "2026-03-14" → "2026.03.14"(점 표기 — 연혁·곡 상세의 짧은 날짜). */
export function formatDotDate(date: string): string {
  return date.slice(0, 10).replaceAll("-", ".");
}

const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * "2023-04-21" → "4월 21일"(앞 0 없이) — weekday면 "4월 21일 (금)", year면 앞에 "2023년 ".
 * 투어 상세(공연 일정 목록·티켓·판 요약·비교 창)가 날짜를 한국어로 쓸 때.
 */
export function formatKoreanMonthDay(
  date: string,
  { year = false, weekday = false }: { year?: boolean; weekday?: boolean } = {},
): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const text = `${year ? `${y}년 ` : ""}${m}월 ${d}일`;
  return weekday ? `${text} (${KOREAN_WEEKDAYS[weekdayIndex(date)]})` : text;
}
