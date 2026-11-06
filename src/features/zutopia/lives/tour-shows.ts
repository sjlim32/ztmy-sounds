import { diffDays } from "@/lib/ymd";

/**
 * 투어 총 공연 횟수 — 공연일 행(lives)마다 시작~끝 날 수를 더한다. 한 행이 이틀
 * 공연(도쿄 DAY 1·2)이면 2회. 하루 공연·끝날 없음은 1회.
 */
export function countTourShows(
  dates: readonly { startDate: string; endDate: string | null }[],
): number {
  return dates.reduce(
    (sum, date) =>
      sum +
      (date.endDate
        ? Math.max(1, diffDays(date.startDate, date.endDate) + 1)
        : 1),
    0,
  );
}
