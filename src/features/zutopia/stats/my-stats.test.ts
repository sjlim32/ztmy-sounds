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
