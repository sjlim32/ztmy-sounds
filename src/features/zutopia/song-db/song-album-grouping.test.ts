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

describe("groupSongs 편곡·MV 감독", () => {
  const withPeople = (
    id: string,
    date: string,
    arranger: string[] | null,
    movie_director: string[] | null = null,
  ) => ({ ...song(id, date), arranger, movie_director }) as SongWithAlbums;
  const songs = [
    withPeople("a", "2020-01-01", ["X", "Y"]),
    withPeople("b", "2019-01-01", ["X"]),
    withPeople("c", "2021-01-01", null),
    withPeople("d", "2018-01-01", ["Y"], ["D"]),
  ];

  test("사람마다 묶고(여럿이면 각자), 곡 많은 순·발매일 순, 정보 없음은 맨 뒤", () => {
    const groups = groupSongs(songs, "arranger", "asc");
    expect(groups.map((g) => [g.label, g.songs.map((s) => s.id)])).toEqual([
      ["X", ["b", "a"]],
      ["Y", ["d", "a"]],
      ["정보 없음", ["c"]],
    ]);
  });

  test("MV 감독도 같은 방식", () => {
    const groups = groupSongs(songs, "director", "asc");
    expect(groups.map((g) => [g.label, g.songs.length])).toEqual([
      ["D", 1],
      ["정보 없음", 3],
    ]);
  });

  test("내림차순이어도 정보 없음은 맨 뒤", () => {
    const groups = groupSongs(songs, "arranger", "desc");
    expect(groups.at(-1)?.label).toBe("정보 없음");
  });
});
