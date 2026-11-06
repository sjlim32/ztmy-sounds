import { describe, expect, test } from "vitest";
import { countTourShows } from "@/features/zutopia/lives/tour-shows";

describe("countTourShows", () => {
  test("공연일 행마다 시작~끝 날 수를 더한다(하루 공연은 1)", () => {
    expect(
      countTourShows([
        { startDate: "2026-02-28", endDate: "2026-03-01" },
        { startDate: "2026-03-14", endDate: null },
        { startDate: "2026-03-28", endDate: "2026-03-28" },
      ]),
    ).toBe(4);
    expect(countTourShows([])).toBe(0);
  });
});
