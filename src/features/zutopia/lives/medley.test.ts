import { describe, expect, test } from "vitest";
import { parseMedleySongIds, setlistSongCount } from "./medley";

describe("parseMedleySongIds", () => {
  test("메들리 메모의 곡 id를 순서대로", () => {
    expect(
      parseMedleySongIds({
        type: "medley",
        title: "A / B",
        song_ids: ["b", "a"],
      }),
    ).toEqual(["b", "a"]);
  });

  test("메들리가 아니거나 곡 id가 없으면 null", () => {
    expect(parseMedleySongIds(null)).toBeNull();
    expect(parseMedleySongIds({ type: "cover", song_ids: ["a"] })).toBeNull();
    expect(parseMedleySongIds({ type: "medley", song_ids: [] })).toBeNull();
    expect(parseMedleySongIds({ type: "medley" })).toBeNull();
  });
});

describe("setlistSongCount", () => {
  test("메들리는 안에 든 곡 수만큼 센다", () => {
    const song = { songId: "a" } as never;
    expect(
      setlistSongCount([
        { medley: null },
        { medley: [song, song, song, song] },
      ]),
    ).toBe(5);
  });
});
