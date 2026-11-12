import { describe, expect, test } from "vitest";
import { splitLiveDays } from "./live-days";
import type { LiveDetail, LiveSetlistEntry } from "./types";

function entry(
  songId: string,
  trackNumber: number,
  dayNumber: number | null,
  isEncore = false,
): LiveSetlistEntry {
  return {
    songId,
    title: songId,
    titleKo: songId,
    titleEn: songId,
    guideHref: null,
    trackNumber,
    isEncore,
    isSelected: false,
    dayNumber,
    showNumber: null,
    showLabel: null,
    arrange: null,
    info: null,
    variation: null,
    unreleased: false,
    isCover: false,
    coverArtist: null,
  };
}

function live(overrides: Partial<LiveDetail>): LiveDetail {
  return {
    id: "L",
    start_date: "2024-05-04",
    end_date: "2024-05-05",
    live_date: null,
    region: "横浜 (요코하마)",
    country: "일본",
    type: "CONCERT",
    live_venue: "Kアリーナ横浜",
    setlist: [],
    ...overrides,
  } as LiveDetail;
}

describe("splitLiveDays", () => {
  test("하루 공연이거나 출연일(live_date)이 있으면 나누지 않는다", () => {
    expect(splitLiveDays(live({ end_date: null }))).toBeNull();
    expect(splitLiveDays(live({ live_date: "2024-05-04" }))).toBeNull();
    expect(splitLiveDays(live({ type: "FESTIVAL" }))).toBeNull();
  });

  test("모든 날 부른 곡은 공통, 나머지는 그날의 선택곡", () => {
    const result = splitLiveDays(
      live({
        setlist: [
          entry("a", 1, 1),
          entry("x", 2, 1),
          entry("b", 3, 1),
          entry("e", 4, 1, true),
          entry("a", 1, 2),
          entry("b", 2, 2),
          entry("e", 3, 2, true),
        ],
      }),
    )!;
    expect(
      result.common.map((e) => [e.songId, e.trackNumber, e.dayNumber]),
    ).toEqual([
      ["a", 1, null],
      ["b", 3, null],
      ["e", 4, null],
    ]);
    expect(result.dates.map((d) => [d.id, d.startDate, d.city])).toEqual([
      ["L:1:1", "2024-05-04", "요코하마"],
      ["L:2:1", "2024-05-05", "요코하마"],
    ]);
    const day1Selected = result.dates[0].setlist.filter((e) => e.isSelected);
    expect(day1Selected.map((e) => [e.songId, e.dayNumber])).toEqual([
      ["x", 1],
    ]);
    expect(result.dates[1].setlist.some((e) => e.isSelected)).toBe(false);
  });

  test("일차 없는 곡은 매일 부른 곡으로 본다", () => {
    const result = splitLiveDays(
      live({ setlist: [entry("a", 1, null), entry("y", 2, 2)] }),
    )!;
    expect(result.common.map((e) => e.songId)).toEqual(["a"]);
    expect(
      result.dates[1].setlist.map((e) => [e.songId, e.isSelected]),
    ).toEqual([
      ["a", false],
      ["y", true],
    ]);
  });

  test("하루 여러 회차(metadata.shows)면 날짜 × 회차로 나눈다", () => {
    const show = (
      songId: string,
      track: number,
      day: number,
      n: number | null,
    ) => ({
      ...entry(songId, track, day),
      showNumber: n,
    });
    const result = splitLiveDays(
      live({
        start_date: "2021-05-15",
        end_date: "2021-05-16",
        metadata: { shows: ["昼の部", "夜の部"] },
        setlist: [
          show("a", 1, 1, null),
          show("noon", 2, 1, 1),
          show("night", 2, 1, 2),
          show("a", 1, 2, null),
          show("b", 2, 2, null),
        ],
      }),
    )!;
    expect(
      result.dates.map((d) => [d.startDate, d.dayNumber, d.showLabel]),
    ).toEqual([
      ["2021-05-15", 1, "昼の部"],
      ["2021-05-15", 1, "夜の部"],
      ["2021-05-16", 2, "昼の部"],
      ["2021-05-16", 2, "夜の部"],
    ]);
    expect(result.common.map((e) => e.songId)).toEqual(["a"]);
    const night = result.dates[1].setlist.filter((e) => e.isSelected);
    expect(night.map((e) => [e.songId, e.dayNumber, e.showLabel])).toEqual([
      ["night", 1, "夜の部"],
    ]);
  });

  test("하루 공연이라도 회차가 여럿이면 회차만 나눈다", () => {
    const result = splitLiveDays(
      live({ end_date: null, metadata: { shows: ["1부", "2부"] } }),
    )!;
    expect(result.dates.map((d) => [d.dayNumber, d.showLabel])).toEqual([
      [undefined, "1부"],
      [undefined, "2부"],
    ]);
  });

  test("metadata 없이 세트리스트 show_number만 있어도 회차로 나눈다(중복 없음)", () => {
    const show = (songId: string, track: number, day: number, n: number) => ({
      ...entry(songId, track, day),
      showNumber: n,
    });
    const result = splitLiveDays(
      live({
        start_date: "2021-05-15",
        end_date: "2021-05-16",
        setlist: [
          show("a", 1, 1, 1),
          show("a", 1, 1, 2),
          show("a", 1, 2, 1),
          show("a", 1, 2, 2),
        ],
      }),
    )!;
    expect(result.dates.map((d) => [d.dayNumber, d.showLabel])).toEqual([
      [1, "1회차"],
      [1, "2회차"],
      [2, "1회차"],
      [2, "2회차"],
    ]);
    // 공통 세트리스트엔 곡이 한 번만
    expect(result.common.map((e) => e.songId)).toEqual(["a"]);
  });
});
