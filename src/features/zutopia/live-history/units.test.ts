import { describe, expect, test } from "vitest";
import {
  addDays,
  buildLiveUnits,
  buildSongLiveStats,
  buildUpcomingUnits,
} from "@/features/zutopia/live-history/units";
import type {
  RawLive,
  RawSetlistRow,
  RawTour,
} from "@/features/zutopia/live-history/types";

const TODAY = "2026-11-05";

function live(overrides: Partial<RawLive> & { id: string }): RawLive {
  return {
    slug: overrides.id,
    tour_id: null,
    title: `title-${overrides.id}`,
    title_ko: null,
    type: "CONCERT",
    start_date: "2024-06-15",
    end_date: null,
    live_date: null,
    region: "서울",
    icon_image_url: null,
    poster_image_url: null,
    ...overrides,
  };
}

function row(
  song_id: string,
  where: { live_id?: string; tour_id?: string },
  day_number: number | null = null,
): RawSetlistRow {
  return {
    live_id: where.live_id ?? null,
    tour_id: where.tour_id ?? null,
    song_id,
    day_number,
  };
}

function build(
  lives: RawLive[],
  setlists: RawSetlistRow[],
  tours: RawTour[] = [],
  originalOf: Record<string, string> = {},
) {
  return buildLiveUnits({ lives, tours, setlists, originalOf }, TODAY);
}

describe("addDays", () => {
  test("월 경계를 넘는다", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("buildLiveUnits", () => {
  test("페스티벌은 live_date 하루 단위 하나", () => {
    const units = build(
      [
        live({
          id: "f1",
          type: "FESTIVAL",
          start_date: "2026-07-24",
          end_date: "2026-07-26",
          live_date: "2026-07-25T00:00:00+00:00",
        }),
      ],
      [row("s1", { live_id: "f1" })],
    );
    expect(units.map((u) => [u.id, u.date, u.dayNumber])).toEqual([
      ["f1:2026-07-25", "2026-07-25", null],
    ]);
  });

  test("하루 공연은 dayNumber 없이 단위 하나", () => {
    const units = build(
      [live({ id: "c0", start_date: "2024-02-27" })],
      [row("s1", { live_id: "c0" })],
    );
    expect(units.map((u) => [u.id, u.dayNumber])).toEqual([
      ["c0:2024-02-27", null],
    ]);
  });

  test("day_number 없는 이틀 콘서트는 같은 곡으로 이틀(최신 먼저)", () => {
    const units = build(
      [live({ id: "c1", start_date: "2026-02-28", end_date: "2026-03-01" })],
      [row("s1", { live_id: "c1" }), row("s2", { live_id: "c1" })],
    );
    expect(units.map((u) => [u.date, u.dayNumber, u.songIds])).toEqual([
      ["2026-03-01", 2, ["s1", "s2"]],
      ["2026-02-28", 1, ["s1", "s2"]],
    ]);
  });

  test("day_number 있는 이틀 공연은 공통 곡 + 그날 곡", () => {
    const units = build(
      [live({ id: "c2", start_date: "2024-06-15", end_date: "2024-06-16" })],
      [
        row("s1", { live_id: "c2" }),
        row("s2", { live_id: "c2" }, 1),
        row("s3", { live_id: "c2" }, 2),
      ],
    );
    const byDay = Object.fromEntries(
      units.map((u) => [u.dayNumber, [...u.songIds].sort()]),
    );
    expect(byDay).toEqual({ 1: ["s1", "s2"], 2: ["s1", "s3"] });
  });

  test("투어 공연일은 투어 공통 곡을 합치고 투어 제목·링크를 쓴다", () => {
    const tours: RawTour[] = [
      {
        id: "t1",
        slug: "intense-2",
        title: "INTENSE II",
        title_ko: "인텐스 2",
        poster_image_url: null,
      },
    ];
    const [u] = build(
      [live({ id: "L", slug: null, tour_id: "t1", start_date: "2026-04-17" })],
      [row("s1", { tour_id: "t1" }), row("s9", { live_id: "L" })],
      tours,
    );
    expect([...u.songIds].sort()).toEqual(["s1", "s9"]);
    expect(u.href).toBe("/zutopia/lives/intense-2");
    expect(u.title).toBe("INTENSE II");
    expect(u.titleKo).toBe("인텐스 2");
    expect(u.tourId).toBe("t1");
  });

  test("tour_id 없이 slug가 투어 slug인 공연도 투어 소속", () => {
    const tours: RawTour[] = [
      {
        id: "t1",
        slug: "intense",
        title: "INTENSE",
        title_ko: "인텐스",
        poster_image_url: null,
      },
    ];
    const [u] = build(
      [live({ id: "L2", slug: "intense", start_date: "2024-03-20" })],
      [row("s1", { tour_id: "t1" }), row("s2", { live_id: "L2" })],
      tours,
    );
    expect(u.tourId).toBe("t1");
    expect([...u.songIds].sort()).toEqual(["s1", "s2"]);
  });

  test("투어 아닌 공연은 자기 slug로 링크, slug가 없으면 링크 없음", () => {
    const units = build(
      [
        live({ id: "a", slug: "fuji", start_date: "2026-01-01" }),
        live({ id: "b", slug: null, start_date: "2025-01-01" }),
      ],
      [],
    );
    expect(units.map((u) => u.href)).toEqual(["/zutopia/lives/fuji", null]);
  });

  test("같은 날 같은 곡 두 행은 한 번", () => {
    const [u] = build(
      [live({ id: "d" })],
      [row("s1", { live_id: "d" }), row("s1", { live_id: "d" })],
    );
    expect(u.songIds).toEqual(["s1"]);
  });

  test("어레인지 곡은 원곡 id로 센다", () => {
    const [u] = build(
      [live({ id: "e" })],
      [row("a1", { live_id: "e" }), row("s1", { live_id: "e" })],
      [],
      { a1: "s1" },
    );
    expect(u.songIds).toEqual(["s1"]);
  });

  test("오늘 이후 공연은 빠진다", () => {
    const units = build(
      [
        live({ id: "future", start_date: "2026-12-01" }),
        live({ id: "today", start_date: TODAY }),
      ],
      [],
    );
    expect(units.map((u) => u.liveId)).toEqual(["today"]);
  });

  test("이미지: 공연일 아이콘 → 공연 포스터 → 투어 포스터, 묶음 이미지는 투어 포스터 우선", () => {
    const tours: RawTour[] = [
      {
        id: "t1",
        slug: "zomcra",
        title: "T",
        title_ko: "T",
        poster_image_url: "tour.webp",
      },
    ];
    const units = build(
      [
        live({
          id: "a",
          tour_id: "t1",
          start_date: "2026-03-14",
          icon_image_url: "icon.webp",
          poster_image_url: "poster.webp",
        }),
        live({
          id: "b",
          tour_id: "t1",
          start_date: "2026-03-28",
          poster_image_url: "poster-b.webp",
        }),
        live({ id: "c", tour_id: "t1", start_date: "2026-04-17" }),
        live({
          id: "f",
          type: "FESTIVAL",
          start_date: "2026-07-25",
          icon_image_url: "fes-icon.webp",
        }),
      ],
      [],
      tours,
    );
    const byLive = Object.fromEntries(
      units.map((u) => [u.liveId, [u.imageUrl, u.groupImageUrl]]),
    );
    expect(byLive).toEqual({
      a: ["icon.webp", "tour.webp"],
      b: ["poster-b.webp", "tour.webp"],
      c: ["tour.webp", "tour.webp"],
      f: ["fes-icon.webp", "fes-icon.webp"],
    });
  });

  test("region에서 한글 도시명을 뽑는다", () => {
    const [u] = build([live({ id: "r", region: "大阪 (오사카)" })], []);
    expect(u.city).toBe("오사카");
  });
});

describe("하루 공연 보정", () => {
  test("live_date가 있으면 종류와 상관없이 그날 하루", () => {
    const units = build(
      [
        live({
          id: "ev",
          type: "EVENT",
          start_date: "2025-08-01",
          end_date: "2025-08-03",
          live_date: "2025-08-02T00:00:00+09:00",
        }),
      ],
      [row("s1", { live_id: "ev" })],
    );
    expect(units.map((u) => [u.id, u.dayNumber])).toEqual([
      ["ev:2025-08-02", null],
    ]);
  });

  test("하루 공연이면 DAY 번호가 붙은 자기 세트리스트 행도 센다", () => {
    const units = build(
      [live({ id: "one", start_date: "2025-05-01" })],
      [row("s1", { live_id: "one" }, 1), row("s2", { live_id: "one" })],
    );
    expect(units[0].songIds).toEqual(["s1", "s2"]);
  });
});

describe("buildUpcomingUnits", () => {
  test("오늘 뒤의 공연일만, 날짜 오름차순(가까운 것부터)", () => {
    const lives = [
      live({ id: "past", start_date: "2026-10-01" }),
      live({ id: "far", start_date: "2027-03-01" }),
      live({ id: "near", start_date: "2026-12-24", end_date: "2026-12-25" }),
      live({ id: "today", start_date: TODAY }),
    ];
    const input = { lives, tours: [], setlists: [], originalOf: {} };
    expect(buildUpcomingUnits(input, TODAY).map((u) => u.id)).toEqual([
      "near:2026-12-24",
      "near:2026-12-25",
      "far:2027-03-01",
    ]);
    // 지난 공연(오늘 포함)은 buildLiveUnits 쪽에만
    expect(buildLiveUnits(input, TODAY).map((u) => u.id)).toEqual([
      "today:2026-11-05",
      "past:2026-10-01",
    ]);
  });
});

describe("buildSongLiveStats", () => {
  test("횟수와 가장 최근·가장 처음 단위", () => {
    const units = build(
      [
        live({ id: "A", start_date: "2024-06-15" }),
        live({ id: "B", start_date: "2026-03-01" }),
      ],
      [
        row("s1", { live_id: "A" }),
        row("s1", { live_id: "B" }),
        row("s2", { live_id: "B" }),
      ],
    );
    expect(buildSongLiveStats(units)).toEqual({
      s1: {
        count: 2,
        lastUnitId: "B:2026-03-01",
        firstUnitId: "A:2024-06-15",
      },
      s2: {
        count: 1,
        lastUnitId: "B:2026-03-01",
        firstUnitId: "B:2026-03-01",
      },
    });
  });
});
