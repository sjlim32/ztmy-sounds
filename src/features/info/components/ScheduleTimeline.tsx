import { cn } from "@/lib/utils";
import {
  SCHEDULE_KIND_LABEL,
  type ScheduleKind,
} from "@/features/info/schedule";
import type { ScheduleStatus } from "@/features/info/lib/schedule-status";

const KIND_CHIP: Record<ScheduleKind, string> = {
  matsuri: "bg-ztmy-sun/15 text-ztmy-sun",
  gather: "bg-ztmy-pink/20 text-ztmy-pink",
  concert: "bg-ztmy-sky/15 text-ztmy-sky",
};

/**
 * 다음(또는 오늘) 공연의 당일 시간표 — 개장·개연 등을 시간순으로. 공연
 * 당일(status.phase가 "today")에는 지금 진행 중인 줄을 강조하고 지난 줄은
 * 흐리게 한다.
 */
export function ScheduleTimeline({
  status,
}: {
  status: Extract<ScheduleStatus, { phase: "before" | "today" }>;
}) {
  const today = status.phase === "today" ? status : null;

  return (
    <ol className="flex flex-col">
      {status.items.map((item, index) => {
        const state = today?.states[index];
        const isNext = today?.nextIndex === index;

        return (
          <li
            key={`${item.start}-${item.label}`}
            aria-current={state === "now" ? "time" : undefined}
            className={cn(
              "flex items-baseline gap-2 rounded-md px-2 py-1.5",
              state === "now" && "ring-ztmy-magenta/60 bg-white/10 ring-1",
              state === "past" && "opacity-45",
            )}
          >
            <span className="w-26 shrink-0 font-mono text-sm text-white/80 tabular-nums">
              {item.start}
              {item.end && ` ~ ${item.end}`}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                KIND_CHIP[item.kind],
              )}
            >
              {SCHEDULE_KIND_LABEL[item.kind]}
            </span>
            <span className="min-w-0 flex-1 text-sm break-keep">
              {item.label}
            </span>
            {state === "now" && (
              <span className="bg-ztmy-magenta shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
                지금
              </span>
            )}
            {isNext && (
              <span className="shrink-0 rounded-full border border-white/40 px-2 py-0.5 text-[11px] font-bold text-white/80">
                다음
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
