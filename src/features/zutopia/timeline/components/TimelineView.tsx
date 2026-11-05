"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACTIVE_FILTER_CHIP_CLASS,
  FILTER_CHIP_CLASS,
} from "@/components/button-styles";
import { useAttendedUnits } from "@/features/zutopia/attendance/useAttendedUnits";
import {
  timelineRange,
  type TimelineEvent,
  type TimelineKind,
} from "@/features/zutopia/timeline/events";
import { HorizontalTimeline } from "./HorizontalTimeline";
import { VerticalTimeline } from "./VerticalTimeline";
import {
  ATTENDED_CLASS,
  KIND_DOT_CLASS,
  KIND_LABEL,
  KIND_ORDER,
} from "./kind-style";

/**
 * 활동 연혁 — 곡·앨범 발매와 공연을 실제 시간 간격대로 한 줄 축에 놓는다.
 * 태블릿 이상은 가로 축, 모바일은 세로 축. 정적 HTML과 첫 렌더가 같도록 둘 다
 * 그리고 CSS로 하나만 보인다. 범례를 눌러 종류별로 켜고 끈다. 참전 기록에서
 * 체크한 공연은 마젠타 테두리(브라우저 저장값이라 읽은 뒤에만).
 * 축 범위는 전체 일정 기준이라 종류를 꺼도 위치가 바뀌지 않는다.
 */
export function TimelineView({ events }: { events: TimelineEvent[] }) {
  const [hidden, setHidden] = useState<ReadonlySet<TimelineKind>>(
    () => new Set(),
  );
  const { ready, attended } = useAttendedUnits();
  const range = useMemo(() => timelineRange(events), [events]);
  const visible = useMemo(
    () => events.filter((event) => !hidden.has(event.kind)),
    [events, hidden],
  );
  // 공연 일정 id → 그중 체크한 공연일 수
  const attendedCounts = useMemo(() => {
    const result = new Map<string, number>();
    if (!ready) return result;
    for (const event of events) {
      const count = event.unitIds.filter((id) => attended.has(id)).length;
      if (count > 0) result.set(event.id, count);
    }
    return result;
  }, [events, attended, ready]);

  const counts = useMemo(() => {
    const result: Record<TimelineKind, number> = { song: 0, album: 0, live: 0 };
    for (const event of events) result[event.kind] += 1;
    return result;
  }, [events]);

  const toggle = (kind: TimelineKind) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  if (!range) {
    return <p className="text-base text-white/60">표시할 일정이 없어요.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {KIND_ORDER.map((kind) => {
          const on = !hidden.has(kind);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(kind)}
              className={cn(
                FILTER_CHIP_CLASS,
                "gap-2",
                on ? ACTIVE_FILTER_CHIP_CLASS : "text-white/55",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-3 shrink-0",
                  KIND_DOT_CLASS[kind],
                  !on && "opacity-30",
                )}
              />
              {KIND_LABEL[kind]}
              <span className="text-white/50 tabular-nums">{counts[kind]}</span>
            </button>
          );
        })}
        {attendedCounts.size > 0 && (
          <span className="ml-auto inline-flex items-center gap-2 text-sm text-white/70">
            <span
              aria-hidden
              className={cn("size-3", KIND_DOT_CLASS.live, ATTENDED_CLASS)}
            />
            내가 간 공연 {attendedCounts.size}
          </span>
        )}
      </div>

      <div className="tablet:block hidden">
        <HorizontalTimeline
          events={visible}
          range={range}
          attendedCounts={attendedCounts}
        />
      </div>
      <div className="tablet:hidden">
        <VerticalTimeline events={visible} attendedCounts={attendedCounts} />
      </div>
    </div>
  );
}
