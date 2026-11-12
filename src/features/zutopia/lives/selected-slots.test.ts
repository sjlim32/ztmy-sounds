import { describe, expect, test } from "vitest";
import { collectSelectedSlots } from "./TourDateList";
import { splitLiveDays } from "./live-days";
import type { LiveDetail, LiveSetlistEntry } from "./types";

function entry(
  songId: string,
  trackNumber: number,
  dayNumber: number,
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
