import { describe, expect, test } from "vitest";
import { withArrivedUnits } from "@/features/zutopia/attendance/arrived-units";

const u = (id: string, date: string) => ({ id, date });

describe("withArrivedUnits", () => {
  test("빌드 뒤 오늘까지 온 예정 공연일을 최신순 앞에 붙인다", () => {
    const units = [u("past2", "2026-10-01"), u("past1", "2026-09-01")];
    const upcoming = [
      u("a", "2026-11-05"),
      u("b", "2026-11-06"),
      u("c", "2026-12-01"),
    ];
    expect(
      withArrivedUnits(units, upcoming, "2026-11-06").map((x) => x.id),
    ).toEqual(["b", "a", "past2", "past1"]);
  });

  test("오늘을 모르면(정적 HTML 단계) 그대로", () => {
    const units = [u("p", "2026-10-01")];
    expect(withArrivedUnits(units, [u("a", "2026-11-05")], null)).toBe(units);
  });
});
