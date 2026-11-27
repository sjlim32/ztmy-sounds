import { describe, expect, test } from "vitest";
import {
  versionEndsOn,
  versionForDate,
  versionsForDays,
  versionSpan,
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

describe("versionsForDays", () => {
  const versions = [
    v("v1", "2023-04-20"),
    v("v2", "2023-04-21"),
    v("v3", "2023-04-27"),
  ];

  test("판 경계에 걸친 이틀 공연은 날마다 그날의 판", () => {
    expect(
      versionsForDays(versions, "2023-04-20", 2).map((x) => x?.id),
    ).toEqual(["v1", "v2"]);
    expect(
      versionsForDays(versions, "2023-04-27", 2).map((x) => x?.id),
    ).toEqual(["v3", "v3"]);
  });

  test("직접 지정한 판은 모든 날, 판이 없으면 null, 0일은 하루로", () => {
    expect(
      versionsForDays(versions, "2023-04-20", 2, "v3").map((x) => x?.id),
    ).toEqual(["v3", "v3"]);
    expect(versionsForDays([], "2023-04-20", 2)).toEqual([null, null]);
    expect(versionsForDays(versions, "2023-04-21", 0)).toHaveLength(1);
  });
});

describe("versionEndsOn", () => {
  test("다음 판 시작 전날, 마지막 판은 null", () => {
    const versions = [v("v1", "2025-03-29"), v("v2", "2025-04-28")];
    expect(versionEndsOn(versions, versions[0])).toBe("2025-04-27");
    expect(versionEndsOn(versions, versions[1])).toBeNull();
  });
});

describe("versionSpan", () => {
  const date = (
    city: string,
    startDate: string,
    endDate: string | null = null,
    canceled = false,
  ) => ({ city, startDate, endDate, canceled });

  test("첫 공연일 ~ 마지막 공연의 끝날, 도시는 날짜 순서대로 한 번씩, 횟수는 이틀 공연을 2회로 — 취소일은 빼고", () => {
    expect(
      versionSpan([
        date("도쿄", "2023-05-30", "2023-05-31"),
        date("가나가와", "2023-04-20", "2023-04-21"),
        date("삿포로", "2023-06-02", null, true),
        date("도쿄", "2023-05-01"),
        date("아이치", "2023-04-27"),
      ]),
    ).toEqual({
      start: "2023-04-20",
      end: "2023-05-31",
      cities: ["가나가와", "아이치", "도쿄"],
      shows: 6,
    });
  });

  test("하루 공연이면 끝날은 그날, 공연일이 없으면 null", () => {
    expect(versionSpan([date("오사카", "2023-04-20")])).toEqual({
      start: "2023-04-20",
      end: "2023-04-20",
      cities: ["오사카"],
      shows: 1,
    });
    expect(versionSpan([date("오사카", "2023-04-20", null, true)])).toBeNull();
  });
});
