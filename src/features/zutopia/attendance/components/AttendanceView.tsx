"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import { useAttendedUnits } from "@/features/zutopia/attendance/useAttendedUnits";
import {
  summarizeAttendance,
  type AttendanceSong,
} from "@/features/zutopia/attendance/summarize";
import { AttendPicker } from "./AttendPicker";
import { AttendanceResult } from "./AttendanceResult";

type Tab = "pick" | "result";

const TABS: { value: Tab; label: string }[] = [
  { value: "pick", label: "간 공연 고르기" },
  { value: "result", label: "내 참전 기록" },
];

/**
 * 라이브 참전 기록 — 탭 두 개(간 공연 고르기 / 내 참전 기록). 체크
 * 내역은 브라우저에만 저장된다(useAttendedUnits).
 */
export function AttendanceView({
  units,
  songs,
}: {
  units: LiveUnit[];
  songs: AttendanceSong[];
}) {
  const [tab, setTab] = useState<Tab>("pick");
  const { ready, attended, toggle, replaceAll } = useAttendedUnits();
  const summary = useMemo(
    () => summarizeAttendance(units, attended, songs),
    [units, attended, songs],
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="참전 기록"
        className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
      >
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`attendance-tab-${item.value}`}
            aria-selected={tab === item.value}
            aria-controls={`attendance-panel-${item.value}`}
            onClick={() => setTab(item.value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              "tablet:text-base",
              "focus-visible:outline-ztmy-magenta focus-visible:outline-2",
              tab === item.value
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white",
            )}
          >
            {item.label}
            {item.value === "pick" && ready && (
              <span className="ml-1.5 font-normal text-white/60">
                {summary.attendedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`attendance-panel-${tab}`}
        aria-labelledby={`attendance-tab-${tab}`}
      >
        {tab === "pick" ? (
          <AttendPicker
            units={units}
            attended={attended}
            ready={ready}
            onToggle={toggle}
          />
        ) : (
          <AttendanceResult
            summary={summary}
            attended={attended}
            ready={ready}
            onRestore={replaceAll}
            onGoPick={() => setTab("pick")}
          />
        )}
      </div>
    </div>
  );
}
