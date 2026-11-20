import { describe, expect, test } from "vitest";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import { buildMyStatsData, summarizeMine } from "./my-stats";
import type { StatSong } from "./types";

function unit(id: string, date: string, songIds: string[]): LiveUnit {
  return {
    id,
    liveId: id,
    date,
    type: "CONCERT",
    title: id,
    titleKo: null,
    city: "도쿄",
    tourId: null,
    dayNumber: null,
    href: null,
    songIds,
    imageUrl: null,
    groupImageUrl: null,
  };
}

function song(id: string, releaseDate = "2020-01-01"): StatSong {
  return { id, slug: id, title: id, titleKo: id, releaseDate, cover: null };
}

const data = buildMyStatsData({
  units: [
    unit("u1", "2024-01-01", ["hit", "rare"]),
    unit("u2", "2024-02-01", ["hit", "often"]),
    unit("u3", "2024-03-01", ["hit", "often"]),
    unit("u4", "2024-04-01", []), // 세트리스트 없음
  ],
  songs: [song("hit"), song("often"), song("rare"), song("never")],
});

describe("buildMyStatsData", () => {
  test("곡마다 전체 라이브 횟수와 발매 후 참가율", () => {
    expect(data.songs.map((item) => [item.id, item.played, item.rate])).toEqual(
      [
        ["hit", 3, 1],
        ["often", 2, 2 / 3],
        ["rare", 1, 1 / 3],
        ["never", 0, 0],
      ],
    );
  });
});

describe("summarizeMine", () => {
  test("다녀온 공연·들은 곡·희귀곡·못 들은 인기곡", () => {
    const summary = summarizeMine(data, new Set(["u1", "u4", "gone"]));
    expect(summary).toMatchObject({
      attended: 2,
      known: 1,
      heard: 2,
      total: 4,
    });
    expect(summary.rare.map((item) => item.id)).toEqual(["rare", "hit"]);
    // 한 번도 안 불린 곡(never)은 "못 들은 인기곡"에 넣지 않는다.
    expect(summary.missed.map((item) => item.id)).toEqual(["often"]);
  });

  test("체크가 없으면 0", () => {
    expect(summarizeMine(data, new Set()).attended).toBe(0);
  });
});

describe("세트리스트를 모르는 날", () => {
  test("체크한 공연에 세트리스트를 아는 날이 없으면 못 들은 곡을 말하지 않는다", () => {
    const summary = summarizeMine(data, new Set(["u4"]));
    expect(summary.known).toBe(0);
    expect(summary.missed).toEqual([]);
  });

  test("못 들은 인기곡은 표본이 적은 곡을 낮게 보정해 정렬", () => {
    // y: 발매 후 10회 중 9회(90%), x: 발매 후 2회 중 2회(100%) — 보정하면 y가 앞.
    const units = Array.from({ length: 10 }, (_, i) =>
      unit(`w${i}`, `2024-01-${String(i + 1).padStart(2, "0")}`, [
        ...(i < 9 ? ["y"] : []),
        ...(i >= 8 ? ["x"] : []),
      ]),
    );
    const small = buildMyStatsData({
      units: [...units, unit("w10", "2024-01-20", ["z"])],
      songs: [song("y"), song("x", "2024-01-09"), song("z")],
    });
    const summary = summarizeMine(small, new Set(["w10"]));
    expect(summary.missed.map((item) => item.id)).toEqual(["y", "x"]);
  });
});
