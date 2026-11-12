import { describe, expect, test } from "vitest";
import { formatDayShow, showsForDay } from "./shows";

describe("showsForDay", () => {
  test("metadata가 없어도 세트리스트의 show_number로 나눈다(이름은 N회차)", () => {
    expect(showsForDay(null, 1, [1, 1, 2, null])).toEqual([
      { show: 1, label: "1회차", open: null, start: null },
      { show: 2, label: "2회차", open: null, start: null },
    ]);
  });

  test("1회뿐이면 나누지 않는다", () => {
    expect(showsForDay(null, 1, [1, null])).toEqual([]);
    expect(showsForDay({ shows: ["only"] }, 1)).toEqual([]);
  });

  test("이름 배열은 매일 같은 회차", () => {
    expect(
      showsForDay({ shows: ["昼の部", "夜の部"] }, 2).map((s) => s.label),
    ).toEqual(["昼の部", "夜の部"]);
  });

  test("회차마다 정보 — 날마다 다르고 시간도", () => {
    const metadata = {
      shows: [
        { day: 1, show: 1, label: "昼の部", open: "12:00", start: "13:00" },
        { day: 1, show: 2, label: "夜の部", start: "18:00" },
        { day: 2, label: "단독" },
      ],
    };
    expect(showsForDay(metadata, 1)).toEqual([
      { show: 1, label: "昼の部", open: "12:00", start: "13:00" },
      { show: 2, label: "夜の部", open: null, start: "18:00" },
    ]);
    // DAY 2는 1회뿐 → 나누지 않음
    expect(showsForDay(metadata, 2)).toEqual([]);
  });

  test("show_start·show_open 키로 시각을 읽는다", () => {
    const metadata = {
      shows: [
        { day: 1, show: 1, show_start: "13:00" },
        { day: 1, show: 2, show_start: "18:00" },
        { day: 2, show: 1, show_open: "11:30", show_start: "12:30" },
        { day: 2, show: 2, show_start: "17:30" },
      ],
    };
    expect(showsForDay(metadata, 1).map((s) => [s.label, s.start])).toEqual([
      ["1회차", "13:00"],
      ["2회차", "18:00"],
    ]);
    expect(showsForDay(metadata, 2)[0]).toEqual({
      show: 1,
      label: "1회차",
      open: "11:30",
      start: "12:30",
    });
  });

  test("잘못된 시간은 버린다", () => {
    const [first] = showsForDay(
      { shows: [{ start: "1pm" }, { start: "18:00" }] },
      1,
    );
    expect(first.start).toBeNull();
  });
});

describe("formatDayShow", () => {
  test("표기", () => {
    expect(formatDayShow(1, "昼の部")).toBe("DAY 1 昼の部");
    expect(formatDayShow(null, "夜の部")).toBe("夜の部");
    expect(formatDayShow(null, null)).toBeNull();
  });
});
