import { describe, expect, test } from "vitest";
import {
  findAddedDate,
  parseNameStatusLog,
} from "@/features/guide/lib/song-added-dates";

// 최신→과거 순, git log --name-status --format=%x00%aI 모양
const LOG = [
  "\x002026-09-01T21:44:35+09:00",
  "",
  "R100\tsrc/data/songs/11_hanaichi.ts\tsrc/features/songs/48_hanaichi.ts",
  "R095\tsrc/data/songs/04_seigi.ts\tsrc/features/songs/08_seigi.ts",
  "\x002026-08-24T17:29:19+09:00",
  "",
  "A\tsrc/data/songs/11_hanaichi.ts",
  "\x002026-08-22T00:09:59+09:00",
  "",
  "A\tsrc/data/songs/04_seigi.ts",
  "",
].join("\n");

describe("song-added-dates", () => {
  const commits = parseNameStatusLog(LOG);

  test("이름 변경을 거슬러 처음 추가된 커밋 날짜를 찾는다", () => {
    expect(
      findAddedDate(
        commits,
        "src/features/songs/48_hanaichi.ts",
      )?.toISOString(),
    ).toBe("2026-08-24T08:29:19.000Z");
    expect(
      findAddedDate(commits, "src/features/songs/08_seigi.ts")?.toISOString(),
    ).toBe("2026-08-21T15:09:59.000Z");
  });

  test("기록에 없는 파일(커밋 전 새 곡)은 null", () => {
    expect(findAddedDate(commits, "src/features/songs/99_new.ts")).toBeNull();
  });
});
