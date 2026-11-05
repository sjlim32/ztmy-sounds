import { describe, expect, test } from "vitest";
import {
  daysBetween,
  formatDaysAgo,
  formatLiveDate,
  toSongLiveSummaries,
} from "@/features/zutopia/live-history/summary";
import type {
  LiveHistory,
  LiveUnit,
} from "@/features/zutopia/live-history/types";

function unit(overrides: Partial<LiveUnit> & { id: string }): LiveUnit {
  return {
    liveId: overrides.id.split(":")[0],
    date: "2026-03-14",
    type: "CONCERT",
    title: "ZUTOMAYO INTENSE II",
    titleKo: "즛토마요 인텐스 II",
    city: "서울",
    tourId: null,
    dayNumber: null,
    href: "/zutopia/lives/zomcra",
    songIds: [],
    imageUrl: null,
    groupImageUrl: null,
    ...overrides,
  };
}

describe("daysBetween", () => {
  test("시간대와 무관한 날짜 차", () => {
    expect(daysBetween("2026-03-14", "2026-11-05")).toBe(236);
    expect(daysBetween("2026-11-05", "2026-11-05")).toBe(0);
  });
});

describe("toSongLiveSummaries", () => {
  const history: LiveHistory = {
    upcoming: [],
    units: [
      unit({ id: "L:2026-03-14", tourId: "t1", dayNumber: 1 }),
      unit({
        id: "F:2025-08-16",
        date: "2025-08-16",
        type: "FESTIVAL",
        title: "SUMMER SONIC 2025",
        titleKo: null,
        city: "도쿄",
        href: "/zutopia/lives/sumso",
      }),
    ],
    statsBySongId: {
      s1: {
        count: 41,
        lastUnitId: "L:2026-03-14",
        firstUnitId: "F:2025-08-16",
      },
      s2: {
        count: 18,
        lastUnitId: "F:2025-08-16",
        firstUnitId: "F:2025-08-16",
      },
    },
  };

  test("공연명은 한국어 제목, 도시·DAY는 detail로 따로", () => {
    const summaries = toSongLiveSummaries(["s1", "s2"], history, {});
    expect(summaries.s1).toEqual({
      count: 41,
      last: {
        title: "즛토마요 인텐스 II",
        detail: "서울 DAY 1",
        date: "2026-03-14",
        href: "/zutopia/lives/zomcra",
      },
      first: {
        title: "SUMMER SONIC 2025",
        detail: "도쿄",
        date: "2025-08-16",
        href: "/zutopia/lives/sumso",
      },
    });
    expect(summaries.s2.last.title).toBe("SUMMER SONIC 2025");
  });

  test("어레인지 곡은 원곡 기록을 받는다", () => {
    const summaries = toSongLiveSummaries(["a1"], history, { a1: "s1" });
    expect(summaries.a1).toEqual(toSongLiveSummaries(["s1"], history, {}).s1);
  });

  test("기록 없는 곡은 키가 없다", () => {
    expect(toSongLiveSummaries(["none"], history, {})).toEqual({});
  });
});

describe("formatDaysAgo", () => {
  test("지난 일수, 오늘이면 '오늘'", () => {
    expect(formatDaysAgo("2026-03-14", "2026-11-05")).toBe("236일 전");
    expect(formatDaysAgo("2026-11-05", "2026-11-05")).toBe("오늘");
  });
});

describe("formatLiveDate", () => {
  test("점 구분 날짜", () => {
    expect(formatLiveDate("2026-03-14")).toBe("2026.03.14");
  });
});
