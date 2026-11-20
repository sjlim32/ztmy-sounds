import { diffDays } from "@/lib/ymd";

/**
 * 공연 일정의 묶음 — 같은 도시·공연장에서 연달아 열린 공연일을 하나로(순수 함수).
 * - 같은 공연 행을 날마다·회차마다 나눈 공연일(id가 "공연id:…")은 늘 같은 묶음.
 * - 따로 등록된 공연이라도 목록에서 바로 이어지고, 도시·공연장이 같고, 날짜가 같은
 *   날이거나 하루 차이면 같은 묶음.
 * 목록 순서는 그대로 두고 이웃끼리만 묶는다.
 */
export interface GroupableDate {
  id: string;
  /** "YYYY-MM-DD" */
  startDate: string;
  city: string;
  venue: string;
}

const sourceId = (id: string) => id.split(":")[0];

export function groupTourDates<T extends GroupableDate>(dates: T[]): T[][] {
  const groups: T[][] = [];
  for (const date of dates) {
    const current = groups.at(-1);
    const previous = current?.at(-1);
    const joins =
      !!previous &&
      (sourceId(previous.id) === sourceId(date.id) ||
        (previous.city === date.city &&
          previous.venue === date.venue &&
          diffDays(previous.startDate, date.startDate) >= 0 &&
          diffDays(previous.startDate, date.startDate) <= 1));
    if (joins) current!.push(date);
    else groups.push([date]);
  }
  return groups;
}
