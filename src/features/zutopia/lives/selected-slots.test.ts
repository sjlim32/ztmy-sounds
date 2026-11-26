import { describe, expect, test } from "vitest";
import { collectSelectedSlots } from "./TourDateList";
import { splitLiveDays } from "./live-days";
import type { LiveDetail, LiveSetlistEntry, TourDateEntry } from "./types";

function entry(
  songId: string,
  trackNumber: number,
  dayNumber: number | null,
): LiveSetlistEntry {
  return {
    songId,
    title: songId,
    titleKo: songId,
    titleEn: songId,
    guideHref: null,
    trackNumber,
    isEncore: false,
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
    cover: null,
    medley: null,
  };
}

describe("collectSelectedSlots", () => {
  test("공통 곡 둘의 순서만 바뀐 날도 선택곡은 같은 빈 번호 자리", () => {
    // DAY 1: a b c(선택) d / DAY 2: b a x(선택) d — 둘 다 3번이 선택곡
    const live = {
      id: "L",
      type: "CONCERT",
      start_date: "2024-01-13",
      end_date: "2024-01-14",
      live_date: null,
      region: "沖縄 (오키나와)",
      country: "일본",
      live_venue: "v",
      setlist: [
        entry("a", 1, 1),
        entry("b", 2, 1),
        entry("c", 3, 1),
        entry("d", 4, 1),
        entry("b", 1, 2),
        entry("a", 2, 2),
        entry("x", 3, 2),
        entry("d", 4, 2),
      ],
    } as unknown as LiveDetail;
    const { common, dates } = splitLiveDays(live)!;
    const slots = collectSelectedSlots(common, dates);
    expect(
      slots.map((slot) => [slot.label, slot.songs.map((s) => s.title)]),
    ).toEqual([["03", ["c", "x"]]]);
  });
});

describe("빈 번호보다 선택곡이 많은 날", () => {
  test("빈 번호 2칸(7·8)에 3곡을 부르면 세 번째는 마지막 빈 번호 뒤(08-1)", () => {
    const common = [6, 9].map((n) => entry(`c${n}`, n, null));
    const date = {
      id: "D",
      setlist: [
        { ...entry("c6", 6, null) },
        { ...entry("x", 7, null), isSelected: true },
        { ...entry("y", 8, null), isSelected: true },
        { ...entry("z", 9, null), isSelected: true },
        { ...entry("c9", 10, null) },
      ],
    } as unknown as TourDateEntry;
    const slots = collectSelectedSlots(common, [date]);
    expect(
      slots
        .sort((a, b) => a.trackNumber - b.trackNumber)
        .map((slot) => [slot.label, slot.songs.map((s) => s.title)]),
    ).toEqual([
      ["07", ["x"]],
      ["08", ["y"]],
      ["08-1", ["z"]],
    ]);
  });
});
