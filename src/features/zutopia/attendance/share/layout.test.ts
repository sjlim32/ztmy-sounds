import { describe, expect, test } from "vitest";
import {
  listAreaHeight,
  pickShareLayout,
  READABLE_TITLE_PX,
  rowHeight,
} from "@/features/zutopia/attendance/share/layout";

describe("pickShareLayout", () => {
  test("곡이 적으면 2열 + 커버 + 일본어/한국어/영어, 기본 크기", () => {
    const layout = pickShareLayout(4);
    expect(layout).toMatchObject({
      columns: 2,
      showCover: true,
      showEnglish: true,
    });
    expect(pickShareLayout(1)).toEqual(pickShareLayout(4));
  });

  test("2열이 작아지면 커버를 둔 채 3열로", () => {
    expect(pickShareLayout(10)).toMatchObject({ columns: 2, showCover: true });
    const layout = pickShareLayout(14);
    expect(layout).toMatchObject({ columns: 3, showCover: true });
    expect(layout.titlePx).toBeGreaterThanOrEqual(READABLE_TITLE_PX);
  });

  test("곡이 많으면 열을 늘리고 커버를 뺀다(일본어 + 한국어는 남김)", () => {
    const layout = pickShareLayout(62);
    expect(layout.columns).toBeGreaterThan(2);
    expect(layout.showCover).toBe(false);
    expect(layout.showEnglish).toBe(false);
  });

  test("열을 늘리는 쪽이 2열로 줄이는 것보다 글자가 크다", () => {
    for (const n of [20, 30, 45, 62, 80]) {
      const twoColumn = pickShareLayout(n, { maxColumns: 2 });
      expect(pickShareLayout(n).titlePx).toBeGreaterThan(twoColumn.titlePx);
    }
  });

  test("몇 곡이든 목록이 캔버스 안에 들어간다", () => {
    for (let n = 1; n <= 120; n++) {
      const layout = pickShareLayout(n);
      expect(
        Math.ceil(n / layout.columns) * rowHeight(layout),
      ).toBeLessThanOrEqual(listAreaHeight());
    }
  });
});
