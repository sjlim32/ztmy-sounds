import { describe, expect, test } from "vitest";
import {
  findAddedDate,
  findLastModifiedDate,
  parseNameStatusLog,
  parseSongId,
} from "@/features/guide/lib/song-history";

// 최신→과거 순, git log --name-status --format=%x00%aI 모양
const LOG = [
  "\x002026-11-18T10:00:00+09:00",
  "",
  "R095\tsrc/features/guide/data/not-yet/04_saturn.ts\tsrc/features/guide/data/songs/04_saturn.ts",
  "\x002026-10-01T10:00:00+09:00",
  "",
  "A\tsrc/features/guide/data/not-yet/04_saturn.ts",
  "\x002026-09-03T10:00:00+09:00",
  "",
  "M\tsrc/features/guide/data/songs/48_hanaichi.ts",
  "\x002026-09-01T21:44:35+09:00",
  "",
  "R100\tsrc/data/songs/11_hanaichi.ts\tsrc/features/guide/data/songs/48_hanaichi.ts",
  "R095\tsrc/data/songs/04_seigi.ts\tsrc/features/guide/data/songs/08_seigi.ts",
  "\x002026-08-24T17:29:19+09:00",
  "",
  "A\tsrc/data/songs/11_hanaichi.ts",
  "M\tsrc/data/songs/04_seigi.ts",
  "\x002026-08-22T00:09:59+09:00",
  "",
  "A\tsrc/data/songs/04_seigi.ts",
  "",
].join("\n");

describe("song-history", () => {
  const commits = parseNameStatusLog(LOG);

  test("이름 변경을 거슬러 처음 추가된 커밋 날짜를 찾는다", () => {
    expect(
      findAddedDate(
        commits,
        "src/features/guide/data/songs/48_hanaichi.ts",
      )?.toISOString(),
    ).toBe("2026-08-24T08:29:19.000Z");
    expect(
      findAddedDate(
        commits,
        "src/features/guide/data/songs/08_seigi.ts",
      )?.toISOString(),
    ).toBe("2026-08-21T15:09:59.000Z");
  });

  test("not-yet/에서 옮겨 온 곡은 옮긴 날이 추가된 날", () => {
    expect(
      findAddedDate(
        commits,
        "src/features/guide/data/songs/04_saturn.ts",
      )?.toISOString(),
    ).toBe("2026-11-18T01:00:00.000Z");
  });

  test("마지막 수정일은 지금 경로를 바꾼 가장 최근 커밋(이름 변경 포함)", () => {
    expect(
      findLastModifiedDate(
        commits,
        "src/features/guide/data/songs/48_hanaichi.ts",
      )?.toISOString(),
    ).toBe("2026-09-03T01:00:00.000Z");
    expect(
      findLastModifiedDate(
        commits,
        "src/features/guide/data/songs/08_seigi.ts",
      )?.toISOString(),
    ).toBe("2026-09-01T12:44:35.000Z");
  });

  test("이름만 바꾼 커밋(R100)은 수정으로 치지 않고 옮기기 전 경로로 이어서 찾는다", () => {
    const renumbered = parseNameStatusLog(
      [
        "\x002026-11-01T00:00:00Z",
        "",
        "R100\tsrc/features/guide/data/songs/01_a.ts\tsrc/features/guide/data/songs/02_a.ts",
        "\x002026-10-01T00:00:00Z",
        "",
        "M\tsrc/features/guide/data/songs/01_a.ts",
        "",
      ].join("\n"),
    );
    expect(
      findLastModifiedDate(
        renumbered,
        "src/features/guide/data/songs/02_a.ts",
      )?.toISOString(),
    ).toBe("2026-10-01T00:00:00.000Z");
  });

  test("기록에 없는 파일(커밋 전 새 곡)은 null", () => {
    expect(
      findAddedDate(commits, "src/features/guide/data/songs/99_new.ts"),
    ).toBeNull();
    expect(
      findLastModifiedDate(commits, "src/features/guide/data/songs/99_new.ts"),
    ).toBeNull();
  });

  test("parseSongId는 파일 안의 첫 id를 읽는다", () => {
    expect(
      parseSongId(
        'const t = { jp: "x" };\nconst song: Song = {\n  id: "study-me",\n  title: t,\n};',
      ),
    ).toBe("study-me");
    expect(parseSongId("const x = 1;")).toBeNull();
  });
});
