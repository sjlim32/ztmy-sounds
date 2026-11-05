import { describe, expect, test } from "vitest";
import {
  backupFileName,
  parseBackup,
  parseAttendance,
  safeRead,
  safeWrite,
  serializeAttendance,
} from "@/features/zutopia/attendance/storage";

describe("parseAttendance", () => {
  test("null·깨진 JSON·다른 형식은 빈 데이터", () => {
    for (const raw of [
      null,
      "{",
      "[]",
      '{"version":2,"attended":["a"]}',
      '{"version":1,"attended":"a"}',
    ]) {
      expect(parseAttendance(raw).attended).toEqual([]);
    }
  });

  test("문자열 아닌 항목은 버리고 중복 제거", () => {
    expect(
      parseAttendance('{"version":1,"attended":["a",1,"a","b"],"updatedAt":""}')
        .attended,
    ).toEqual(["a", "b"]);
  });
});

describe("parseBackup", () => {
  test("형식이 다르면 null", () => {
    expect(parseBackup('{"foo":1}')).toBeNull();
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup('{"version":1,"attended":[1,2]}')).toBeNull();
  });

  test("정상 백업은 그대로", () => {
    expect(
      parseBackup(
        '{"version":1,"attended":["x:2026-03-14"],"updatedAt":"2026-11-05T00:00:00.000Z"}',
      ),
    ).toEqual({
      version: 1,
      attended: ["x:2026-03-14"],
      updatedAt: "2026-11-05T00:00:00.000Z",
    });
  });
});

test("serialize → parse 왕복", () => {
  const now = new Date("2026-11-05T01:02:03.000Z");
  const raw = serializeAttendance(new Set(["b", "a"]), now);
  expect(parseAttendance(raw)).toEqual({
    version: 1,
    attended: ["a", "b"],
    updatedAt: "2026-11-05T01:02:03.000Z",
  });
  expect(parseBackup(raw)).toEqual(parseAttendance(raw));
});

test("backupFileName은 로컬 날짜", () => {
  expect(backupFileName(new Date(2026, 10, 5))).toBe(
    "ztmy-attendance-20261105.json",
  );
});

describe("safeRead/safeWrite", () => {
  test("예외를 삼킨다", () => {
    const throwing = {
      getItem(): string | null {
        throw new Error("denied");
      },
      setItem(): void {
        throw new Error("quota");
      },
    };
    expect(safeRead(throwing)).toBeNull();
    expect(safeWrite(throwing, "x")).toBe(false);
  });

  test("storage가 없으면 null/false", () => {
    expect(safeRead(undefined)).toBeNull();
    expect(safeWrite(undefined, "x")).toBe(false);
  });

  test("정상 저장소는 읽고 쓴다", () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    };
    expect(safeWrite(storage, "v")).toBe(true);
    expect(safeRead(storage)).toBe("v");
  });
});
