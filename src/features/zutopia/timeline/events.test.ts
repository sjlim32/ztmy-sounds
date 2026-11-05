import { describe, expect, test } from "vitest";
import {
  assignLanes,
  buildTimelineEvents,
  dateToOffset,
  timelineRange,
  countByYear,
  latestDate,
  type TimelineEvent,
} from "@/features/zutopia/timeline/events";
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
    type: tourId ? "CONCERT" : "FESTIVAL",
    title: `${tourId ?? liveId}-ja`,
    titleKo: `${tourId ?? liveId}-ko`,
    city: "서울",
    tourId,
    dayNumber: null,
    href: `/zutopia/lives/${tourId ?? liveId}`,
    songIds: [],
    imageUrl: null,
    groupImageUrl: `${tourId ?? liveId}.webp`,
  };
}

function ev(id: string, date: string, endDate: string | null = null) {
  return {
    id,
    kind: "song",
    date,
    endDate,
    label: id,
    subLabel: null,
    href: null,
    unitIds: [],
    newSongCount: 0,
    imageUrl: null,
    tag: null,
    upcoming: false,
  } satisfies TimelineEvent;
}

const song = (
  id: string,
  releaseDate: string,
  unreleased = false,
  albumIds: string[] = [],
) => ({
  id,
  slug: `${id}-slug`,
  title: `${id}-ja`,
  titleKo: `${id}-ko`,
  releaseDate,
  unreleased,
  albumIds,
  coverSrc: `${id}.webp`,
});

describe("buildTimelineEvents", () => {
  test("투어 단위들은 기간 이벤트 하나", () => {
    const events = buildTimelineEvents({
      songs: [],
      albums: [],
      units: [
        unit("c", "2026-06-18", "tour"),
        unit("b", "2026-03-14", "tour"),
        unit("a", "2026-02-28", "tour"),
      ],
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "live",
      date: "2026-02-28",
      endDate: "2026-06-18",
      label: "tour-ko",
      href: "/zutopia/lives/tour",
    });
    expect(events[0].unitIds).toHaveLength(3);
    expect(events[0].imageUrl).toBe("tour.webp");
  });

  test("투어 아닌 이틀 공연은 공연 하나, 하루 공연은 끝 날짜 없음", () => {
    const events = buildTimelineEvents({
      songs: [],
      albums: [],
      units: [
        unit("two", "2025-05-02"),
        unit("two", "2025-05-01"),
        unit("one", "2024-08-10"),
      ],
    });
    expect(events.map((e) => [e.date, e.endDate])).toEqual([
      ["2024-08-10", null],
      ["2025-05-01", "2025-05-02"],
    ]);
  });

  test("미공개곡은 빠지고, 곡·앨범 링크는 상세로", () => {
    const events = buildTimelineEvents({
      songs: [song("s1", "2018-06-04"), song("s2", "2020-01-01", true)],
      albums: [
        {
          id: "al",
          slug: "al-slug",
          title: "al-ja",
          titleKo: "al-ko",
          releaseDate: "2019-10-30",
          coverSrc: "al.webp",
          typeLabel: "미니 1집",
        },
      ],
      units: [],
    });
    expect(events.map((e) => e.id)).toEqual(["song:s1", "album:al"]);
    expect(events[0]).toMatchObject({
      label: "s1-ko",
      subLabel: "s1-ja",
      href: "/zutopia/songs?song=s1-slug",
    });
    expect(events[1].href).toBe("/zutopia/albums?album=al-slug");
    expect(events[0].imageUrl).toBe("s1.webp");
    expect(events[1]).toMatchObject({
      label: "al-ko",
      subLabel: "al-ja",
      imageUrl: "al.webp",
      tag: "미니 1집",
    });
  });

  test("날짜순, 같은 날은 앨범 → 곡 → 공연", () => {
    const events = buildTimelineEvents({
      songs: [song("s", "2020-01-01")],
      albums: [
        {
          id: "al",
          slug: "al",
          title: "al",
          titleKo: "al",
          releaseDate: "2020-01-01",
          coverSrc: null,
          typeLabel: "EP 1집",
        },
      ],
      units: [unit("f", "2020-01-01"), unit("g", "2019-01-01")],
    });
    expect(events.map((e) => e.id)).toEqual([
      "live:g",
      "album:al",
      "song:s",
      "live:f",
    ]);
  });
});

test("앨범과 같은 날 나온 수록곡은 앨범 일정 하나로 합친다", () => {
  const album = {
    id: "al",
    slug: "al",
    title: "al",
    titleKo: "al",
    releaseDate: "2020-01-01",
    coverSrc: null,
    typeLabel: "정규 1집",
  };
  const events = buildTimelineEvents({
    songs: [
      song("single", "2019-06-01", false, ["al"]),
      song("t1", "2020-01-01", false, ["al"]),
      song("t2", "2020-01-01", false, ["al"]),
      song("other", "2020-01-01", false, []),
    ],
    albums: [album],
    units: [],
  });
  expect(events.map((e) => e.id)).toEqual([
    "song:single",
    "album:al",
    "song:other",
  ]);
  expect(events[1].newSongCount).toBe(2);
});

test("한국어 제목이 없거나 원어와 같으면 원어만", () => {
  const events = buildTimelineEvents({
    songs: [
      { ...song("a", "2020-01-01"), titleKo: null },
      { ...song("b", "2020-02-01"), titleKo: "b-ja" },
    ],
    albums: [],
    units: [],
  });
  expect(events.map((e) => [e.label, e.subLabel])).toEqual([
    ["a-ja", null],
    ["b-ja", null],
  ]);
});

describe("dateToOffset", () => {
  test("날짜 차이 × 배율", () => {
    expect(dateToOffset("2026-01-11", "2026-01-01", 2)).toBe(20);
    expect(dateToOffset("2025-01-01", "2024-01-01", 1)).toBe(366);
  });
});

describe("assignLanes", () => {
  test("같은 날 이벤트는 다른 줄", () => {
    const lanes = assignLanes(
      [ev("a", "2020-01-01"), ev("b", "2020-01-01"), ev("c", "2020-06-01")],
      14,
    );
    expect(lanes.get("a")).not.toBe(lanes.get("b"));
    expect(lanes.get("c")).toBe(0);
  });

  test("기간 이벤트는 끝날 때까지 그 줄을 차지한다", () => {
    const lanes = assignLanes(
      [
        ev("tour", "2020-01-01", "2020-06-30"),
        ev("mid", "2020-03-01"),
        ev("after", "2020-08-01"),
      ],
      14,
    );
    expect(lanes.get("tour")).toBe(0);
    expect(lanes.get("mid")).toBe(1);
    expect(lanes.get("after")).toBe(0);
  });
});

describe("timelineRange", () => {
  test("첫 해 1월 1일부터 마지막 일정 다음 해 1월 1일까지", () => {
    expect(
      timelineRange([
        ev("a", "2018-06-04"),
        ev("b", "2020-03-01", "2021-02-01"),
      ]),
    ).toEqual({
      start: "2018-01-01",
      end: "2022-01-01",
      years: ["2018", "2019", "2020", "2021"],
    });
  });
});

describe("countByYear", () => {
  test("해마다 종류별 수(시작일 기준)", () => {
    const events = [
      ev("a", "2020-01-01"),
      { ...ev("b", "2020-05-01"), kind: "album" as const },
      { ...ev("c", "2020-12-20", "2021-02-01"), kind: "live" as const },
      ev("d", "2021-03-01"),
    ];
    expect(countByYear(events)).toEqual({
      "2020": { song: 1, album: 1, live: 1 },
      "2021": { song: 1, album: 0, live: 0 },
    });
  });
});

describe("예정 일정", () => {
  test("예정 공연일만 있는 공연, 오늘 뒤 발매일은 upcoming", () => {
    const events = buildTimelineEvents({
      songs: [song("future", "2027-01-10"), song("past", "2026-01-10")],
      albums: [],
      units: [unit("done", "2026-10-01")],
      upcomingUnits: [unit("next", "2026-12-24")],
      today: "2026-11-05",
    });
    const flags = Object.fromEntries(events.map((e) => [e.id, e.upcoming]));
    expect(flags).toEqual({
      "song:past": false,
      "live:done": false,
      "live:next": true,
      "song:future": true,
    });
  });

  test("진행 중인 투어(지난 + 예정 공연일)는 한 일정, 예정 아님, 끝날 = 마지막 예정일", () => {
    const [event] = buildTimelineEvents({
      songs: [],
      albums: [],
      units: [unit("a", "2026-10-01", "tour")],
      upcomingUnits: [unit("b", "2026-12-01", "tour")],
      today: "2026-11-05",
    });
    expect(event).toMatchObject({
      date: "2026-10-01",
      endDate: "2026-12-01",
      upcoming: false,
    });
    // 참전 체크는 지난 공연일만 대상
    expect(event.unitIds).toEqual(["a:2026-10-01"]);
  });
});

describe("latestDate", () => {
  test("가장 늦은 날짜(기간이면 끝날)", () => {
    expect(
      latestDate([ev("a", "2020-01-01", "2021-05-01"), ev("b", "2021-03-01")]),
    ).toBe("2021-05-01");
  });
});
