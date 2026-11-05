import { describe, expect, test } from "vitest";
import {
  bucketEvents,
  bucketRange,
  pickHighlights,
  timeTicks,
  viewLabel,
  clusterThumbs,
  addDays,
} from "@/features/zutopia/timeline/buckets";
import type { TimelineEvent } from "@/features/zutopia/timeline/events";

function ev(
  id: string,
  date: string,
  kind: TimelineEvent["kind"] = "song",
): TimelineEvent {
  return {
    id,
    kind,
    date,
    endDate: null,
    label: id,
    subLabel: null,
    href: null,
    unitIds: [],
    newSongCount: 0,
    imageUrl: null,
    tag: null,
  };
}

describe("bucketRange", () => {
  test("해·달·주(월요일 시작)의 [시작, 끝)", () => {
    expect(bucketRange("2026-03-18", "year")).toEqual({
      key: "2026",
      start: "2026-01-01",
      end: "2027-01-01",
    });
    expect(bucketRange("2026-12-18", "month")).toEqual({
      key: "2026-12",
      start: "2026-12-01",
      end: "2027-01-01",
    });
    // 2026-03-18은 수요일 → 그 주 월요일 03-16
    expect(bucketRange("2026-03-18", "week")).toEqual({
      key: "2026-03-16",
      start: "2026-03-16",
      end: "2026-03-23",
    });
    // 일요일은 앞 주
    expect(bucketRange("2026-03-22", "week").start).toBe("2026-03-16");
  });
});

describe("bucketEvents", () => {
  test("시작일 기준으로 묶고 시기순", () => {
    const buckets = bucketEvents(
      [ev("b", "2026-03-20"), ev("a", "2026-03-02"), ev("c", "2025-12-31")],
      "month",
    );
    expect(buckets.map((b) => [b.key, b.events.map((e) => e.id)])).toEqual([
      ["2025-12", ["c"]],
      ["2026-03", ["b", "a"]],
    ]);
  });
});

describe("timeTicks", () => {
  test("달 눈금은 매달 1일", () => {
    expect(
      timeTicks({ start: "2025-11-01", end: "2026-02-01" }, "month").map(
        (t) => t.date,
      ),
    ).toEqual(["2025-11-01", "2025-12-01", "2026-01-01"]);
  });

  test("주 눈금은 범위 안의 월요일", () => {
    expect(
      timeTicks({ start: "2026-03-01", end: "2026-03-20" }, "week").map(
        (t) => t.date,
      ),
    ).toEqual(["2026-03-02", "2026-03-09", "2026-03-16"]);
  });
});

describe("pickHighlights", () => {
  test("앨범 → 공연 → 곡 순으로 n개", () => {
    const picked = pickHighlights(
      [
        ev("s1", "2026-01-01"),
        ev("l1", "2026-02-01", "live"),
        ev("a1", "2026-03-01", "album"),
        ev("s2", "2026-04-01"),
      ],
      3,
    );
    expect(picked.map((e) => e.id)).toEqual(["a1", "l1", "s1"]);
  });
});

describe("addDays", () => {
  test("달·해를 넘긴다", () => {
    expect(addDays("2025-12-30", 3)).toBe("2026-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("viewLabel", () => {
  test("연: 보이는 첫 해 – 마지막 해(같으면 하나)", () => {
    expect(viewLabel("year", "2022-06-01", "2019-03-01", "2026-02-01")).toBe(
      "2019 – 2026",
    );
    expect(viewLabel("year", "2022-06-01", "2022-01-05", "2022-12-01")).toBe(
      "2022",
    );
  });

  test("월: 가운데 날짜의 해·달", () => {
    expect(viewLabel("month", "2026-03-18", "2026-01-01", "2026-06-01")).toBe(
      "2026년 3월",
    );
  });

  test("주: 가운데 날짜가 든 주(월~일)", () => {
    expect(viewLabel("week", "2026-03-18", "2026-03-01", "2026-04-01")).toBe(
      "2026년 3월 16일 – 22일",
    );
    expect(viewLabel("week", "2026-03-31", "2026-03-01", "2026-04-20")).toBe(
      "2026년 3월 30일 – 4월 5일",
    );
  });
});

describe("clusterThumbs", () => {
  test("앨범이 있으면 앨범 커버 하나만", () => {
    const thumbs = clusterThumbs([
      ev("s1", "2026-03-01"),
      ev("a1", "2026-03-25", "album"),
      ev("s2", "2026-03-10"),
    ]);
    expect(thumbs.map((e) => e.id)).toEqual(["a1"]);
  });

  test("앨범이 없으면 대표 3개", () => {
    const thumbs = clusterThumbs([
      ev("s1", "2026-03-01"),
      ev("s2", "2026-03-10"),
      ev("s3", "2026-03-12"),
      ev("s4", "2026-03-20"),
    ]);
    expect(thumbs).toHaveLength(3);
  });
});
