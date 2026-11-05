import { describe, expect, test } from "vitest";
import {
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

describe("visibleNameCount", () => {
  test("자리가 넉넉하면 전부", () => {
    expect(visibleNameCount(3, 1000)).toBe(3);
  });

  test("모자라면 '외 N개' 줄 자리를 빼고 들어가는 만큼(최소 1)", () => {
    // 그림 52 + '외 N개' 24 + 이름 44씩 → 220이면 (220-76)/44 = 3개
    expect(visibleNameCount(6, 220)).toBe(3);
    expect(visibleNameCount(6, 50)).toBe(1);
  });
});
