import { describe, expect, test } from "vitest";
import {
  summarizeAttendance,
  type AttendanceSong,
} from "@/features/zutopia/attendance/summarize";
import type { LiveUnit } from "@/features/zutopia/live-history/types";

function unit(id: string, date: string, songIds: string[]): LiveUnit {
  return {
    id,
    liveId: id.split(":")[0],
    date,
    type: "CONCERT",
    title: "t",
    titleKo: null,
    city: "서울",
    tourId: null,
    dayNumber: null,
    href: null,
    songIds,
    imageUrl: null,
    groupImageUrl: null,
  };
}

function song(id: string, releaseDate: string, title = id): AttendanceSong {
  return {
    id,
    slug: id,
    title,
    titleKo: `${title}-ko`,
    titleEn: `${title}-en`,
    releaseDate,
    coverSrc: null,
  };
}

const songs = [
  song("s3", "2021-01-01"),
  song("s1", "2018-06-04"),
  song("s2", "2019-10-30"),
  song("s4", "2022-01-01"),
];
const units = [
  unit("B:2026-03-14", "2026-03-14", ["s1", "s2", "x-unknown"]),
  unit("A:2024-06-15", "2024-06-15", ["s1", "s3"]),
  unit("C:2025-01-01", "2025-01-01", ["s2"]),
];

describe("summarizeAttendance", () => {
  test("체크 없으면 빈 결과, 못 들은 곡은 발매일 순 전부", () => {
    expect(summarizeAttendance(units, new Set(), songs)).toEqual({
      attendedCount: 0,
      heard: [],
      unheard: [songs[1], songs[2], songs[0], songs[3]],
      period: null,
    });
  });

  test("없는 단위 ID는 무시", () => {
    const result = summarizeAttendance(
      units,
      new Set(["gone:2020-01-01", "A:2024-06-15"]),
      songs,
    );
    expect(result.attendedCount).toBe(1);
    expect(result.period).toEqual({ from: "2024-06-15", to: "2024-06-15" });
  });

  test("정렬: 횟수 많은 순, 같으면 발매일 순", () => {
    const result = summarizeAttendance(
      units,
      new Set(["A:2024-06-15", "B:2026-03-14", "C:2025-01-01"]),
      songs,
    );
    expect(result.heard.map((s) => [s.id, s.count])).toEqual([
      ["s1", 2],
      ["s2", 2],
      ["s3", 1],
    ]);
  });

  test("songs에 없는 곡은 세지 않고, 못 들은 곡은 한 번도 없는 곡", () => {
    const result = summarizeAttendance(units, new Set(["B:2026-03-14"]), songs);
    expect(result.heard.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(result.unheard.map((s) => s.id)).toEqual(["s3", "s4"]);
  });

  test("들은 곡마다 들은 공연일 ID(최신 먼저)", () => {
    const result = summarizeAttendance(
      units,
      new Set(["A:2024-06-15", "B:2026-03-14"]),
      songs,
    );
    const byId = Object.fromEntries(result.heard.map((s) => [s.id, s.unitIds]));
    expect(byId).toEqual({
      s1: ["B:2026-03-14", "A:2024-06-15"],
      s2: ["B:2026-03-14"],
      s3: ["A:2024-06-15"],
    });
  });

  test("period는 체크한 단위의 최소~최대 날짜", () => {
    const result = summarizeAttendance(
      units,
      new Set(["B:2026-03-14", "A:2024-06-15"]),
      songs,
    );
    expect(result.period).toEqual({ from: "2024-06-15", to: "2026-03-14" });
  });
});
