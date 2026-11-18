import { describe, expect, test } from "vitest";
import { computeLastModified } from "@/features/zutopia/lives/last-modified";
import { isTourDateRow } from "@/features/zutopia/lives/tour-dates";

const tour = {
  id: "t1",
  slug: "intense",
  updated_at: "2026-09-01T00:00:00+00:00",
};

describe("computeLastModified", () => {
  test("투어 = 투어 행과 공연일 행(tour_id 또는 같은 slug) 중 가장 늦은 값", () => {
    const result = computeLastModified(
      [
        { slug: null, tour_id: "t1", updated_at: "2026-09-05T00:00:00+00:00" },
        // tour_id 없이 투어 slug를 쓴 공연일 — 더 늦은 값이 투어 값이 된다.
        {
          slug: "intense",
          tour_id: null,
          updated_at: "2026-09-10T00:00:00.5+00:00",
        },
        {
          slug: "solo",
          tour_id: null,
          updated_at: "2026-08-01T00:00:00+00:00",
        },
      ],
      [tour],
    );
    expect(result.get("intense")).toBe("2026-09-10T00:00:00.5+00:00");
    expect(result.get("solo")).toBe("2026-08-01T00:00:00+00:00");
  });

  test("공연일이 없으면 투어 행 값, 같은 slug 단독 행이 여럿이면 가장 늦은 값", () => {
    const result = computeLastModified(
      [
        // UTC 08-01 23:00 — 글자로는 더 커 보이지만 실제로는 아래보다 이르다.
        { slug: "fes", tour_id: null, updated_at: "2026-08-02T08:00:00+09:00" },
        { slug: "fes", tour_id: null, updated_at: "2026-08-01T23:30:00+00:00" },
      ],
      [tour],
    );
    expect(result.get("intense")).toBe(tour.updated_at);
    // 시간대 표기가 달라도 실제 시각으로 비교한다.
    expect(result.get("fes")).toBe("2026-08-01T23:30:00+00:00");
  });

  test("isTourDateRow는 tour_id 또는 slug로 판정", () => {
    expect(isTourDateRow({ tour_id: "t1", slug: null }, tour)).toBe(true);
    expect(isTourDateRow({ tour_id: null, slug: "intense" }, tour)).toBe(true);
    expect(isTourDateRow({ tour_id: "t2", slug: "other" }, tour)).toBe(false);
  });
});
