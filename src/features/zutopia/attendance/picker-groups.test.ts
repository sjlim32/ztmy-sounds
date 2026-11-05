import { describe, expect, test } from "vitest";
import { groupUnitsByYear } from "@/features/zutopia/attendance/picker-groups";
import type { LiveUnit } from "@/features/zutopia/live-history/types";

function unit(
  liveId: string,
  date: string,
  tourId: string | null = null,
): LiveUnit {
  return {
    id: `${liveId}:${date}`,
    liveId,
    date,
    type: "CONCERT",
    title: `${liveId}-ja`,
    titleKo: `${liveId}-ko`,
    city: "서울",
    tourId,
    dayNumber: null,
    href: null,
    songIds: [],
    imageUrl: null,
    groupImageUrl: `${tourId ?? liveId}.webp`,
  };
}

// 최신순으로 들어온다(buildLiveUnits 결과와 같은 순서).
const units = [
  unit("fes", "2026-07-25"),
  unit("t-b", "2026-03-01", "tour"),
  unit("t-a", "2026-02-28", "tour"),
  unit("x", "2025-12-31", "winter"),
  unit("y", "2025-11-02"),
  unit("y", "2025-11-01"),
];

describe("groupUnitsByYear", () => {
  test("연도 최신순, 연도 안 묶음도 최신순, 묶음 안은 날짜순", () => {
    const years = groupUnitsByYear(units);
    expect(years.map((year) => year.year)).toEqual(["2026", "2025"]);
    expect(years[0].groups.map((group) => group.key)).toEqual(["fes", "tour"]);
    expect(years[0].groups[1].units.map((u) => u.date)).toEqual([
      "2026-02-28",
      "2026-03-01",
    ]);
    expect(years[1].groups.map((group) => group.key)).toEqual(["winter", "y"]);
  });

  test("묶음 제목은 한국어 우선, 그림은 묶음 대표 그림", () => {
    const [first] = groupUnitsByYear(units)[0].groups;
    expect(first.title).toBe("fes-ko");
    expect(first.imageUrl).toBe("fes.webp");
  });

  test("해를 넘기는 투어는 첫 공연일의 해에 둔다", () => {
    const years = groupUnitsByYear([
      unit("b", "2026-01-10", "cross"),
      unit("a", "2025-12-20", "cross"),
    ]);
    expect(years.map((year) => year.year)).toEqual(["2025"]);
    expect(years[0].groups[0].units).toHaveLength(2);
  });

  test("연도마다 공연일 수를 센다", () => {
    const years = groupUnitsByYear(units);
    expect(years.map((year) => year.unitIds.length)).toEqual([3, 3]);
  });
});
