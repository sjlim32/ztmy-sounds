import { describe, expect, test } from "vitest";
import { stackedCovers, UNKNOWN_COVER_SRC } from "./artwork";

describe("stackedCovers", () => {
  test("같은 그림은 한 장, 커버 없는 곡은 물음표 그림, 최대 3장", () => {
    expect(stackedCovers(["a", "a", null, "b", "c"])).toEqual([
      "a",
      UNKNOWN_COVER_SRC,
      "b",
    ]);
    expect(stackedCovers([null, null])).toEqual([UNKNOWN_COVER_SRC]);
  });
});
