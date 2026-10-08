"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  SCHEDULE,
  SCHEDULE_DAYS_LABEL,
  SCHEDULE_KIND_LABEL,
  type ScheduleItem,
} from "@/features/info/schedule";
import type { ScheduleStatus } from "@/features/info/lib/schedule-status";
import { useScheduleStatus } from "@/features/info/lib/use-schedule-status";
import { ScheduleTimeline } from "@/features/info/components/ScheduleTimeline";
import { ConcertLinks } from "@/features/info/components/ConcertLinks";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { CloseIcon } from "@/components/icons/CloseIcon";

// 집합 일정은 라벨이 구역 이름뿐이라("일반 Area …") 요약에선 종류를 앞에 붙인다.
function summaryLabel(item: ScheduleItem): string {
  return item.kind === "gather"
    ? `${SCHEDULE_KIND_LABEL.gather} ${item.label}`
    : item.label;
}

function getSummary(status: ScheduleStatus): { main: string; sub?: string } {
  if (status.phase !== "today") {
    return {
      main: `${SCHEDULE_DAYS_LABEL} 일정과 링크`,
      sub:
        status.phase === "before"
          ? `공연까지 D-${status.daysUntil}`
          : undefined,
    };
  }

  // 같은 시각에 겹친 일정(축제 종료·개연)은 뒤에 적힌 쪽을 대표로 보여준다.
  const nowItem = SCHEDULE[status.states.lastIndexOf("now")];
  const nextItem =
    status.nextIndex === null ? undefined : SCHEDULE[status.nextIndex];
  const next = nextItem && `다음 ${nextItem.start} ${summaryLabel(nextItem)}`;

  if (!nowItem) return { main: next ?? "오늘 일정이 끝났습니다" };
  return { main: `지금 ${summaryLabel(nowItem)}`, sub: next };
}

/**
 * 홈의 공연 당일 안내 — 평소엔 한 줄 요약(지금/다음 일정)만 보이고, 누르면
 * 일정표와 링크 모음이 펼쳐진다. 모바일은 화면 아래에서 올라오는 시트,
 * 태블릿 이상은 요약 바로 위에 뜨는 패널이다. 공연이 끝나면 사라진다.
 */
export function ConcertQuickPanel() {
  const status = useScheduleStatus();
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

  // 지금 시각을 알기 전(빌드된 HTML)과 공연이 끝난 뒤엔 아무것도 그리지 않는다.
  if (!status || status.phase === "ended") return null;

  const summary = getSummary(status);

  return (
    <div
      className={cn(
        "px-4 pb-3",
        // 태블릿 이상: 화면 가운데 아래(푸터 위). 정가운데는 배경 캐릭터 얼굴 자리라 비운다.
        "tablet:fixed tablet:bottom-14 tablet:left-1/2 tablet:z-20 tablet:w-[26rem] tablet:max-w-[calc(100vw-2rem)] tablet:-translate-x-1/2 tablet:px-0 tablet:pb-0",
      )}
    >
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
            aria-label="공연 당일 안내"
            className={cn(
              "bg-background/95 fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-white/15 pb-4",
              "tablet:absolute tablet:bottom-full tablet:mb-2 tablet:max-h-[70dvh] tablet:rounded-xl tablet:border tablet:pb-0",
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <h2 className="font-bold">
                공연 당일 안내
                <span className="ml-2 text-sm font-normal text-white/60">
                  {SCHEDULE_DAYS_LABEL}
                </span>
              </h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-white/60 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
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
        onClick={() => setOpen((open) => !open)}
        className={cn(
          "bg-background/85 flex w-full items-center gap-3 rounded-lg border border-white/15 px-3 py-2 text-left transition-colors hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
          "tablet:mx-auto tablet:w-fit tablet:max-w-full tablet:rounded-full tablet:px-4",
        )}
      >
        <span className="bg-ztmy-magenta shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
          {status.phase === "today" ? "오늘 공연" : "공연 안내"}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold text-white">
            {summary.main}
          </span>
          {summary.sub && (
            <span className="truncate text-xs text-white/60">
              {summary.sub}
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-3 w-3 shrink-0 text-white/60 transition-transform",
            !isOpen && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
