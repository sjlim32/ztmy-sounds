import { describe, expect, test } from "vitest";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import {
  buildStatSections,
  buildStatSummary,
  festivalKey,
  venueName,
  wilsonLowerBound,
} from "./compute";
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
    // 이전 라이브도 돌아온 공연처럼 날짜와 공연 이름(화면에서 두 줄로 나눈다).
    expect(rows[0].cells.slice(1)).toEqual([
      "0회",
      { date: "2021.01.01", label: "live-u2" },
      { date: "2022.07.01", label: "live-u3" },
    ]);
  });

  test("공연일 없는 투어 기간은 공연 공백을 끊는다", () => {
    const rows = record(sections, "live-longest-break").rows;
    expect(rows[0].cells[0]).toBe("546일");
    expect(rows.some((row) => row.sub?.includes("빈 투어"))).toBe(true);
  });

  test("공연일이 전부 취소된 투어는 공연일 없는 투어로 세지 않는다", () => {
    const canceled = buildStatSections({
      units,
      upcoming: [],
      songs,
      albums: [],
      tours,
      canceledTourIds: ["t"],
    });
    expect(record(canceled, "live-longest-break").description).toBe(
      "연이은 두 공연일 사이 간격",
    );
    expect(
      record(canceled, "live-longest-tour").rows.map((row) => row.key),
    ).toEqual([]);
  });

  test("공연일 없는 투어 안내는 그런 투어가 있을 때만 설명에 붙는다", () => {
    expect(record(sections, "live-longest-break").description).toContain(
      "투어 1개",
    );
    const noEmpty = buildStatSections({
      units,
      upcoming: [],
      songs,
      albums: [],
      tours: [],
    });
    expect(record(noEmpty, "live-longest-break").description).toBe(
      "연이은 두 공연일 사이 간격",
    );
    expect(record(noEmpty, "live-busiest-year").description).toBe(
      "그해 공연일 수",
    );
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

describe("기록 보정", () => {
  test("참가율 순위는 공연일이 적은 곡을 낮게 보정한다", () => {
    expect(wilsonLowerBound(2, 2)).toBeLessThan(wilsonLowerBound(29, 30));
    expect(wilsonLowerBound(0, 0)).toBe(0);
    const sections = buildStatSections({
      units: Array.from({ length: 30 }, (_, i) =>
        unit(`w${i}`, `2025-01-${String(i + 1).padStart(2, "0")}`, [
          ...(i < 29 ? ["many"] : []),
          ...(i >= 28 ? ["new"] : []),
        ]),
      ),
      upcoming: [],
      // new는 마지막 두 공연일 전날 발매 — 2회 중 2회(100%)
      songs: [song("many", "2024-01-01"), song("new", "2025-01-29")],
      albums: [],
      tours: [],
    });
    const rows = record(sections, "song-highest-rate").rows;
    expect(rows.map((row) => [row.key, row.cells[0]])).toEqual([
      ["many", "97%"],
      ["new", "100%"],
    ]);
  });

  test("공백은 건너뛴 공연 수로도 잰다", () => {
    const sections = buildStatSections({
      units: [
        unit("s1", "2020-01-01", ["a", "b"]),
        unit("s2", "2020-01-02", ["b"]),
        unit("s3", "2020-01-03", ["b"]),
        unit("s4", "2020-01-04", ["a", "b"]),
        unit("s5", "2023-01-01", ["b"]),
        unit("s6", "2025-01-01", ["b"]),
      ],
      upcoming: [],
      songs: [song("a", "2019-01-01"), song("b", "2019-01-01")],
      albums: [],
      tours: [],
    });
    // 일수로는 b(2023→2025, 731일)가, 공연 수로는 a(사이 2회)가 1위.
    expect(record(sections, "song-comeback").rows[0].key).toBe("b");
    const shows = record(sections, "song-comeback-shows").rows;
    expect(shows.map((row) => [row.key, row.cells[0]])).toEqual([["a", "2회"]]);
  });

  test("오프닝은 부른 날 중 첫 곡이었던 비율도 보여 준다", () => {
    const sections = buildStatSections({
      units: [
        unit("o1", "2020-01-01", ["a", "b"], { openingSongId: "a" }),
        unit("o2", "2020-01-02", ["a", "b"], { openingSongId: "b" }),
        unit("o3", "2020-01-03", ["b"], { openingSongId: "b" }),
      ],
      upcoming: [],
      songs: [song("a", "2019-01-01"), song("b", "2019-01-01")],
      albums: [],
      tours: [],
    });
    const rows = record(sections, "song-opener").rows;
    expect(rows.map((row) => [row.key, ...row.cells])).toEqual([
      ["b", "2회", "67%", "67%"],
      ["a", "1회", "33%", "50%"],
    ]);
  });
});

describe("buildStatSummary", () => {
  test("확보율·부른 곡·해외 공연과, 세트리스트 없는 공연(최신 먼저)", () => {
    const summary = buildStatSummary({
      units: [
        unit("m1", "2020-01-01", ["a"]),
        unit("m2", "2021-01-01", []),
        unit("m3", "2022-01-01", ["a"], { country: "한국", city: "서울" }),
        unit("m4", "2023-01-01", []),
      ],
      songs: [song("a", "2019-01-01"), song("b", "2019-01-01")],
    });
    expect(
      summary.items.map((item) => [item.label, item.value, item.note]),
    ).toEqual([
      ["현장 공연일", "4회", "2020 – 2023"],
      ["세트리스트 확보", "50%", "2 / 4회"],
      ["라이브로 부른 곡", "1곡", "발매곡 2곡 중 50%"],
      ["해외 공연일", "1회", "1개 나라"],
    ]);
    expect(summary.items[1].ratio).toBe(0.5);
    expect(summary.missing.rows.map((row) => [row.key, row.rank])).toEqual([
      ["m4", 1],
      ["m2", 2],
    ]);
    expect(summary.missing.total).toBe(2);
  });
});
