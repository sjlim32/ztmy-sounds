import type { LiveUnit } from "@/features/zutopia/live-history/types";

/**
 * 세트리스트를 아는 공연일 — 투어 공통 곡만 있고 그날 행이 없는 날(commonOnly)은
 * 그날 선택곡을 몰라서 모르는 날로 친다("안 불렀다"로 세지 않게). 통계 계산
 * (compute.ts)과 내 기록(my-stats.ts)이 같이 쓴다.
 */
export function hasSetlist(
  unit: Pick<LiveUnit, "songIds" | "commonOnly">,
): boolean {
  return unit.songIds.length > 0 && !unit.commonOnly;
}

/**
 * 이 곡을 불렀는지 아는 공연일 — 세트리스트를 아는 날이거나, 투어 공통 곡만 있는
 * 날이라도 그 곡이 공통 곡이면(그날 확실히 불렀다) 안다. 공통 곡이 아닌 곡은 그런
 * 날 불렀는지 모른다.
 */
export function knowsSong(
  unit: Pick<LiveUnit, "songIds" | "commonOnly">,
  songId: string,
): boolean {
  return (
    hasSetlist(unit) || (!!unit.commonOnly && unit.songIds.includes(songId))
  );
}

/** 비율의 95% 신뢰구간 하한(Wilson score) — 표본이 적을수록 낮게 나온다. */
export function wilsonLowerBound(part: number, whole: number): number {
  if (whole === 0) return 0;
  const z = 1.96;
  const p = part / whole;
  const z2 = z * z;
  return (
    (p +
      z2 / (2 * whole) -
      z * Math.sqrt((p * (1 - p)) / whole + z2 / (4 * whole * whole))) /
    (1 + z2 / whole)
  );
}
