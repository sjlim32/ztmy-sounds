import { describe, expect, test } from "vitest";
import { groupSongs } from "@/features/zutopia/song-db/song-album-grouping";
import type { SongWithAlbums } from "@/features/zutopia/song-db/types";
import type { SongLiveSummary } from "@/features/zutopia/live-history/summary";

function song(id: string, release_date: string): SongWithAlbums {
  return {
    id,
    slug: id,
    title: id,
    release_date,
    albums: [],
  } as unknown as SongWithAlbums;
}

function summary(lastDate: string): SongLiveSummary {
  const live = { title: "x", detail: null, date: lastDate, href: null };
  return { count: 1, last: live, first: live };
}

describe("groupSongs lastLive", () => {
  const songs = [
    song("old", "2019-01-01"),
    song("none-b", "2021-01-01"),
    song("recent", "2020-01-01"),
    song("none-a", "2018-01-01"),
  ];
  const summaries = {
    old: summary("2024-06-15"),
    recent: summary("2026-10-11"),
  };

  test("그룹 하나, 내림차순은 최근 공연 먼저, 기록 없는 곡은 발매일 순으로 맨 뒤", () => {
    const groups = groupSongs(songs, "lastLive", "desc", summaries);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("lastLive");
    expect(groups[0].songs.map((s) => s.id)).toEqual([
      "recent",
      "old",
      "none-a",
      "none-b",
    ]);
  });

  test("오름차순은 오래 안 부른 곡 먼저, 기록 없는 곡은 그래도 맨 뒤", () => {
    const groups = groupSongs(songs, "lastLive", "asc", summaries);
    expect(groups[0].songs.map((s) => s.id)).toEqual([
      "old",
      "recent",
      "none-a",
      "none-b",
    ]);
  });
});
