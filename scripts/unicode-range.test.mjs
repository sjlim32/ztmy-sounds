import { describe, expect, test } from "vitest";
import { codesInRanges, toUnicodeRange } from "./unicode-range.mjs";

describe("toUnicodeRange", () => {
  test("이어진 값은 구간, 떨어진 값은 하나씩", () => {
    expect(toUnicodeRange([0xac02, 0xac00, 0xac01, 0xac05, 0xac05])).toBe(
      "U+AC00-AC02, U+AC05",
    );
  });
  test("빈 집합은 빈 문자열", () => {
    expect(toUnicodeRange([])).toBe("");
  });
});

describe("codesInRanges", () => {
  test("구간에서 제외 집합을 뺀다", () => {
    expect(codesInRanges([[0x41, 0x45]], new Set([0x42, 0x44]))).toEqual([
      0x41, 0x43, 0x45,
    ]);
  });
});
