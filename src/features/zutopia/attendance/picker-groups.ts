import type { LiveUnit } from "@/features/zutopia/live-history/types";

export interface UnitGroup {
  key: string;
  title: string;
  imageUrl: string | null;
  /** 날짜순(첫 공연부터). */
  units: LiveUnit[];
}

export interface YearGroup {
  year: string;
  groups: UnitGroup[];
  /** 이 해에 든 공연일 ID 전부(체크 수 세기용). */
  unitIds: string[];
}

/**
 * 공연 체크 목록 묶기 — 투어는 투어 하나로, 투어 아닌 여러 날 공연은 공연
 * 하나로 묶고, 묶음을 첫 공연일의 해로 다시 묶는다(해를 넘기는 투어가 두 해로
 * 쪼개지지 않게). units는 최신순으로 들어오므로 해·묶음도 최신순이다.
 */
export function groupUnitsByYear(units: LiveUnit[]): YearGroup[] {
  const groups = new Map<string, UnitGroup>();
  for (const unit of units) {
    const key = unit.tourId ?? unit.liveId;
    const group = groups.get(key);
    if (group) group.units.push(unit);
    else
      groups.set(key, {
        key,
        title: unit.titleKo ?? unit.title,
        imageUrl: unit.groupImageUrl,
        units: [unit],
      });
  }

  const years = new Map<string, YearGroup>();
  for (const group of groups.values()) {
    group.units.reverse();
    const year = group.units[0].date.slice(0, 4);
    const entry = years.get(year) ?? { year, groups: [], unitIds: [] };
    entry.groups.push(group);
    entry.unitIds.push(...group.units.map((unit) => unit.id));
    years.set(year, entry);
  }
  return [...years.values()].sort((a, b) => b.year.localeCompare(a.year));
}
