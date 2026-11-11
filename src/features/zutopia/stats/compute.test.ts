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

  test("세트리스트 없는 날은 연속 기록을 끊지 않는다", () => {
    const rows = record(sections, "song-streak").rows;
    expect(rows[0].key).toBe("a");
    expect(rows[0].cells[0]).toBe("3회 연속");
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
