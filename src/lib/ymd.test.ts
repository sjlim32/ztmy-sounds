import { describe, expect, test } from "vitest";
import {
  addDays,
  dayNumber,
  diffDays,
  formatDotDate,
  weekdayIndex,
} from "@/lib/ymd";

describe("ymd", () => {
  test("addDays는 달·해를 넘긴다(시간대 무관)", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2025-12-31T23:00:00+09:00", 1)).toBe("2026-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  test("diffDays = to − from", () => {
    expect(diffDays("2024-01-01", "2025-01-01")).toBe(366);
    expect(diffDays("2026-03-02", "2026-03-01")).toBe(-1);
  });

  test("dayNumber 차이 = diffDays", () => {
    expect(dayNumber("2026-01-11") - dayNumber("2026-01-01")).toBe(10);
  });

  test("weekdayIndex: 일=0 … 토=6", () => {
    expect(weekdayIndex("2026-11-05")).toBe(4); // 목
  });
  test("formatDotDate", () => {
    expect(formatDotDate("2026-03-14T00:00:00+09:00")).toBe("2026.03.14");
  });
});
