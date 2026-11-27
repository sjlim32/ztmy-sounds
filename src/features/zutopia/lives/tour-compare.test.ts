import { describe, expect, test } from "vitest";
import { comparableDates, defaultComparePair } from "./tour-compare";

const song = { songId: "s" } as never;
const d = (id: string, opts: { canceled?: boolean; empty?: boolean } = {}) => ({
  id,
  canceled: opts.canceled,
  setlist: opts.empty ? [] : [song],
});

const a = d("a");
const b = d("b");
const c = d("c");
const x = d("x", { canceled: true });
const y = d("y", { empty: true });
const all = [a, x, b, y, c];

describe("comparableDates", () => {
  test("취소된 날·세트리스트 없는 날은 빼고 순서 그대로", () => {
    expect(comparableDates(all).map((date) => date.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("defaultComparePair", () => {
  test("고른 날과 바로 앞 공연일, 첫 공연일이면 다음 공연일", () => {
    expect(defaultComparePair(all, "b")).toEqual(["b", "a"]);
    expect(defaultComparePair(all, "a")).toEqual(["a", "b"]);
  });

  test("고른 날이 없거나 비교할 수 없는 날이면 첫·마지막 공연일", () => {
    expect(defaultComparePair(all, null)).toEqual(["a", "c"]);
    expect(defaultComparePair(all, "x")).toEqual(["a", "c"]);
  });

  test("비교할 공연일이 둘 미만이면 null", () => {
    expect(defaultComparePair([a, x], null)).toBeNull();
    expect(defaultComparePair([], "a")).toBeNull();
  });
});
