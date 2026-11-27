import { describe, expect, test } from "vitest";
import { defaultSelectedId, stripLabels } from "./tour-nav";

const d = (id: string, city: string, startDate: string, canceled = false) => ({
  id,
  city,
  startDate,
  canceled,
});

describe("defaultSelectedId", () => {
  const dates = [
    d("x", "오사카", "2023-04-19", true),
    d("a", "오사카", "2023-04-20"),
  ];

  test("해시로 고른 날짜가 먼저", () => {
    expect(defaultSelectedId(true, dates, "a")).toBe("a");
    expect(defaultSelectedId(false, dates, "a")).toBe("a");
  });

  test("해시가 없으면 공통 세트리스트(null), 공통이 없으면 첫 비취소 공연일", () => {
    expect(defaultSelectedId(true, dates, null)).toBeNull();
    expect(defaultSelectedId(false, dates, null)).toBe("a");
    expect(defaultSelectedId(false, [], null)).toBeNull();
  });
});

describe("stripLabels", () => {
  test("도시가 바뀔 때만 도시 이름, 이어지면 날짜만, 취소일은 빼고", () => {
    expect([
      ...stripLabels([
        d("a", "오사카", "2023-04-20"),
        d("b", "오사카", "2023-04-21"),
        d("x", "나고야", "2023-04-26", true),
        d("c", "나고야", "2023-04-27"),
        d("e", "오사카", "2023-05-30"),
      ]),
    ]).toEqual([
      ["a", "오사카 4월 20일"],
      ["b", "4월 21일"],
      ["c", "나고야 4월 27일"],
      ["e", "오사카 5월 30일"],
    ]);
  });
});
