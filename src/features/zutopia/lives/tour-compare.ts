import type { TourDateEntry } from "@/features/zutopia/lives/types";

/**
 * 투어 상세 "세트리스트 비교하기"(TourCompare)에서 고를 수 있는 공연일과 처음 열 때 고를
 * 두 날. 취소된 날·세트리스트가 아직 없는 날은 비교할 게 없어 뺀다.
 */
type ComparableDate = Pick<TourDateEntry, "id" | "canceled" | "setlist">;

export function comparableDates<T extends ComparableDate>(
  dates: readonly T[],
): T[] {
  return dates.filter((date) => !date.canceled && date.setlist.length > 0);
}

/**
 * 처음 열 때의 [A, B] — 고른 날이 있으면 그날과 바로 앞 공연일(첫 공연일이면 다음
 * 공연일), 없으면 첫·마지막 공연일. 비교할 공연일이 둘 미만이면 null(비교 버튼 없음).
 */
export function defaultComparePair(
  dates: readonly ComparableDate[],
  selectedId: string | null,
): [string, string] | null {
  const ids = comparableDates(dates).map((date) => date.id);
  if (ids.length < 2) return null;
  const index = selectedId ? ids.indexOf(selectedId) : -1;
  if (index < 0) return [ids[0], ids.at(-1)!];
  return [ids[index], ids[index === 0 ? 1 : index - 1]];
}
