import { describe, expect, test } from "vitest";
import {
  daysAt,
  scrollLeftFor,
  stepZoom,
  yearPxPerDay,
  YEAR_MIN_WIDTH,
} from "@/features/zutopia/timeline/zoom";

describe("stepZoom", () => {
  test("연 ↔ 월 ↔ 주, 양 끝에서 멈춘다", () => {
    expect(stepZoom("month", 1)).toBe("week");
    expect(stepZoom("month", -1)).toBe("year");
    expect(stepZoom("year", -1)).toBe("year");
    expect(stepZoom("week", 1)).toBe("week");
  });
});

describe("yearPxPerDay", () => {
  test("전체가 화면 폭에 들어가게, 해 하나는 최소 폭 이상", () => {
    expect(yearPxPerDay(3650, 3650)).toBe(1);
    expect(yearPxPerDay(100, 3650)).toBe(YEAR_MIN_WIDTH / 365);
  });
});

describe("daysAt / scrollLeftFor", () => {
  test("기준점 아래 날짜가 배율을 바꿔도 같은 자리에 남는다", () => {
    // 패딩 24, 스크롤 1000, 화면 x 300, 2px/일 → (1300-24)/2 = 638일째
    const days = daysAt(1000, 300, 2, 24);
    expect(days).toBe(638);
    // 4px/일이면 그 날짜는 24 + 638*4 = 2576 → 스크롤 2576-300 = 2276
    expect(scrollLeftFor(days, 300, 4, 24)).toBe(2276);
  });

  test("음수로 가지 않는다", () => {
    expect(scrollLeftFor(10, 300, 1, 24)).toBe(0);
  });
});
