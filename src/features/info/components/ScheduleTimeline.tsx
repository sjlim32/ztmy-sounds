"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  GATHER_MAP_IMAGES,
  SCHEDULE,
  SCHEDULE_DAYS_LABEL,
  SCHEDULE_KIND_LABEL,
  SCHEDULE_NOTES,
  type ScheduleKind,
} from "@/features/info/schedule";
import type { ScheduleStatus } from "@/features/info/lib/schedule-status";
import { useScheduleStatus } from "@/features/info/lib/use-schedule-status";
import { ImageGallery } from "@/features/info/components/ImageGallery";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";

const KIND_CHIP: Record<ScheduleKind, string> = {
  matsuri: "bg-ztmy-sun/15 text-ztmy-sun",
  gather: "bg-ztmy-pink/20 text-ztmy-pink",
  concert: "bg-ztmy-sky/15 text-ztmy-sky",
};

/** MDX(/info)처럼 상태를 직접 넘길 수 없는 곳에서 쓰는 카드형 일정표. */
export function LiveScheduleTimeline() {
  const status = useScheduleStatus();

  return (
    <div className="tablet:p-3 flex flex-col gap-2 rounded-lg bg-black/30 px-3 py-2.5">
      <h3 className="font-bold">
        공연 당일 일정표
        <span className="ml-2 text-sm font-normal text-white/60">
          {SCHEDULE_DAYS_LABEL}
        </span>
      </h3>
      <ScheduleTimeline status={status} />
    </div>
  );
}

/**
 * 축제·집합·공연 일정을 시간순으로 합친 일정표. 공연 당일(status.phase가
 * "today")에는 지금 진행 중인 줄을 강조하고 지난 줄은 흐리게 한다.
 * narrow는 홈 패널처럼 폭이 좁은 곳 — 지도를 한 열로 쌓는다.
 */
export function ScheduleTimeline({
  status,
  narrow = false,
}: {
  status: ScheduleStatus | null;
  narrow?: boolean;
}) {
  const mapId = useId();
  const [isMapOpen, setMapOpen] = useState(false);
  const today = status?.phase === "today" ? status : null;

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col">
        {SCHEDULE.map((item, index) => {
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
              <span className="w-[6.5rem] shrink-0 font-mono text-sm text-white/80 tabular-nums">
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

      <button
        type="button"
        aria-expanded={isMapOpen}
        aria-controls={mapId}
        onClick={() => setMapOpen((open) => !open)}
        className="text-ztmy-pink flex items-center justify-center gap-1 rounded-md border border-white/15 px-3 py-1.5 text-sm font-bold transition-colors hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        집합 장소 지도 {isMapOpen ? "접기" : "보기"}
        <ChevronDownIcon
          className={cn(
            "h-3 w-3 transition-transform",
            isMapOpen && "rotate-180",
          )}
        />
      </button>
      {isMapOpen && (
        <div id={mapId}>
          <ImageGallery
            images={GATHER_MAP_IMAGES}
            className={narrow ? "tablet:grid-cols-1" : "tablet:grid-cols-2"}
          />
        </div>
      )}

      <ul className="flex flex-col gap-0.5 text-xs text-white/60">
        {SCHEDULE_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
