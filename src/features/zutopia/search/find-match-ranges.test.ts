import { describe, expect, test } from "vitest";
import { findMatchRanges } from "./search";

describe("findMatchRanges", () => {
  test("검색어가 들어 있는 범위를 원문 위치로 돌려준다", () => {
    expect(findMatchRanges("초침을 깨물다", "초침")).toEqual([[0, 2]]);
  });

  test("띄어쓰기·대소문자·전각을 무시하고 원문 범위는 띄어쓰기를 포함한다", () => {
    expect(findMatchRanges("Byte Ｂｏｙ", "tebo")).toEqual([[2, 7]]);
    expect(findMatchRanges("초침을 깨물다", "을깨")).toEqual([[2, 5]]);
  });

  test("띄어 친 단어는 각각 찾고, 겹치거나 맞닿은 범위는 합친다", () => {
    expect(findMatchRanges("니라 니와", "니와 니라")).toEqual([
      [0, 2],
      [3, 5],
    ]);
    expect(findMatchRanges("abcabc", "abc bca")).toEqual([[0, 6]]);
  });

  test("걸리지 않거나 검색어가 비면 빈 배열", () => {
    expect(findMatchRanges("초침을 깨물다", "마")).toEqual([]);
    expect(findMatchRanges("초침을 깨물다", "  ")).toEqual([]);
  });
});

describe("findMatchRanges — 특수 글자", () => {
  test("서로게이트 쌍(이모지·확장 한자)이 앞에 있어도 위치가 맞다", () => {
    expect(findMatchRanges("😀abc", "abc")).toEqual([[2, 5]]);
    expect(findMatchRanges("𠮷野家 abc", "野家")).toEqual([[2, 4]]);
    expect(findMatchRanges("a😀b", "😀")).toEqual([[1, 3]]);
  });

  test("반각 탁점처럼 앞 글자와 합쳐지는 글자도 강조한다", () => {
    expect(findMatchRanges("ｶﾞｸ", "ガ")).toEqual([[0, 2]]);
  });
});
