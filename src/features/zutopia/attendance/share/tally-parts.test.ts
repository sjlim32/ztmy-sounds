import { expect, test } from "vitest";
import { tallyParts } from "@/features/zutopia/attendance/share/tally-parts";

test.each([
  [1, { bundles: 0, rest: 1, overflow: 0 }],
  [4, { bundles: 0, rest: 4, overflow: 0 }],
  [5, { bundles: 1, rest: 0, overflow: 0 }],
  [8, { bundles: 1, rest: 3, overflow: 0 }],
  [20, { bundles: 4, rest: 0, overflow: 0 }],
  [23, { bundles: 4, rest: 0, overflow: 3 }],
])("tallyParts(%i)", (count, want) => {
  expect(tallyParts(count)).toEqual(want);
});
