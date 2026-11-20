import { addDays } from "@/lib/ymd";

/**
 * 투어 세트리스트 판(tour_setlist_versions) — 투어 상세(lives/data.ts)와 라이브 기록·
 * 통계(live-history/units.ts)가 같은 규칙으로 공연일의 판을 고른다(순수 함수).
 *
 * - 판은 starts_on부터 다음 판 starts_on 전날까지의 공연일에 적용된다.
 * - 공연일의 판: lives.setlist_version_id로 직접 지정했으면 그 판, 아니면 공연 날짜
 *   (live_date가 있으면 그날, 없으면 start_date) 이전에 시작한 판 중 가장 늦은 판.
 *   첫 판보다 앞선 공연일이면 첫 판(투어 시작 전 공연을 공통 곡 없이 두지 않게).
 *   이틀 공연도 시작일 하나로 정한다(공연 행 하나 = 판 하나).
 * - 판이 없는 투어(공통 세트리스트를 안 넣은 투어)는 null.
 */
export interface TourVersion {
  id: string;
  /** "YYYY-MM-DD" */
  startsOn: string;
  label: string | null;
  /** 선택곡 없는 고정 세트리스트 — 공연일 행이 없어도 세트리스트를 안다 */
  fixed: boolean;
}

const byStart = (a: TourVersion, b: TourVersion) =>
  a.startsOn.localeCompare(b.startsOn);

export function versionForDate<T extends TourVersion>(
  versions: readonly T[],
  date: string,
  explicitId: string | null = null,
): T | null {
  if (versions.length === 0) return null;
  if (explicitId) {
    const explicit = versions.find((version) => version.id === explicitId);
    if (explicit) return explicit;
  }
  const day = date.slice(0, 10);
  const sorted = [...versions].sort(byStart);
  let picked = sorted[0];
  for (const version of sorted) if (version.startsOn <= day) picked = version;
  return picked;
}

/** 판이 끝나는 날(다음 판 시작 전날) — 마지막 판이면 null. */
export function versionEndsOn(
  versions: readonly TourVersion[],
  version: TourVersion,
): string | null {
  const next = [...versions]
    .sort(byStart)
    .find((item) => item.startsOn > version.startsOn);
  return next ? addDays(next.startsOn, -1) : null;
}
