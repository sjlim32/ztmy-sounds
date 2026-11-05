"use client";

import { cn } from "@/lib/utils";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import { formatDateWithWeekday } from "./date-format";

interface UnitGroup {
  key: string;
  title: string;
  units: LiveUnit[];
}

/**
 * 투어는 투어 하나로, 투어 아닌 이틀 공연은 공연 하나로 묶는다. units는
 * 최신순으로 들어오므로 묶음도 최신순이고, 묶음 안은 날짜 순(첫 공연부터).
 */
function groupUnits(units: LiveUnit[]): UnitGroup[] {
  const groups = new Map<string, UnitGroup>();
  for (const unit of units) {
    const key = unit.tourId ?? unit.liveId;
    const group = groups.get(key);
    if (group) group.units.push(unit);
    else
      groups.set(key, {
        key,
        title: unit.titleKo ?? unit.title,
        units: [unit],
      });
  }
  return [...groups.values()].map((group) => ({
    ...group,
    units: [...group.units].reverse(),
  }));
}

/** ① 간 공연 고르기 — 실제로 간 공연일을 하나씩 체크한다. */
export function AttendPicker({
  units,
  attended,
  ready,
  onToggle,
}: {
  units: LiveUnit[];
  attended: ReadonlySet<string>;
  ready: boolean;
  onToggle: (id: string) => void;
}) {
  const groups = groupUnits(units);

  return (
    <div className="flex flex-col gap-3">
      <p className={cn("text-sm text-white/60", "tablet:text-base")}>
        실제로 다녀온 공연일을 체크하세요. 체크 내역은 이 브라우저에만 저장돼요.
      </p>
      {groups.map((group) => {
        const checkedCount = group.units.filter((unit) =>
          attended.has(unit.id),
        ).length;
        return (
          <section
            key={group.key}
            className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
          >
            <div className="tablet:px-4 flex items-baseline justify-between gap-3 border-b border-white/10 px-3 py-2.5">
              <h2
                className={cn(
                  "min-w-0 text-base font-semibold text-white",
                  "tablet:text-lg",
                )}
              >
                {group.title}
              </h2>
              {ready && group.units.length > 1 && (
                <span className="shrink-0 text-sm text-white/50">
                  {checkedCount}/{group.units.length}
                </span>
              )}
            </div>
            <ul className="divide-y divide-white/5">
              {group.units.map((unit) => {
                const checked = attended.has(unit.id);
                return (
                  <li key={unit.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/5",
                        "tablet:px-4",
                        checked && "bg-ztmy-magenta/10",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={ready && checked}
                        disabled={!ready}
                        onChange={() => onToggle(unit.id)}
                        className="accent-ztmy-magenta size-5 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block font-mono text-sm text-white",
                            "tablet:text-base",
                          )}
                        >
                          {formatDateWithWeekday(unit.date)}
                        </span>
                        <span className="block truncate text-sm text-white/60">
                          {[
                            unit.city,
                            unit.dayNumber ? `DAY ${unit.dayNumber}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {unit.songIds.length === 0 && (
                        <span className="shrink-0 text-sm text-white/40">
                          세트리스트 준비 중
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
