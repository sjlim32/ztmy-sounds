import { describe, expect, test } from "vitest";
import { groupTourDates } from "./date-groups";

const d = (id: string, startDate: string, city = "가나가와", venue = "K") => ({
  id,
  startDate,
  city,
  venue,
});

const ids = (groups: { id: string }[][]) =>
  groups.map((group) => group.map((date) => date.id));

describe("groupTourDates", () => {
  test("같은 공연을 날마다 나눈 공연일은 한 묶음", () => {
    expect(
      ids(
        groupTourDates([
          d("A:1", "2025-03-29"),
          d("A:2", "2025-03-30"),
          d("B", "2025-04-05", "치바", "M"),
        ]),
      ),
    ).toEqual([["A:1", "A:2"], ["B"]]);
  });

  test("따로 등록돼도 같은 도시·공연장에서 하루 차이면 한 묶음", () => {
    expect(
      ids(
        groupTourDates([
          d("A", "2025-03-29"),
          d("B", "2025-03-30"),
          d("C", "2025-04-02"),
        ]),
      ),
    ).toEqual([["A", "B"], ["C"]]);
  });

  test("같은 도시라도 공연장이 다르거나 사이가 떨어지면 따로", () => {
    expect(
      ids(
        groupTourDates([
          d("A", "2025-03-29", "도쿄", "X"),
          d("B", "2025-03-30", "도쿄", "Y"),
        ]),
      ),
    ).toEqual([["A"], ["B"]]);
  });
});
