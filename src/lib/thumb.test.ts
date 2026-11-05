import { describe, expect, test } from "vitest";
import { thumbSrc } from "@/lib/thumb";

describe("thumbSrc", () => {
  test("R2 이미지는 화면 크기의 2배 너비로 줄인 주소", () => {
    expect(
      thumbSrc("https://assets.ztmy-sounds.fans/single/byoushin.webp", 48),
    ).toBe(
      "https://assets.ztmy-sounds.fans/cdn-cgi/image/width=96,format=auto/single/byoushin.webp",
    );
  });

  test("다른 주소·이미 변환된 주소는 그대로", () => {
    expect(thumbSrc("/assets/logo.webp", 48)).toBe("/assets/logo.webp");
    const done =
      "https://assets.ztmy-sounds.fans/cdn-cgi/image/width=96,format=auto/a.webp";
    expect(thumbSrc(done, 48)).toBe(done);
  });
});
