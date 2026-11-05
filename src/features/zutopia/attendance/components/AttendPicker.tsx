"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import {
  groupUnitsByYear,
  type UnitGroup,
} from "@/features/zutopia/attendance/picker-groups";
import { formatDateWithWeekday } from "./date-format";

function Thumb({ src, size }: { src: string | null; size: "md" | "sm" }) {
  const box = size === "md" ? "size-12" : "size-9";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className={cn(box, "shrink-0 rounded bg-black/40 object-cover")}
    />
  ) : (
    <span
      aria-hidden
      className={cn(box, "block shrink-0 rounded bg-white/5")}
    />
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronDownIcon
      className={cn(
        "size-4 shrink-0 text-white/50 transition-transform",
        !open && "-rotate-90",
      )}
    />
  );
}

function toggleIn(set: ReadonlySet<string>, key: string) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/**
 * 공연 체크 — 실제로 간 공연일을 하나씩 체크한다. 해 → 투어·공연 묶음 → 공연일
 * 순으로 나누고, 해와 묶음은 각각 접을 수 있다. 처음엔 가장 최근 해와 체크가
 * 있는 해만 펼친다(창을 열 때 정함 — 체크를 풀어도 갑자기 접히지 않게).
 * 묶음 머리에 투어·공연 대표 그림, 공연일마다 그림이 따로 있으면 줄에도 작게.
 */
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
  const years = groupUnitsByYear(units);
  const [openYears, setOpenYears] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        years
          .filter(
            (year, index) =>
              index === 0 || year.unitIds.some((id) => attended.has(id)),
          )
          .map((year) => year.year),
      ),
  );
  const [closedGroups, setClosedGroups] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const countChecked = (ids: string[]) =>
    ids.filter((id) => attended.has(id)).length;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-white/50">
        다녀온 공연일을 체크하세요. 체크 내역은 이 브라우저에만 저장돼요.
      </p>
      {years.map((year) => {
        const open = openYears.has(year.year);
        const checked = countChecked(year.unitIds);
        return (
          <section key={year.year}>
            <h3 className="bg-background sticky top-0 z-10 -mx-4 px-4">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenYears((set) => toggleIn(set, year.year))}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md py-2.5 text-left",
                  FOCUS_RING,
                )}
              >
                <Chevron open={open} />
                <span className="font-mono text-lg font-semibold tracking-wider text-white">
                  {year.year}
                </span>
                <span className="text-sm text-white/50">
                  공연일 {year.unitIds.length}
                </span>
                {ready && checked > 0 && (
                  <span className="ml-auto text-sm font-medium text-white tabular-nums">
                    {checked}개 체크
                  </span>
                )}
              </button>
            </h3>
            {open && (
              <div className="flex flex-col gap-2 pb-2">
                {year.groups.map((group) => (
                  <GroupCard
                    key={group.key}
                    group={group}
                    open={!closedGroups.has(group.key)}
                    onToggleOpen={() =>
                      setClosedGroups((set) => toggleIn(set, group.key))
                    }
                    attended={attended}
                    ready={ready}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function GroupCard({
  group,
  open,
  onToggleOpen,
  attended,
  ready,
  onToggle,
}: {
  group: UnitGroup;
  open: boolean;
  onToggleOpen: () => void;
  attended: ReadonlySet<string>;
  ready: boolean;
  onToggle: (id: string) => void;
}) {
  const checkedCount = group.units.filter((unit) =>
    attended.has(unit.id),
  ).length;
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggleOpen}
        className={cn(
          "flex w-full items-center gap-3 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/8",
          open && "border-b border-white/10",
          FOCUS_RING,
        )}
      >
        <Thumb src={group.imageUrl} size="md" />
        <span className="min-w-0 flex-1 text-base leading-snug font-semibold text-white">
          {group.title}
        </span>
        {ready && (
          <span
            className={cn(
              "shrink-0 text-sm tabular-nums",
              checkedCount > 0 ? "text-white" : "text-white/45",
            )}
          >
            {checkedCount}/{group.units.length}
          </span>
        )}
        <Chevron open={open} />
      </button>
      {open && (
        <ul className="divide-y divide-white/5">
          {group.units.map((unit) => {
            const checked = attended.has(unit.id);
            const ownImage =
              unit.imageUrl && unit.imageUrl !== group.imageUrl
                ? unit.imageUrl
                : null;
            return (
              <li key={unit.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-white/5",
                    checked && "bg-white/8",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={ready && checked}
                    disabled={!ready}
                    onChange={() => onToggle(unit.id)}
                    className="accent-ztmy-magenta size-5 shrink-0"
                  />
                  {ownImage && <Thumb src={ownImage} size="sm" />}
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm text-white">
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
      )}
    </div>
  );
}
