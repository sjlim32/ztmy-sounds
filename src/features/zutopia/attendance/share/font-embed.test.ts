import { describe, expect, test } from "vitest";
import {
  parseUnicodeRange,
  rangeCovers,
  pickWoff2Url,
  selectFontFaces,
  type FontFace,
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

describe("selectFontFaces", () => {
  const face = (
    family: string,
    weight: [number, number],
    url: string,
    range: [number, number][] = [],
  ): FontFace => ({ family, weight, url, range });
  const codes = new Set([..."가A"].map((c) => c.codePointAt(0)!));

  test("쓰인 굵기에 가장 가까운 면만, 같은 파일은 굵기 범위로 하나", () => {
    const faces = [
      face("KR", [400, 400], "rg.woff2"),
      face("KR", [500, 500], "rg.woff2"),
      face("KR", [700, 700], "bd.woff2"),
      face("KR", [800, 800], "bd.woff2"),
    ];
    const picked = selectFontFaces(
      faces,
      new Map([["KR", new Set([400])]]),
      codes,
    );
    expect(picked).toEqual([{ ...faces[0], weight: [400, 400] }]);
  });

  test("정확한 굵기가 없으면 가까운 쪽, 여러 굵기면 각각", () => {
    const faces = [
      face("KR", [400, 400], "rg.woff2"),
      face("KR", [700, 700], "bd.woff2"),
    ];
    const picked = selectFontFaces(
      faces,
      new Map([["KR", new Set([500, 800])]]),
      codes,
    );
    expect(picked.map((f) => f.url)).toEqual(["rg.woff2", "bd.woff2"]);
  });

  test("이미지 글자가 없는 서브셋과 안 쓰는 글꼴은 뺀다", () => {
    const faces = [
      face("JP", [400, 400], "jp-kana.woff2", [[0x3040, 0x30ff]]),
      face("JP", [400, 400], "jp-latin.woff2", [[0x0, 0xff]]),
      face("Other", [400, 400], "o.woff2"),
    ];
    const picked = selectFontFaces(
      faces,
      new Map([["JP", new Set([400])]]),
      codes,
    );
    expect(picked.map((f) => f.url)).toEqual(["jp-latin.woff2"]);
  });
});
