"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SCHEDULE_DAYS_LABEL,
  SCHEDULE_NOTES,
  SCHEDULE_SHOWS,
} from "@/features/info/schedule";
import {
  getVenueNow,
  type ScheduleStatus,
} from "@/features/info/lib/schedule-status";
import { ScheduleTimeline } from "@/features/info/components/ScheduleTimeline";
import { TourScheduleTable } from "@/features/info/components/TourScheduleTable";
import { TicketRoundList } from "@/features/info/components/TicketRoundList";
import { ConcertLinks } from "@/features/info/components/ConcertLinks";
import {
  FOCUS_RING,
  GHOST_ICON_BUTTON_CLASS,
} from "@/components/button-styles";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { CloseIcon } from "@/components/icons/CloseIcon";

/**
 * 공연 안내 다이얼로그 본문 — 버튼을 눌러 열 때만 동적 로드되어
 * 홈(`/`) 초기 JS 번들에서 일정표·시간표·링크 컴포넌트를 덜어낸다.
 */
export function ConcertQuickPanelDialog({
  panelId,
  status,
  isTimetableSoon,
  ticketOngoing,
  onClose,
}: {
  panelId: string;
  status: Extract<ScheduleStatus, { phase: "before" | "today" }>;
  isTimetableSoon: boolean;
  ticketOngoing: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
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
            onClick={onClose}
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

