import { describe, expect, test } from "vitest";
import {
  expandMedleyRow,
  parseMedleySongIds,
  setlistSongCount,
} from "./medley";

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

describe("expandMedleyRow", () => {
  const row = (note: Parameters<typeof parseMedleySongIds>[0]) => ({
    track_number: 3,
    is_encore: true,
    note: note ?? null,
  });

  test("곡마다 한 행, 번호는 그 자리 안에서 순서대로", () => {
    const rows = expandMedleyRow(
      row({ type: "medley", song_ids: ["a", "b", "c", "d"] }),
      () => true,
    );
    expect(rows.map((item) => [item.song_id, item.track_number])).toEqual([
      ["a", 3],
      ["b", 3.25],
      ["c", 3.5],
      ["d", 3.75],
    ]);
    expect(rows.every((item) => item.is_encore)).toBe(true);
  });

  test("비활성 곡은 빼고, 메들리가 아니면 빈 배열", () => {
    expect(
      expandMedleyRow(
        row({ type: "medley", song_ids: ["a", "gone", "b"] }),
        (id) => id !== "gone",
      ).map((item) => [item.song_id, item.track_number]),
    ).toEqual([
      ["a", 3],
      ["b", 3.5],
    ]);
    expect(expandMedleyRow(row({ type: "cover" }), () => true)).toEqual([]);
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
