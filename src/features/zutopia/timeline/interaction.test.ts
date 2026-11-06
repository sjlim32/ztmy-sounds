import { describe, expect, test } from "vitest";
import {
  textLines,
  visibleNameCount,
  wheelIntent,
} from "@/features/zutopia/timeline/interaction";

describe("wheelIntent", () => {
  const wheel = (over: Partial<Parameters<typeof wheelIntent>[0]>) => ({
    ctrlKey: false,
    metaKey: false,
    deltaX: 0,
    deltaY: 40,
    ...over,
  });

  test("Ctrl/⌘ + 휠은 확대 단계", () => {
    expect(
      wheelIntent(wheel({ ctrlKey: true }), {
        canScrollY: false,
        atEdge: false,
      }),
    ).toBe("zoom");
    expect(
      wheelIntent(wheel({ metaKey: true }), {
        canScrollY: true,
        atEdge: false,
      }),
    ).toBe("zoom");
  });

  test("세로로 넘친 내용이 없으면 세로 휠을 좌우 이동으로", () => {
    expect(wheelIntent(wheel({}), { canScrollY: false, atEdge: false })).toBe(
      "horizontal",
    );
  });

  test("세로로 넘쳤으면 세로 휠은 브라우저 기본(세로 스크롤)에 맡긴다", () => {
    expect(wheelIntent(wheel({}), { canScrollY: true, atEdge: false })).toBe(
      "native",
    );
  });

  test("좌우 끝에 닿았으면 세로 휠을 페이지에 넘긴다", () => {
    expect(wheelIntent(wheel({}), { canScrollY: false, atEdge: true })).toBe(
      "native",
    );
  });

  test("가로 휠(트랙패드 좌우)은 기본 동작", () => {
    expect(
      wheelIntent(wheel({ deltaX: 50, deltaY: 5 }), {
        canScrollY: false,
        atEdge: false,
      }),
    ).toBe("native");
  });
});

describe("textLines", () => {
  test("한·일 글자는 한 글자 폭, 영문·숫자는 그보다 좁게 어림", () => {
    // 폭 140px, 14px 글자 → 한 줄에 한·일 10자
    expect(textLines("秒針を噛む", 140, 14)).toBe(1);
    expect(textLines("あいつら全員同窓会あいつら", 140, 14)).toBe(2);
    expect(textLines("ZUTOMAYO", 140, 14)).toBe(1);
    expect(textLines("ZUTOMAYO INTENSE II", 140, 14)).toBe(2);
    expect(textLines("", 140, 14)).toBe(0);
  });
});

describe("visibleNameCount", () => {
  test("자리가 넉넉하면 전부", () => {
    expect(visibleNameCount([40, 40, 40], 1000)).toBe(3);
  });

  test("모자라면 '외 N개' 줄 자리를 빼고 들어가는 만큼(최소 1)", () => {
    // 그림 52 + '외 N개' 24 → 220이면 이름 높이 144까지: 40+60+40 = 140 → 3개
    expect(visibleNameCount([40, 60, 40, 40, 40, 40], 220)).toBe(3);
    expect(visibleNameCount([40, 40, 40], 50)).toBe(1);
  });
});
