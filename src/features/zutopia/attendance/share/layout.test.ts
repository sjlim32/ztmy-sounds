import { describe, expect, test } from "vitest";
import {
  COVER_UNTIL,
  pickShareLayout,
  READABLE_REST_PX,
  restAreaHeight,
  restRowHeight,
  SHARE_INNER_WIDTH,
  TOP_COUNT,
  TOP_GAP,
} from "@/features/zutopia/attendance/share/layout";

describe("pickShareLayout", () => {
  test("TOP 5는 늘 따로, 나머지는 6위부터", () => {
    const layout = pickShareLayout(30);
    expect(layout.topCount).toBe(TOP_COUNT);
    expect(layout.rest?.count).toBe(30 - TOP_COUNT);
  });

  test("5곡 이하면 TOP 카드만, 적을수록 카드가 커지되 한 줄 폭 안", () => {
    const three = pickShareLayout(3);
    const five = pickShareLayout(5);
    expect(three.rest).toBeNull();
    expect(three.topCount).toBe(3);
    expect(three.topCardWidth).toBeGreaterThan(five.topCardWidth);
    for (const n of [1, 2, 3, 4, 5]) {
      const { topCardWidth, topCount } = pickShareLayout(n);
      expect(
        topCardWidth * topCount + TOP_GAP * (topCount - 1),
      ).toBeLessThanOrEqual(SHARE_INNER_WIDTH);
    }
  });

  test(`성불 ${COVER_UNTIL}곡 미만이면 나머지 목록도 앨범 표지를 꼭 넣는다`, () => {
    for (let n = 6; n < COVER_UNTIL; n++)
      expect(pickShareLayout(n).rest?.showCover).toBe(true);
    expect(pickShareLayout(COVER_UNTIL).rest?.showCover).toBe(false);
    expect(pickShareLayout(80).rest?.showCover).toBe(false);
  });

  test("곡이 적은 목록은 읽기 좋은 크기", () => {
    expect(pickShareLayout(12).rest!.titlePx).toBeGreaterThanOrEqual(
      READABLE_REST_PX,
    );
  });

  test("몇 곡이든 나머지 목록이 자리 안에 들어간다", () => {
    for (let n = 6; n <= 120; n++) {
      const rest = pickShareLayout(n).rest!;
      expect(
        Math.ceil(rest.count / rest.columns) * restRowHeight(rest),
      ).toBeLessThanOrEqual(restAreaHeight());
      expect(rest.coverPx).toBeGreaterThanOrEqual(rest.showCover ? 1 : 0);
    }
  });
});
