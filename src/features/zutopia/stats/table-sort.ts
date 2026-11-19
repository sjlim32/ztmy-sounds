import type { StatCell, StatRow } from "./types";

/**
 * 전체 순위표의 정렬·검색(순수 함수 — StatsView가 쓰고 테스트한다). 칸은 화면에
 * 그대로 나가는 글자라, 정렬할 땐 글자에서 값을 다시 읽는다:
 * - 날짜("2024.01.31", 공연 칸의 date) → 날짜 순
 * - 숫자가 든 글자("1,234회", "45%", "403일", "3/12곡") → 첫 숫자
 *   ("발매 3일 전"처럼 "전"으로 끝나면 음수, "발매 당일"은 0)
 * - 숫자가 없는 글자 → 가나다 순, "–"(값 없음)는 방향과 상관없이 맨 뒤
 */
export type SortKey = number | string | null;

const DATE = /^(\d{4})\.(\d{2})\.(\d{2})/;
const NUMBER = /-?\d[\d,]*(?:\.\d+)?/;

function textKey(text: string): SortKey {
  const trimmed = text.trim();
  if (trimmed === "" || trimmed === "–" || trimmed === "없음") return null;
  const date = trimmed.match(DATE);
  if (date) return Number(`${date[1]}${date[2]}${date[3]}`);
  if (trimmed === "발매 당일") return 0;
  const number = trimmed.match(NUMBER);
  if (number) {
    const value = Number(number[0].replace(/,/g, ""));
    return /전$/.test(trimmed) ? -value : value;
  }
  return trimmed;
}

export function cellSortKey(cell: StatCell | undefined): SortKey {
  if (cell == null) return null;
  return textKey(typeof cell === "string" ? cell : cell.date);
}

/** 정렬 기준 — "rank"(기본 순위), "name"(이름), 또는 칸 번호. */
export type SortColumn = "rank" | "name" | number;
export interface SortState {
  column: SortColumn;
  direction: "asc" | "desc";
}

export const DEFAULT_SORT: SortState = { column: "rank", direction: "asc" };

function compareKeys(a: SortKey, b: SortKey): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "ko");
}

/** 같은 열을 다시 누르면 방향을 뒤집고, 다른 열이면 그 열의 기본 방향(값 열은 큰 것부터). */
export function nextSort(current: SortState, column: SortColumn): SortState {
  if (current.column === column)
    return {
      column,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  return { column, direction: typeof column === "number" ? "desc" : "asc" };
}

export function sortRows(rows: StatRow[], sort: SortState): StatRow[] {
  const keyOf = (row: StatRow): SortKey =>
    sort.column === "rank"
      ? row.rank
      : sort.column === "name"
        ? row.name
        : cellSortKey(row.cells[sort.column]);
  const sign = sort.direction === "asc" ? 1 : -1;
  // 같은 값이면 원래 순위 순서를 지킨다(안정 정렬 + 순위).
  return [...rows].sort((a, b) => {
    const [ka, kb] = [keyOf(a), keyOf(b)];
    if (ka === null || kb === null)
      return ka === kb ? a.rank - b.rank : ka === null ? 1 : -1;
    return sign * compareKeys(ka, kb) || a.rank - b.rank;
  });
}

/** 이름·아래 줄(원제·날짜·도시)에서 찾는다 — 대소문자·띄어쓰기 무시. */
export function filterRows(rows: StatRow[], query: string): StatRow[] {
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, "");
  const needle = normalize(query);
  if (!needle) return rows;
  return rows.filter((row) =>
    normalize(`${row.name} ${row.sub ?? ""}`).includes(needle),
  );
}
