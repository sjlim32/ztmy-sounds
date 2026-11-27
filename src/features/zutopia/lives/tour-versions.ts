import { addDays } from "@/lib/ymd";
import { countTourShows } from "@/features/zutopia/lives/tour-shows";

/**
 * 투어 세트리스트 판(tour_setlist_versions) — 투어 상세(lives/data.ts)와 라이브 기록·
 * 통계(live-history/units.ts)가 같은 규칙으로 공연일의 판을 고른다(순수 함수).
 *
 * - 판은 starts_on부터 다음 판 starts_on 전날까지의 공연일에 적용된다.
 * - 공연일의 판: lives.setlist_version_id로 직접 지정했으면 그 판, 아니면 공연 날짜
 *   (live_date가 있으면 그날, 없으면 start_date) 이전에 시작한 판 중 가장 늦은 판.
 *   첫 판보다 앞선 공연일이면 첫 판(투어 시작 전 공연을 공통 곡 없이 두지 않게).
 *   이틀 이상 공연(live_date 없음)은 날마다 그날 날짜로 고른다 — 같은 도시 양일의
 *   세트리스트를 판으로 나눌 수 있게(genso-dodan 2023-04-20·21, versionsForDays).
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

/**
 * 여러 날 공연의 날마다 판(i번째 = i+1일차) — 날마다 versionForDate. 직접 지정한 판
 * (explicitId)은 모든 날에 쓴다. dayCount가 1 미만이면 하루로 본다.
 */
export function versionsForDays<T extends TourVersion>(
  versions: readonly T[],
  startDate: string,
  dayCount: number,
  explicitId: string | null = null,
): (T | null)[] {
  const start = startDate.slice(0, 10);
  return Array.from({ length: Math.max(1, dayCount) }, (_, i) =>
    versionForDate(versions, addDays(start, i), explicitId),
  );
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

/**
 * 공통 셋리 티켓(TourSpanTicket)의 값 — 그 판(또는 투어 전체)을 따른 공연일의 기간(첫 공연일 ~
 * 마지막 공연의 끝날), 거친 도시(날짜 순서대로 한 번씩), 공연 횟수(이틀 공연은 2회 —
 * countTourShows). 취소된 공연일은 빼고, 남는 공연일이 없으면 null.
 */
export function versionSpan(
  dates: readonly {
    city: string;
    startDate: string;
    endDate: string | null;
    canceled?: boolean;
  }[],
): { start: string; end: string; cities: string[]; shows: number } | null {
  const held = dates
    .filter((date) => !date.canceled)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (held.length === 0) return null;
  const last = held.at(-1)!;
  return {
    start: held[0].startDate,
    end: last.endDate ?? last.startDate,
    cities: [...new Set(held.map((date) => date.city))],
    shows: countTourShows(held),
  };
}
