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
