import { describe, expect, test } from "vitest";
import {
  parseUnicodeRange,
  rangeCovers,
  pickWoff2Url,
} from "@/features/zutopia/attendance/share/font-embed";

describe("parseUnicodeRange", () => {
  test("단일·구간·와일드카드", () => {
    expect(parseUnicodeRange("U+0-FF, U+131, U+4E??")).toEqual([
      [0x0, 0xff],
      [0x131, 0x131],
      [0x4e00, 0x4eff],
    ]);
  });
});

describe("rangeCovers", () => {
  test("글자 하나라도 범위에 들면 true, 범위가 없으면 언제나 true", () => {
    const codes = new Set([..."秒針"].map((c) => c.codePointAt(0)!));
    expect(rangeCovers(parseUnicodeRange("U+79D2"), codes)).toBe(true);
    expect(rangeCovers(parseUnicodeRange("U+3000-303F"), codes)).toBe(false);
    expect(rangeCovers([], codes)).toBe(true);
  });
});

describe("pickWoff2Url", () => {
  test("src에서 woff2 주소만", () => {
    expect(
      pickWoff2Url(
        'url(./files/a-400.woff2) format("woff2"), url(./files/a-400.woff) format("woff")',
      ),
    ).toBe("./files/a-400.woff2");
    expect(pickWoff2Url('url("/x.woff2") format("woff2")')).toBe("/x.woff2");
    expect(pickWoff2Url('url(/x.ttf) format("truetype")')).toBeNull();
  });
});
