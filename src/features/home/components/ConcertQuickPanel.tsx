"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SCHEDULE_DAYS,
  SCHEDULE_DAYS_LABEL,
  SCHEDULE_KIND_LABEL,
  SCHEDULE_NOTES,
  SCHEDULE_SHOWS,
  type ScheduleItem,
} from "@/features/info/schedule";
import {
  getVenueNow,
  type ScheduleStatus,
} from "@/features/info/lib/schedule-status";
import { ScheduleTimeline } from "@/features/info/components/ScheduleTimeline";
import { TourScheduleTable } from "@/features/info/components/TourScheduleTable";
import {
  TicketRoundList,
  getApplyingRound,
  isTicketScheduleOngoing,
} from "@/features/info/components/TicketRoundList";
import { INFORMATION } from "@/features/info/info";
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

// 다음 공연까지 이 날수 이내면 그 공연의 당일 시간표를 맨 위에 보여준다.
const SHOW_TIMETABLE_WITHIN_DAYS = 3;

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
  const nowItem = status.items[status.states.lastIndexOf("now")];
  const nextItem =
    status.nextIndex === null ? undefined : status.items[status.nextIndex];
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
  const nextShow = SCHEDULE_SHOWS[status.showIndex];
  const daysUntil = status.phase === "before" ? status.daysUntil : 0;
  const isTimetableSoon = daysUntil <= SHOW_TIMETABLE_WITHIN_DAYS;
  const ticketOngoing = isTicketScheduleOngoing(status.nowMs);
  const applyingRound = getApplyingRound(status.nowMs);
  // 버튼 둘째 줄 — 당일이면 지금/다음 일정, 임박하면 D-day, 접수 중이면 그 회차.
  const triggerSub = today
    ? today.sub
    : isTimetableSoon
      ? `D-${daysUntil} · ${nextShow.datesLabel ?? nextShow.date} ${nextShow.venue ?? ""}`.trim()
      : applyingRound
        ? `${applyingRound.name} 접수 중`
        : undefined;

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
              <PanelBody
                status={status}
                isTimetableSoon={isTimetableSoon}
                ticketOngoing={ticketOngoing}
              />
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
            {today ? today.main : `${INFORMATION.name} 간단 요약`}
          </span>
          {triggerSub && (
            <span className="truncate text-xs text-white/70">{triggerSub}</span>
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

/**
 * 패널 본문 — 시기에 따라 보여주는 것이 바뀐다.
 * - 다음 공연이 SHOW_TIMETABLE_WITHIN_DAYS일 이내(당일 포함): 그 공연의 당일
 *   시간표를 맨 위에(당일이면 지금 진행 중인 일정 강조).
 * - 티켓 접수가 아직 진행 중(입금 기간까지): 티켓 접수 일정(진행 중 회차 강조),
 *   투어 일정표는 접어 둔다.
 * - 접수가 모두 끝나면: 투어 일정표를 항상 펼쳐 두고 다음 공연 줄을 강조.
 */
function PanelBody({
  status,
  isTimetableSoon,
  ticketOngoing,
}: {
  status: Extract<ScheduleStatus, { phase: "before" | "today" }>;
  isTimetableSoon: boolean;
  ticketOngoing: boolean;
}) {
  const tableId = useId();
  const [isTableOpen, setTableOpen] = useState(false);
  const nextShow = SCHEDULE_SHOWS[status.showIndex];
  const venueToday = getVenueNow(status.nowMs).date;
  const table = (
    <TourScheduleTable
      today={venueToday}
      nextDate={nextShow.date}
      collapsePast
    />
  );

  return (
    <>
      {isTimetableSoon && (
        <PanelSection
          title={
            status.phase === "today" ? "오늘 공연 시간표" : "다음 공연 시간표"
          }
          meta={`${status.phase === "today" ? "D-DAY" : `D-${status.daysUntil}`} · ${nextShow.datesLabel ?? nextShow.date} ${nextShow.venue ?? ""}`}
        >
          <ScheduleTimeline status={status} />
          <ul className="flex flex-col gap-0.5 px-1 text-xs text-white/60">
            {SCHEDULE_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </PanelSection>
      )}

      {ticketOngoing && !isTimetableSoon && (
        <PanelSection title="티켓 접수 일정">
          <TicketRoundList nowMs={status.nowMs} />
        </PanelSection>
      )}

      {ticketOngoing && !isTimetableSoon ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={isTableOpen}
            aria-controls={tableId}
            onClick={() => setTableOpen((open) => !open)}
            className={cn(
              "text-ztmy-pink flex items-center justify-center gap-1 rounded-md border border-white/15 px-3 py-1.5 text-sm font-bold transition-colors hover:border-white/40",
              FOCUS_RING,
            )}
          >
            투어 일정표 {isTableOpen ? "접기" : "보기"}
            <ChevronDownIcon
              className={cn(
                "h-3 w-3 transition-transform",
                isTableOpen && "rotate-180",
              )}
            />
          </button>
          {isTableOpen && (
            <div id={tableId} className="px-1">
              {table}
            </div>
          )}
        </div>
      ) : (
        <PanelSection title="투어 일정">
          <div className="px-1">{table}</div>
        </PanelSection>
      )}
    </>
  );
}

function PanelSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex flex-wrap items-baseline gap-x-2 px-1 text-sm font-bold text-white">
        {title}
        {meta && (
          <span className="text-xs font-normal text-white/60">{meta}</span>
        )}
      </h3>
      {children}
    </section>
  );
}
