import { describe, expect, test } from "vitest";
import { thumbSrc, thumbSrcSet } from "@/lib/thumb";

describe("thumbSrc", () => {
  test("R2 이미지는 화면 크기의 2배 너비로 줄인 주소", () => {
    expect(
      thumbSrc("https://assets.ztmy-sounds.fans/single/byoushin.webp", 48),
    ).toBe(
      "https://assets.ztmy-sounds.fans/cdn-cgi/image/width=96,quality=90,format=auto/single/byoushin.webp",
    );
  });

  test("사이트 안 /assets/ 이미지도 같은 도메인의 변환 주소", () => {
    expect(thumbSrc("/assets/info/kv.webp", 96)).toBe(
      "/cdn-cgi/image/width=192,quality=90,format=auto/assets/info/kv.webp",
    );
  });

  test("다른 주소·이미 변환된 주소는 그대로", () => {
    expect(thumbSrc("/backgrounds/bg.webp", 48)).toBe("/backgrounds/bg.webp");
    expect(thumbSrc("https://example.com/a.webp", 48)).toBe(
      "https://example.com/a.webp",
    );
    const done =
      "https://assets.ztmy-sounds.fans/cdn-cgi/image/width=96,format=auto/a.webp";
    expect(thumbSrc(done, 48)).toBe(done);
    const localDone = "/cdn-cgi/image/width=96,format=auto/assets/a.webp";
    expect(thumbSrc(localDone, 48)).toBe(localDone);
  });

  test("srcset은 2배 폭까지의 후보 폭", () => {
    expect(thumbSrcSet("/assets/info/kv.webp", 1000)).toBe(
      [400, 800, 1200, 1600, 2000]
        .map(
          (w) =>
            `/cdn-cgi/image/width=${w},quality=90,format=auto/assets/info/kv.webp ${w}w`,
        )
        .join(", "),
    );
  });

  test("작게 보이는 이미지도 휴대폰 화면 폭 가득(1200)까지", () => {
    expect(thumbSrcSet("/assets/info/kv.webp", 320)).toBe(
      [400, 800, 1200]
        .map(
          (w) =>
            `/cdn-cgi/image/width=${w},quality=90,format=auto/assets/info/kv.webp ${w}w`,
        )
        .join(", "),
    );
  });

  test("2배 폭이 후보에 없으면 끝에 붙이고, 있으면 겹치지 않는다", () => {
    const widths = (displayWidth: number) =>
      thumbSrcSet("/assets/a.webp", displayWidth)!
        .split(", ")
        .map((entry) => Number(entry.split(" ")[1].slice(0, -1)));
    expect(widths(700)).toEqual([400, 800, 1200, 1400]);
    expect(widths(600)).toEqual([400, 800, 1200]);
  });

  test("바꿀 수 없는 주소는 srcset 없음", () => {
    expect(thumbSrcSet("/backgrounds/bg.webp", 500)).toBeNull();
  });
});
