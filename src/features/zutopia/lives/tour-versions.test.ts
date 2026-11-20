import { describe, expect, test } from "vitest";
import {
  versionEndsOn,
  versionForDate,
  type TourVersion,
} from "./tour-versions";

const v = (id: string, startsOn: string): TourVersion => ({
  id,
  startsOn,
  label: null,
  fixed: false,
});

describe("versionForDate", () => {
  const versions = [v("v2", "2025-04-28"), v("v1", "2025-03-29")];

  test("그 날짜 이전에 시작한 판 중 가장 늦은 판(시작일 당일 포함)", () => {
    expect(versionForDate(versions, "2025-04-20")?.id).toBe("v1");
    expect(versionForDate(versions, "2025-04-28")?.id).toBe("v2");
    expect(versionForDate(versions, "2025-05-18T00:00:00+00:00")?.id).toBe(
      "v2",
    );
  });

  test("첫 판보다 앞선 공연일은 첫 판, 판이 없으면 null", () => {
    expect(versionForDate(versions, "2025-01-01")?.id).toBe("v1");
    expect(versionForDate([], "2025-01-01")).toBeNull();
  });

  test("공연일에 직접 지정한 판이 날짜보다 먼저(없는 id면 날짜로)", () => {
    expect(versionForDate(versions, "2025-05-01", "v1")?.id).toBe("v1");
    expect(versionForDate(versions, "2025-05-01", "gone")?.id).toBe("v2");
  });
});

describe("versionEndsOn", () => {
  test("다음 판 시작 전날, 마지막 판은 null", () => {
    const versions = [v("v1", "2025-03-29"), v("v2", "2025-04-28")];
    expect(versionEndsOn(versions, versions[0])).toBe("2025-04-27");
    expect(versionEndsOn(versions, versions[1])).toBeNull();
  });
});
