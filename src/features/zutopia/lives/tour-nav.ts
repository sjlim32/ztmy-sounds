import { formatKoreanMonthDay } from "@/lib/ymd";
import type { TourDateEntry } from "@/features/zutopia/lives/types";

/**
 * 투어 상세 왼쪽 "공연 일정" 고르는 목록(TourDateNav)의 순수 규칙.
 */
type NavDate = Pick<TourDateEntry, "id" | "city" | "startDate" | "canceled">;

/**
 * 처음 보일 것 — 해시로 고른 날짜가 있으면 그날, 없으면 투어 공통 세트리스트(null), 공통
 * 세트리스트가 없는 투어면 첫 공연일(취소 제외, 없으면 null).
 */
export function defaultSelectedId(
  hasCommon: boolean,
  dates: readonly NavDate[],
  hashId: string | null,
): string | null {
  if (hashId) return hashId;
  if (hasCommon) return null;
  return dates.find((date) => !date.canceled)?.id ?? null;
}

/**
 * 모바일 가로 탭의 공연일 이름 — 도시가 바뀔 때만 "오사카 4월 20일", 같은 도시가 이어지면
 * "4월 21일". 취소된 공연일은 고를 수 없어 뺀다.
 */
export function stripLabels(dates: readonly NavDate[]): Map<string, string> {
  const labels = new Map<string, string>();
  let lastCity: string | null = null;
  for (const date of dates) {
    if (date.canceled) continue;
    const day = formatKoreanMonthDay(date.startDate);
    labels.set(date.id, date.city === lastCity ? day : `${date.city} ${day}`);
    lastCity = date.city;
  }
  return labels;
}
