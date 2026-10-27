"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  SCHEDULE,
  SCHEDULE_DAYS,
  SCHEDULE_DAYS_LABEL,
  SCHEDULE_KIND_LABEL,
  type ScheduleItem,
} from "@/features/info/schedule";
import type { ScheduleStatus } from "@/features/info/lib/schedule-status";
import { ScheduleTimeline } from "@/features/info/components/ScheduleTimeline";
import { ConcertLinks } from "@/features/info/components/ConcertLinks";
import {
  FOCUS_RING,
  GHOST_ICON_BUTTON_CLASS,
} from "@/components/button-styles";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { CloseIcon } from "@/components/icons/CloseIcon";

// 이 빌드가 공연 마지막 날이 끝나기 전에 만들어졌는지. 그렇다면 대부분의
// 방문에서 버튼이 뜰 테니, 지금 시각을 알기 전에도 같은 높이의 빈 자리를
// 잡아둬서 버튼이 뒤늦게 끼어들며 화면을 밀어내지 않게 한다. 공연이 끝난
// 뒤의 빌드는 자리를 안 잡는다(어차피 아무것도 안 뜬다).
const SCHEDULE_END_MS =
  Date.parse(`${SCHEDULE_DAYS[SCHEDULE_DAYS.length - 1]}T00:00:00+09:00`) +
  86_400_000;
const BUILT_BEFORE_SCHEDULE_END =
  Number(process.env.NEXT_PUBLIC_BUILD_TIME) < SCHEDULE_END_MS;

// 버튼 높이 — 지금 시각을 알기 전의 빈 자리도 같은 높이로 잡는다.
const TRIGGER_HEIGHT = "min-h-11";

// 집합 일정은 라벨이 구역 이름뿐이라("일반 Area …") 요약에선 종류를 앞에 붙인다.
function summaryLabel(item: ScheduleItem): string {
  return item.kind === "gather"
    ? `${SCHEDULE_KIND_LABEL.gather} ${item.label}`
    : item.label;
}

function getTodaySummary(status: Extract<ScheduleStatus, { phase: "today" }>): {
  main: string;
  sub?: string;
} {
  // 같은 시각에 겹친 일정(축제 종료·개연)은 뒤에 적힌 쪽을 대표로 보여준다.
  const nowItem = SCHEDULE[status.states.lastIndexOf("now")];
  const nextItem =
    status.nextIndex === null ? undefined : SCHEDULE[status.nextIndex];
  const next = nextItem && `다음 ${nextItem.start} ${summaryLabel(nextItem)}`;

  if (!nowItem) return { main: next ?? "오늘 일정이 끝났습니다" };
  return { main: `지금 ${summaryLabel(nowItem)}`, sub: next };
}

/**
 * 홈의 공연 안내 — 원정 공연 카드 바로 아래에 붙는 버튼. 평소엔 "투어 일정 ·
 * 공연 링크"(D-day는 위 카운트다운이 이미 보여줘서 여기선 뺀다), 공연 당일엔
 * 지금/다음 일정을 강조해서 보여준다. 누르면 일정표와 링크 모음이 열린다 —
 * 모바일은 화면 아래에서 올라오는 시트, 태블릿 이상은 왼쪽 열 옆(오른쪽)에
 * 뜨는 패널. 공연이 끝나면 사라진다.
 *
 * status는 부모(HomeScreen)가 한 번만 구독해서 내려준다 — 모바일/태블릿
 * 이상 두 자리에 동시에 마운트되기 때문.
 */
export function ConcertQuickPanel({
  status,
  className,
}: {
  status: ScheduleStatus | null;
  className?: string;
}) {
  const [isOpen, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!status) {
    return BUILT_BEFORE_SCHEDULE_END ? (
      <div aria-hidden className={cn(TRIGGER_HEIGHT, className)} />
    ) : null;
  }
  // 공연이 끝난 뒤엔 아무것도 그리지 않는다.
  if (status.phase === "ended") return null;

  const today = status.phase === "today" ? getTodaySummary(status) : null;
  const isToday = today !== null;

  return (
    <div className={cn("relative", className)}>
      {isOpen && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className={cn("fixed inset-0 z-40 bg-black/60", "tablet:hidden")}
          />
          <div
            id={panelId}
            role="dialog"
            aria-label="공연 안내"
            className={cn(
              "bg-background/95 fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-white/15 pb-4 backdrop-blur-md",
              // 태블릿 이상: 왼쪽 열을 가리지 않게 버튼 오른쪽으로, 버튼 아래끝에 맞춰 위로 자란다.
              "tablet:absolute tablet:inset-x-auto tablet:bottom-0 tablet:left-full tablet:ml-3 tablet:w-104 tablet:max-h-[70dvh] tablet:rounded-lg tablet:border tablet:pb-0",
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <h2 className="font-bold">
                공연 안내
                <span className="ml-2 text-sm font-normal text-white/60">
                  {SCHEDULE_DAYS_LABEL}
                </span>
              </h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setOpen(false)}
                className={cn(GHOST_ICON_BUTTON_CLASS, "h-8 w-8")}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-3 py-3">
              <ScheduleTimeline status={status} narrow />
              <div className="border-t border-white/10 px-1 pt-3">
                <ConcertLinks />
              </div>
            </div>
          </div>
        </>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((open) => !open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border px-3 py-1.5 text-left backdrop-blur-sm transition-colors",
          TRIGGER_HEIGHT,
          FOCUS_RING,
          isToday
            ? "border-ztmy-magenta/60 bg-ztmy-magenta/20 hover:bg-ztmy-magenta/30"
            : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-black/55",
        )}
      >
        {isToday ? (
          <span className="bg-ztmy-magenta shrink-0 rounded-md px-2 py-1 text-xs font-bold text-white">
            오늘 공연
          </span>
        ) : (
          <CalendarIcon className="h-4 w-4 shrink-0 text-white/70" />
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-white">
            {today ? today.main : "공연 정보 간단 요약"}
          </span>
          {today?.sub && (
            <span className="truncate text-xs text-white/70">{today.sub}</span>
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-3 w-3 shrink-0 text-white/60 transition-transform",
            // 모바일 시트는 위로, 태블릿 이상 패널은 오른쪽으로 열린다.
            isOpen ? "" : "rotate-180",
            isOpen ? "tablet:rotate-90" : "tablet:-rotate-90",
          )}
        />
      </button>
    </div>
  );
}
