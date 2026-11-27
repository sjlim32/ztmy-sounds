import { describe, expect, test } from "vitest";
import { formatTourPeriod } from "./tour-period";

describe("formatTourPeriod", () => {
  test("해가 같으면 연도는 맨 앞에만", () => {
    expect(formatTourPeriod("2023-04-20", "2023-05-31")).toBe(
      "2023년 4월 20일 ~ 5월 31일",
    );
  });

  test("해를 넘기면 양쪽 다 연도", () => {
    expect(formatTourPeriod("2024-12-28", "2025-01-12")).toBe(
      "2024년 12월 28일 ~ 2025년 1월 12일",
    );
  });

  test("끝 날짜가 없거나 같은 날이면 하루", () => {
    expect(formatTourPeriod("2023-04-20", null)).toBe("2023년 4월 20일");
    expect(formatTourPeriod("2023-04-20", "2023-04-20")).toBe(
      "2023년 4월 20일",
    );
  });
});
