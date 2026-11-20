import { describe, expect, test } from "vitest";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import {
  buildStatSections,
  buildStatSummary,
  festivalKey,
  fullTables,
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
      { date: "2021.01.01", label: "live-u2", href: null },
      { date: "2022.07.01", label: "live-u3", href: null },
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
    expect(record(canceled, "live-longest-break").detail).toBe(
      "연이은 두 공연일 사이 간격",
    );
    expect(
      record(canceled, "live-longest-tour").rows.map((row) => row.key),
    ).toEqual([]);
  });

  test("공연일 없는 투어 안내는 그런 투어가 있을 때만 설명에 붙는다", () => {
    expect(record(sections, "live-longest-break").detail).toContain("투어 1개");
    const noEmpty = buildStatSections({
      units,
      upcoming: [],
      songs,
      albums: [],
      tours: [],
    });
    expect(record(noEmpty, "live-longest-break").detail).toBe(
      "연이은 두 공연일 사이 간격",
    );
    expect(record(noEmpty, "live-busiest-year").detail).toBe("그해 공연일 수");
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

describe("공연 칸 링크", () => {
  test("공연 칸은 그 공연 상세로 이어진다(공연 공백 포함)", () => {
    const sections = buildStatSections({
      units: [
        unit("h1", "2020-01-01", ["a"], { href: "/zutopia/lives/one" }),
        unit("h2", "2021-01-01", ["a"], { href: "/zutopia/lives/two" }),
      ],
      upcoming: [],
      songs: [song("a", "2019-01-01")],
      albums: [],
      tours: [],
    });
    const comeback = record(sections, "song-comeback").rows[0];
    expect(comeback.cells[3]).toMatchObject({ href: "/zutopia/lives/two" });
    const gap = record(sections, "live-longest-break").rows[0];
    expect(gap.cells.slice(1)).toEqual([
      { date: "2020.01.01", label: "live-h1", href: "/zutopia/lives/one" },
      { date: "2021.01.01", label: "live-h2", href: "/zutopia/lives/two" },
    ]);
  });
});

describe("1위 연도별 흐름", () => {
  const sections = buildStatSections({
    units: [
      unit("t1", "2020-03-01", ["a"]),
      unit("t2", "2022-03-01", ["a"]),
      unit("t3", "2022-05-01", ["a", "b"]),
    ],
    upcoming: [],
    songs: [song("a", "2019-01-01"), song("b", "2019-01-01")],
    albums: [],
    tours: [],
  });

  test("1위 곡의 해마다 라이브 횟수(빈 해는 0)", () => {
    expect(record(sections, "song-most-played").trend).toEqual({
      label: "해마다 라이브 횟수",
      unit: "회",
      points: [
        { label: "2020", value: 1 },
        { label: "2021", value: 0 },
        { label: "2022", value: 2 },
      ],
    });
  });

  test("공연이 가장 많았던 해는 모든 해를 그리고 1위 해를 강조", () => {
    const trend = record(sections, "live-busiest-year").trend!;
    expect(trend.highlight).toBe("2022");
    expect(trend.points.map((point) => point.value)).toEqual([1, 0, 2]);
  });

  test("흐름이 없는 기록은 null", () => {
    expect(record(sections, "live-most-songs").trend).toBeNull();
  });
});

describe("세트리스트 구역", () => {
  // 곡 순서를 아는 공연일 5회 — a로 시작해 c로 본편을 닫고, 둘째 날부터 앵콜 e.
  const units = Array.from({ length: 5 }, (_, i) =>
    unit(`p${i}`, `2024-01-0${i + 1}`, ["a", "b", "c", ...(i ? ["e"] : [])], {
      mainOrder: ["a", "b", "c"],
      encoreOrder: i ? ["e"] : [],
      variations: i === 0 ? [{ songId: "b", name: "acoustic" }] : [],
      covers: i < 2 ? [{ title: "Neko", titleKo: "고양이", artist: "X" }] : [],
    }),
  );
  const sections = buildStatSections({
    units,
    upcoming: [],
    songs: ["a", "b", "c", "e"].map((id) => song(id, "2020-01-01")),
    albums: [],
    tours: [],
  });
  const keys = (id: string) =>
    record(sections, id).rows.map((row) => [row.key, row.cells[0]]);

  test("본편 마지막·공연 마지막(앵콜 있으면 앵콜 마지막)", () => {
    // 본편 마지막은 앵콜이 있던 4회만
    expect(keys("setlist-closer")).toEqual([["c", "4회"]]);
    expect(keys("setlist-finale")).toEqual([
      ["e", "4회"],
      ["c", "1회"],
    ]);
  });

  test("본편 평균 위치 — 초반·후반", () => {
    expect(keys("setlist-early")[0]).toEqual(["a", "0% 지점"]);
    expect(keys("setlist-late")[0]).toEqual(["c", "100% 지점"]);
  });

  test("이어 부른 두 곡은 본편 안에서만(앵콜 첫 곡과 잇지 않는다), 투어·공연 수로", () => {
    expect(keys("setlist-pairs")).toEqual([
      ["a>b", "5곳"],
      ["b>c", "5곳"],
    ]);
  });

  test("한 투어에서만 이어 부른 두 곡은 하나로 친다", () => {
    const tourSections = buildStatSections({
      units: [
        ...Array.from({ length: 4 }, (_, i) =>
          unit(`t${i}`, `2024-02-0${i + 1}`, ["a", "b"], {
            tourId: "T",
            mainOrder: ["a", "b"],
          }),
        ),
        unit("x1", "2024-03-01", ["c", "d"], { mainOrder: ["c", "d"] }),
        unit("x2", "2024-04-01", ["c", "d"], { mainOrder: ["c", "d"] }),
      ],
      upcoming: [],
      songs: ["a", "b", "c", "d"].map((id) => song(id, "2020-01-01")),
      albums: [],
      tours: [],
    });
    // a→b는 공연일 4회지만 한 투어라 1곳(2곳 미만이라 빠짐), c→d는 공연 2곳.
    expect(
      record(tourSections, "setlist-pairs").rows.map((row) => [
        row.key,
        ...row.cells,
      ]),
    ).toEqual([["c>d", "2곳", "2회", "100%"]]);
  });

  test("다른 버전·커버곡(한글 제목, 원제는 아래 줄)", () => {
    expect(keys("setlist-versions")).toEqual([["b", "1회"]]);
    const [cover] = record(sections, "setlist-covers").rows;
    expect([cover.name, cover.sub, cover.cells[0]]).toEqual([
      "고양이",
      "Neko",
      "2회",
    ]);
  });
});

describe("투어 비교", () => {
  const tour = {
    id: "T",
    slug: "t",
    title: "T",
    titleKo: "투어",
    startDate: "2024-01-01",
    endDate: "2024-01-03",
    poster: null,
  };
  const sections = buildStatSections({
    units: [
      unit("v1", "2024-01-01", ["old", "new", "x"], { tourId: "T" }),
      unit("v2", "2024-01-02", ["old", "new", "y"], { tourId: "T" }),
    ],
    upcoming: [],
    songs: [
      song("old", "2010-01-01"),
      song("new", "2023-12-01"),
      song("x", "2010-01-01"),
      song("y", "2010-01-01"),
    ],
    albums: [],
    tours: [tour],
  });

  test("고정률·바뀐 곡·신곡 비중", () => {
    const cells = (id: string) => record(sections, id).rows[0].cells;
    // 공통 2곡 ÷ 평균 3곡
    expect(cells("live-tour-fixed")).toEqual(["67%", "2곡", "2회"]);
    expect(cells("live-tour-variety")).toEqual(["2곡", "4곡", "2회"]);
    // 6곡 중 발매 1년 안 곡(new) 2회
    expect(cells("live-tour-new")).toEqual(["33%", "2회", "2회"]);
  });
});

describe("최근 흐름", () => {
  // 2022년 5회(a만), 2024년 5회(b만) — 마지막 공연일 기준 1년 안이 2024년.
  const units = [
    ...Array.from({ length: 5 }, (_, i) =>
      unit(`q${i}`, `2022-01-0${i + 1}`, ["a"]),
    ),
    ...Array.from({ length: 5 }, (_, i) =>
      unit(`r${i}`, `2024-01-0${i + 1}`, ["b"]),
    ),
  ];
  const sections = buildStatSections({
    units,
    upcoming: [],
    songs: [song("a", "2020-01-01"), song("b", "2020-01-01")],
    albums: [],
    tours: [],
  });

  test("최근 1년과 그 전 참가율 차이", () => {
    expect(record(sections, "song-rising").rows[0].cells).toEqual([
      "+100%p",
      "100%",
      "0%",
    ]);
    expect(record(sections, "song-falling").rows[0].cells).toEqual([
      "-100%p",
      "0%",
      "100%",
    ]);
  });
});

describe("내한·미공개곡·해마다 앨범", () => {
  const sections = buildStatSections({
    units: [
      unit("k1", "2023-03-01", ["a", "u"], { country: "한국" }),
      unit("k2", "2024-03-01", ["a", "b"], { country: "일본" }),
      unit("k3", "2024-04-01", ["b"], { country: "한국" }),
    ],
    upcoming: [],
    songs: [song("a", "2020-01-01"), song("b", "2020-01-01")],
    unreleasedSongs: [song("u", "2099-01-01")],
    albums: [
      {
        id: "A",
        slug: "A",
        title: "앨범A",
        titleKo: "앨범A",
        cover: null,
        songIds: ["a"],
      },
      {
        id: "B",
        slug: "B",
        title: "앨범B",
        titleKo: "앨범B",
        cover: null,
        songIds: ["b"],
      },
    ],
    tours: [],
  });

  test("미공개곡은 곡 순위엔 없고 미공개곡 기록에만", () => {
    expect(
      record(sections, "song-most-played").rows.map((row) => row.key),
    ).not.toContain("u");
    expect(record(sections, "song-unreleased").rows[0].key).toBe("u");
  });

  test("내한 공연에서 유독 자주 부른 곡 — 내한 참가율 − 그 밖 참가율(한국 3회 이상)", () => {
    const korea = buildStatSections({
      units: [
        ...Array.from({ length: 3 }, (_, i) =>
          unit(`k${i}`, `2024-0${i + 1}-01`, ["h", "x"], { country: "한국" }),
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          unit(`j${i}`, `2024-0${i + 5}-01`, i === 0 ? ["h", "x"] : ["x"], {
            country: "일본",
          }),
        ),
      ],
      upcoming: [],
      songs: [song("h", "2020-01-01"), song("x", "2020-01-01")],
      albums: [],
      tours: [],
    });
    // h: 내한 3/3(100%) − 그 밖 1/4(25%) = +75%p. x는 어디서나 100%라 빠진다.
    expect(
      record(korea, "place-korea-songs").rows.map((row) => [
        row.key,
        ...row.cells,
      ]),
    ).toEqual([["h", "+75%p", "100%", "25%"]]);
  });

  test("수록곡 평균 참가율로 앨범을 가른다", () => {
    const rows = record(sections, "album-rate").rows;
    // a·b 모두 세트리스트를 아는 3회 중 2회 — 같은 평균 참가율이면 같은 순위.
    expect(rows.map((row) => [row.key, row.rank, row.cells[0]])).toEqual([
      ["A", 1, "67%"],
      ["B", 1, "67%"],
    ]);
  });

  test("해마다 가장 많이 불린 앨범(최신 해 먼저)", () => {
    const rows = record(sections, "album-by-year").rows;
    expect(rows.map((row) => [row.name, ...row.cells])).toEqual([
      ["2024년", "앨범B", "67%", "2회"],
      ["2023년", "앨범A", "100%", "1회"],
    ]);
  });
});

describe("1차 검토 반영", () => {
  test("투어 공통 곡만 있는 날은 공통 곡만 아는 날(다른 곡은 모르는 날)", () => {
    const sections = buildStatSections({
      units: [
        unit("c1", "2024-01-01", ["a", "x"]),
        unit("c2", "2024-01-02", ["a"], { commonOnly: true }),
        unit("c3", "2024-01-03", ["a", "x"]),
      ],
      upcoming: [],
      songs: [song("a", "2020-01-01"), song("x", "2020-01-01")],
      albums: [],
      tours: [],
    });
    // 공통 곡 a는 그날도 불렀다 — 3회·3회 연속. x는 2회 중 2회(그날은 모름), 연속은 끊긴다.
    const rate = record(sections, "song-most-played").rows;
    expect(rate.find((row) => row.key === "a")!.cells[0]).toBe("3회");
    expect(rate.find((row) => row.key === "x")!.cells[1]).toBe("100%");
    const streaks = record(sections, "song-streak").rows;
    expect(streaks.map((row) => [row.key, row.cells[0]])).toEqual([
      ["a", "3회 연속"],
      ["x", "1회 연속"],
    ]);
    const summary = buildStatSummary({
      units: [
        unit("c1", "2024-01-01", ["a"]),
        unit("c2", "2024-01-02", ["a"], { commonOnly: true }),
      ],
      songs: [song("a", "2020-01-01")],
    });
    expect(summary.missing.rows.map((row) => row.cells)).toEqual([
      ["콘서트", "투어 공통 곡만"],
    ]);
  });

  test("같은 날 다른 회차의 모르는 세트리스트도 사이에 있는 것으로 본다", () => {
    const sections = buildStatSections({
      units: [
        unit("d1", "2024-01-01", ["x"], { showNumber: 1 }),
        unit("d2", "2024-01-01", [], { showNumber: 2 }),
        unit("d3", "2024-03-01", ["x"]),
      ],
      upcoming: [],
      songs: [song("x", "2020-01-01")],
      albums: [],
      tours: [],
    });
    expect(record(sections, "song-streak").rows[0].cells[0]).toBe("1회 연속");
    expect(record(sections, "song-comeback").rows).toHaveLength(0);
  });

  test("첫 라이브 앞 90일 안에 모르는 공연이 있으면 데뷔 기록에서 뺀다(발매 전후 같은 기준)", () => {
    const sections = buildStatSections({
      units: [unit("e1", "2019-07-01", []), unit("e2", "2019-08-05", ["g"])],
      upcoming: [],
      songs: [song("g", "2019-10-29")],
      albums: [],
      tours: [],
    });
    expect(record(sections, "song-fastest-debut").rows).toHaveLength(0);
  });

  test("전체 순위표(stats.json)엔 설명(note)을 싣지 않는다", () => {
    const sections = buildStatSections({
      units: [unit("f1", "2024-01-01", ["a"])],
      upcoming: [],
      songs: [song("a", "2020-01-01")],
      albums: [],
      tours: [],
    });
    const tables = fullTables(sections);
    expect(tables["song-most-played"][0].note).toBeNull();
  });
});

describe("2차 검토 반영", () => {
  test("발매 후 첫 라이브도 발매 직전 90일 안의 모르는 공연을 살핀다", () => {
    const sections = buildStatSections({
      units: [unit("p1", "2023-05-01", []), unit("p2", "2023-08-01", ["n"])],
      upcoming: [],
      songs: [song("n", "2023-06-07")],
      albums: [],
      tours: [],
    });
    expect(record(sections, "song-fastest-debut").rows).toHaveLength(0);
  });

  test("미공개곡을 처음 부른 날도 라이브 첫 공개에 센다", () => {
    const sections = buildStatSections({
      units: [unit("q1", "2024-01-01", ["u"])],
      upcoming: [],
      songs: [],
      unreleasedSongs: [song("u", "2099-01-01")],
      albums: [],
      tours: [],
    });
    expect(record(sections, "live-most-debuts").rows[0].cells[0]).toBe("1곡");
  });
});
