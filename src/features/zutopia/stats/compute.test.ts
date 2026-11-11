import { describe, expect, test } from "vitest";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import { buildStatSections, festivalKey, venueName } from "./compute";
import type { StatSong } from "./types";

function unit(
  id: string,
  date: string,
  songIds: string[],
  extra: Partial<LiveUnit> = {},
): LiveUnit {
  return {
    id,
    liveId: id,
    date,
    type: "CONCERT",
    title: `live-${id}`,
    titleKo: null,
    city: "도쿄",
    tourId: null,
    dayNumber: null,
    href: null,
    songIds,
    imageUrl: null,
    groupImageUrl: null,
    ...extra,
  };
}

function song(id: string, releaseDate: string): StatSong {
  return { id, slug: id, title: id, titleKo: id, releaseDate, cover: null };
}

function record(sections: ReturnType<typeof buildStatSections>, id: string) {
  return sections
    .flatMap((section) => section.records)
    .find((r) => r.id === id)!;
}

describe("festivalKey", () => {
  test("해마다 붙는 연도 표기를 뗀다", () => {
    expect(festivalKey("FUJI ROCK FESTIVAL '19")).toBe("FUJI ROCK FESTIVAL");
    expect(festivalKey("COUNTDOWN JAPAN 19/20")).toBe("COUNTDOWN JAPAN");
    expect(festivalKey("OSAKA GIGANTIC MUSIC FESTIVAL 2022")).toBe(
      "OSAKA GIGANTIC MUSIC FESTIVAL",
    );
    expect(festivalKey("RISING SUN ROCK FESTIVAL 2022 in EZO")).toBe(
      "RISING SUN ROCK FESTIVAL in EZO",
    );
  });
});

describe("venueName", () => {
  test("홀 번호 괄호가 달라도 같은 공연장, 이름은 한글", () => {
    const a = venueName(
      "幕張メッセ国際展示場 (1~11ホール) (마쿠하리 멧세 국제전시장(1~11홀))",
    );
    const b = venueName("幕張メッセ国際展示場 (마쿠하리 멧세 국제전시장)");
    expect(a).toEqual({
      key: "幕張メッセ国際展示場",
      label: "마쿠하리 멧세 국제전시장",
    });
    expect(b.key).toBe(a.key);
  });

  test("끝 괄호가 한글이 아니면 원어 이름", () => {
    expect(venueName("Kアリーナ横浜 (K-Arena Yokohama)")).toEqual({
      key: "Kアリーナ横浜",
      label: "Kアリーナ横浜",
    });
    expect(venueName("Zepp DiverCity").label).toBe("Zepp DiverCity");
  });
});

describe("buildStatSections", () => {
  const units = [
    unit("u1", "2020-01-01", ["a"]),
    unit("u2", "2021-01-01", ["a", "b"]),
    unit("u3", "2022-01-01", []), // 세트리스트 없음
    unit("u4", "2023-01-01", ["a", "b"]),
  ];
  const sections = buildStatSections({
    units,
    upcoming: [],
    songs: [
      song("a", "2019-01-01"),
      song("b", "2021-01-01"),
      song("c", "2020-06-01"),
    ],
    albums: [],
    tours: [],
  });

  test("횟수는 세트리스트가 있는 공연일만, 동점은 같은 순위", () => {
    const rows = record(sections, "song-most-played").rows;
    expect(rows.map((row) => [row.key, row.rank, row.cells[0]])).toEqual([
      ["a", 1, "3회"],
      ["b", 2, "2회"],
    ]);
  });

  test("참가율은 발매 후 세트리스트가 있는 공연일 기준", () => {
    const rows = record(sections, "song-most-played").rows;
    // b: 발매(2021-01-01) 후 세트리스트 있는 공연일 2회(u2, u4) 중 2회
    expect(rows[1].cells[1]).toBe("100%");
  });

  test("한 번도 안 불린 곡이 가장 적게 불린 곡 1위", () => {
    const rows = record(sections, "song-least-played").rows;
    expect(rows[0].key).toBe("c");
    expect(rows[0].cells[0]).toBe("0회");
  });

  test("세트리스트를 모르는 공연이 끼면 연속 기록이 끊긴다", () => {
    const rows = record(sections, "song-streak").rows;
    expect(rows[0].key).toBe("a");
    expect(rows[0].cells[0]).toBe("2회 연속");
  });

  test("공연이 가장 많았던 해·공백은 세트리스트 없는 날도 센다", () => {
    expect(record(sections, "live-busiest-year").rows).toHaveLength(4);
    expect(record(sections, "live-longest-break").rows).toHaveLength(3);
  });
});

describe("페스티벌 회차", () => {
  test("이름의 회차 표기로 보여 준다", () => {
    const sections = buildStatSections({
      units: [
        unit("f1", "2019-12-28", [], {
          type: "FESTIVAL",
          title: "COUNTDOWN JAPAN 19/20",
        }),
        unit("f2", "2023-12-31", [], {
          type: "FESTIVAL",
          title: "COUNTDOWN JAPAN 23/24",
        }),
      ],
      upcoming: [],
      songs: [],
      albums: [],
      tours: [],
    });
    const [row] = record(sections, "live-festival").rows;
    expect(row.name).toBe("COUNTDOWN JAPAN");
    expect(row.cells).toEqual(["2회", "19/20, 23/24"]);
  });
});

describe("모르는 구간(세트리스트 없는 공연·공연일 없는 투어)", () => {
  const songs = [song("a", "2020-01-01"), song("b", "2022-06-01")];
  const units = [
    unit("u1", "2020-03-01", []), // 세트리스트 없음
    unit("u2", "2021-01-01", ["a"]),
    unit("u3", "2022-07-01", ["a", "b"]),
    unit("u4", "2024-01-01", ["a", "b"]),
  ];
  const tours = [
    {
      id: "t",
      slug: "t",
      title: "T",
      titleKo: "빈 투어",
      startDate: "2023-01-01",
      endDate: "2023-03-01",
      poster: null,
    },
  ];
  const sections = buildStatSections({
    units,
    upcoming: [],
    songs,
    albums: [],
    tours,
  });

  test("발매 후 첫 라이브 전에 모르는 공연이 있으면 데뷔 기록에서 뺀다", () => {
    const keys = record(sections, "song-fastest-debut").rows.map(
      (row) => row.key,
    );
    expect(keys).toEqual(["b"]);
    const debutUnits = record(sections, "live-most-debuts").rows.map(
      (row) => row.key,
    );
    expect(debutUnits).toEqual(["u3"]);
  });

  test("두 라이브 사이에 공연일 없는 투어가 있으면 공백 끝 부활에서 뺀다", () => {
    const rows = record(sections, "song-comeback").rows;
    // a: 2021-01-01 → 2022-07-01만 남는다(2022-07 → 2024-01 사이엔 빈 투어).
    expect(rows.map((row) => [row.key, row.cells[0]])).toEqual([
      ["a", "546일"],
    ]);
  });

  test("공연일 없는 투어 기간은 공연 공백을 끊는다", () => {
    const rows = record(sections, "live-longest-break").rows;
    expect(rows[0].cells[0]).toBe("546일");
    expect(rows.some((row) => row.sub?.includes("빈 투어"))).toBe(true);
  });

  test("같은 %(정수)면 같은 순위", () => {
    const rate = buildStatSections({
      units: Array.from({ length: 30 }, (_, i) =>
        unit(`r${i}`, `2025-01-${String(i + 1).padStart(2, "0")}`, [
          "x",
          ...(i < 29 ? ["y"] : []),
          ...(i < 28 ? ["z"] : []),
        ]),
      ),
      upcoming: [],
      songs: [
        song("x", "2024-01-01"),
        song("y", "2024-01-01"),
        song("z", "2024-01-01"),
      ],
      albums: [],
      tours: [],
    });
    const rows = record(rate, "song-highest-rate").rows;
    // 30/30=100%, 29/30=97%, 28/30=93%
    expect(rows.map((row) => [row.key, row.rank, row.cells[0]])).toEqual([
      ["x", 1, "100%"],
      ["y", 2, "97%"],
      ["z", 3, "93%"],
    ]);
  });
});
