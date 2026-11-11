"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FilterChip, FilterRow } from "@/components/FilterChips";
import { FilterPanel } from "@/features/zutopia/components/SortFilterBar";
import { useAttendedUnits } from "@/features/zutopia/attendance/useAttendedUnits";
import {
  liveSummary,
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
 * 그리고 CSS로 하나만 보인다. 위 필터 카드(FilterPanel, 곡·공연 목록과 같은 모양)의
 * 종류 칩을 눌러 종류별로 켜고 끈다. 참전 기록에서
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

  const lives = useMemo(() => liveSummary(events), [events]);
  // 곡·앨범은 일정 수, 공연은 총 공연 횟수(지난 공연일: 투어 공연일 + 그 밖 공연일)
  const counts = useMemo(() => {
    const result: Record<TimelineKind, number> = {
      song: 0,
      album: 0,
      live: lives.total,
    };
    for (const event of events)
      if (event.kind !== "live") result[event.kind] += 1;
    return result;
  }, [events, lives.total]);
  const attendedShows = [...attendedCounts.values()].reduce((a, b) => a + b, 0);

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
      {/* 곡·앨범·공연 목록과 같은 필터 카드 — 종류는 여러 개를 켜고 끄는 칩 */}
      <FilterPanel
        summary={
          attendedCounts.size > 0 && (
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className={cn("size-3", KIND_DOT_CLASS.live, ATTENDED_CLASS)}
              />
              내가 간 공연 {attendedShows}회
            </span>
          )
        }
      >
        <FilterRow role="group" aria-label="종류 필터" label="종류">
          {KIND_ORDER.map((kind) => (
            <FilterChip
              key={kind}
              active={!hidden.has(kind)}
              onClick={() => toggle(kind)}
              count={counts[kind]}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2.5 shrink-0",
                  KIND_DOT_CLASS[kind],
                  hidden.has(kind) && "opacity-30",
                )}
              />
              {KIND_LABEL[kind]}
            </FilterChip>
          ))}
        </FilterRow>
        {/* 총 공연 횟수의 묶음별 내역 — 단콘 = 투어 + 단독 콘서트 */}
        <p className="text-sm text-white/60">
          총 공연 {lives.total}회 · 단콘 {lives.concert} · 페스티벌{" "}
          {lives.festival} · 이벤트 {lives.event}
          {lives.upcoming > 0 && ` · 예정 ${lives.upcoming}회`}
        </p>
      </FilterPanel>

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
