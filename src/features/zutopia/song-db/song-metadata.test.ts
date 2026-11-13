import { describe, expect, test } from "vitest";
import { isCountableOriginal, parseSongMetadata } from "./song-metadata";

describe("parseSongMetadata", () => {
  test("collab은 비어 있지 않은 문자열일 때만 인정한다", () => {
    expect(parseSongMetadata({ collab: "Dear Jubilee" }).collab).toBe(
      "Dear Jubilee",
    );
    expect(parseSongMetadata({ collab: "  " }).collab).toBeNull();
    expect(parseSongMetadata({ collab: true }).collab).toBeNull();
    expect(parseSongMetadata(null).collab).toBeNull();
  });
});

describe("isCountableOriginal", () => {
  const song = (metadata: unknown, original_song_id: string | null = null) =>
    ({ metadata, original_song_id }) as Parameters<
      typeof isCountableOriginal
    >[0];

  test("원곡·발매곡만 센다", () => {
    expect(isCountableOriginal(song(null))).toBe(true);
    expect(isCountableOriginal(song(null, "orig"))).toBe(false);
    expect(isCountableOriginal(song({ unrelease: "true" }))).toBe(false);
  });

  test("협업곡은 세지 않는다", () => {
    expect(isCountableOriginal(song({ collab: "영화 타이업" }))).toBe(false);
  });
});
