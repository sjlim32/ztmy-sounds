import { describe, expect, test } from "vitest";
import {
  cellSortKey,
  DEFAULT_SORT,
  filterRows,
  nextSort,
  sortRows,
} from "./table-sort";
import type { StatRow } from "./types";

function row(key: string, rank: number, cells: StatRow["cells"]): StatRow {
  return { key, rank, name: key, sub: null, cells };
}

describe("cellSortKey", () => {
  test("날짜·숫자·발매 전후를 값으로 읽는다", () => {
    expect(cellSortKey("2024.01.31")).toBe(20240131);
    expect(cellSortKey({ date: "2023.05.01", label: "공연" })).toBe(20230501);
    expect(cellSortKey("1,234회")).toBe(1234);
    expect(cellSortKey("45%")).toBe(45);
    expect(cellSortKey("3/12곡")).toBe(3);
    expect(cellSortKey("발매 3일 전")).toBe(-3);
    expect(cellSortKey("발매 당일")).toBe(0);
    expect(cellSortKey("12일 만")).toBe(12);
    expect(cellSortKey("–")).toBeNull();
    expect(cellSortKey("콘서트")).toBe("콘서트");
  });
});

describe("sortRows", () => {
  const rows = [
    row("가", 1, ["10회", "–"]),
    row("다", 2, ["30회", "2024.01.01"]),
    row("나", 3, ["20회", "2023.01.01"]),
  ];

  test("값 열은 처음 누르면 큰 것부터, 다시 누르면 뒤집는다", () => {
    const first = nextSort(DEFAULT_SORT, 0);
    expect(first).toEqual({ column: 0, direction: "desc" });
    expect(sortRows(rows, first).map((r) => r.key)).toEqual(["다", "나", "가"]);
    const second = nextSort(first, 0);
    expect(sortRows(rows, second).map((r) => r.key)).toEqual([
      "가",
      "나",
      "다",
    ]);
  });

  test("값 없는 칸(–)은 방향과 상관없이 맨 뒤", () => {
    expect(
      sortRows(rows, { column: 1, direction: "desc" }).map((r) => r.key),
    ).toEqual(["다", "나", "가"]);
    expect(
      sortRows(rows, { column: 1, direction: "asc" }).map((r) => r.key),
    ).toEqual(["나", "다", "가"]);
  });

  test("이름은 가나다 순", () => {
    expect(
      sortRows(rows, { column: "name", direction: "asc" }).map((r) => r.key),
    ).toEqual(["가", "나", "다"]);
  });
});

describe("filterRows", () => {
  test("이름·아래 줄에서 띄어쓰기·대소문자 무시하고 찾는다", () => {
    const rows = [
      { ...row("Mirror Tune", 1, []), sub: "ミラーチューン" },
      row("새턴", 2, []),
    ];
    expect(filterRows(rows, "mirrortune").map((r) => r.key)).toEqual([
      "Mirror Tune",
    ]);
    expect(filterRows(rows, "チューン")).toHaveLength(1);
    expect(filterRows(rows, " ")).toHaveLength(2);
  });
});
