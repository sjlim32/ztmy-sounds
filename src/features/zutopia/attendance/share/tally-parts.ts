/** 탤리(세로줄 4개 + 사선 1개 = 5회 한 묶음)를 이 묶음 수까지만 그린다. */
export const TALLY_MAX_BUNDLES = 4;

/**
 * 횟수 → 5회 묶음 수, 남은 세로줄 수, 묶음으로 못 그린 나머지(+N).
 * 20회(묶음 4개)를 넘으면 그 뒤는 "+N"으로 줄인다.
 */
export function tallyParts(count: number): {
  bundles: number;
  rest: number;
  overflow: number;
} {
  const max = TALLY_MAX_BUNDLES * 5;
  const drawn = Math.min(count, max);
  return {
    bundles: Math.floor(drawn / 5),
    rest: drawn % 5,
    overflow: Math.max(0, count - max),
  };
}
