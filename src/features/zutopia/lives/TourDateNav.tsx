import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";
import { groupTourDates } from "@/features/zutopia/lives/date-groups";
import { formatDayShow } from "@/features/zutopia/lives/shows";
import { stripLabels } from "@/features/zutopia/lives/tour-nav";
import { setlistSongCount } from "@/features/zutopia/lives/medley";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ListIcon } from "@/components/icons/ListIcon";
import { PlaneIcon } from "@/components/icons/PlaneIcon";
import { formatKoreanMonthDay } from "@/lib/ymd";
import {
  CANCELED_TEXT_CLASS,
  LIVE_SURFACE_CLASS,
  LIVE_TAG_CLASS,
  LIVE_TAG_TONE,
} from "@/features/zutopia/lives/surface";
import type { TourDateEntry } from "@/features/zutopia/lives/types";

/**
 * 투어 상세 왼쪽 "공연 일정" — 고르는 목록. 맨 위 "공통 셋리"(공통 세트리스트가 있을 때) +
 * "공연별" 공연일. 고른 것 하나만 오른쪽(TourOverview)에 보여서, 목록엔 도시·날짜·곡 수만
 * 둔다(선택곡 미리보기·그림 없음).
 * - PC(`pc:`): 세로 목록 — "공통 셋리"는 날짜 줄과 같은 고르는 줄(목록 아이콘 + "모든 공연
 *   공통")로 선택지임을 드러내고, 아래 "공연별" 제목 + 도시 머리(같은 도시·공연장 연달은 공연일
 *   묶음, date-groups.ts) 아래 날짜 줄(날짜·요일·DAY/회차 · 오른쪽 곡 수 + 꺾쇠 ›, 취소는
 *   회색·취소선·누를 수 없음). 고른 줄은 분홍 바탕 + 분홍 날짜·꺾쇠.
 * - 그 미만: 가로로 넘기는 밑줄 탭 한 줄(tour-nav.ts stripLabels — 도시가 바뀔 때만 도시 이름,
 *   취소일 없음). 고른 탭이 보이게 가로로 맞춘다.
 * selectedId = null이면 투어 세트리스트.
 */
export function TourDateNav({
  dates,
  hasCommon,
  selectedId,
  onSelect,
}: {
  dates: TourDateEntry[];
  hasCommon: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const labels = stripLabels(dates);
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const active = stripRef.current?.querySelector<HTMLElement>(
      '[aria-pressed="true"]',
    );
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  // 고르는 줄 — 고른 줄은 분홍 바탕, 오른쪽 꺾쇠(›)는 "누르면 옆에 세트리스트가 열린다"는
  // 표시(마우스를 올리면 살짝 오른쪽으로).
  const rowClass = (active: boolean) =>
    cn(
      "group flex w-full items-center gap-2 rounded-control px-3 py-1.5 text-left text-sm transition-colors",
      FOCUS_RING,
      active ? "bg-ztmy-magenta/20" : "hover:bg-white/[0.06]",
    );
  const chevron = (active: boolean) => (
    <ChevronLeftIcon
      className={cn(
        "size-3.5 shrink-0 rotate-180 transition-[translate,color]",
        active
          ? "text-ztmy-pink"
          : "text-white/30 group-hover:translate-x-0.5 group-hover:text-white/70",
      )}
    />
  );

  return (
    <>
      {/* PC — 세로 목록 */}
      <nav
        aria-label="공연 일정"
        className={cn(
          LIVE_SURFACE_CLASS,
          "pc:flex rounded-card hidden flex-col gap-0.5 overflow-y-auto p-1.5",
          "max-h-[calc(100dvh-12rem)]",
        )}
      >
        {hasCommon && (
          // 날짜 줄과 같은 고르는 줄 모양 — 아이콘·두 줄 글자로 "전체 공통" 선택지임을 드러낸다.
          <button
            type="button"
            aria-pressed={selectedId === null}
            onClick={() => onSelect(null)}
            className={cn(rowClass(selectedId === null), "py-2")}
          >
            <ListIcon
              className={cn(
                "size-4 shrink-0",
                selectedId === null ? "text-ztmy-pink" : "text-white/60",
              )}
            />
            <span className="flex min-w-0 flex-1">
              <span
                className={cn(
                  "font-semibold",
                  selectedId === null ? "text-ztmy-pink" : "text-white",
                )}
              >
                공통 셋리
              </span>
            </span>
            {chevron(selectedId === null)}
          </button>
        )}
        {hasCommon && (
          <p className="mt-1 border-t border-white/10 px-3 pt-2.5 text-sm text-white/45">
            공연별
          </p>
        )}
        {groupTourDates(dates).map((group, index) => (
          <div
            key={group[0].id}
            className={cn(
              "flex flex-col gap-0.5",
              hasCommon ? "pt-0.5" : "pt-1.5",
              index > 0 && "mt-1 border-t border-white/10 pt-1.5",
            )}
          >
            <p className="flex flex-wrap items-center gap-x-1.5 px-3 py-1">
              <span
                className={cn(
                  "text-base font-bold",
                  group.every((date) => date.canceled)
                    ? CANCELED_TEXT_CLASS
                    : "text-white",
                )}
              >
                {group[0].city}
              </span>
              {/* 내한 — 머리의 "첫 번째 내한"과 같은 분홍 굵은 글자 + 비행기 아이콘(뱃지 없이) */}
              {group[0].country === "한국" && (
                <span className="text-ztmy-pink inline-flex items-center gap-1 text-sm font-semibold">
                  <PlaneIcon className="size-3.5 shrink-0" />
                  내한
                </span>
              )}
            </p>
            {group.map((date) => {
              const md = formatKoreanMonthDay(date.startDate);
              const weekday = formatKoreanMonthDay(date.startDate, {
                weekday: true,
              }).slice(md.length + 1);
              const extra = formatDayShow(date.dayNumber, date.showLabel);
              const active = date.id === selectedId;
              const muted = date.canceled
                ? CANCELED_TEXT_CLASS
                : "text-white/45";
              const content = (
                <>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      date.canceled
                        ? CANCELED_TEXT_CLASS
                        : active
                          ? "text-ztmy-pink"
                          : "text-white/85",
                    )}
                  >
                    {md}
                  </span>
                  <span className={muted}>{weekday}</span>
                  {extra && (
                    <span className={cn("truncate", muted)}>{extra}</span>
                  )}
                  {date.canceled ? (
                    <span
                      className={cn(
                        LIVE_TAG_CLASS,
                        LIVE_TAG_TONE.canceled,
                        "ml-auto",
                      )}
                    >
                      취소
                    </span>
                  ) : (
                    // 그날 곡 수 + 꺾쇠 — 누르면 세트리스트가 열린다는 표시
                    <span className="ml-auto flex shrink-0 items-center gap-1">
                      {date.setlist.length > 0 && (
                        <span
                          className={cn(
                            "tabular-nums",
                            active ? "text-white/80" : "text-white/40",
                          )}
                        >
                          {setlistSongCount(date.setlist)}곡
                        </span>
                      )}
                      {chevron(active)}
                    </span>
                  )}
                </>
              );
              return date.canceled ? (
                <div key={date.id} className={rowClass(false)}>
                  {content}
                </div>
              ) : (
                <button
                  key={date.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(date.id)}
                  className={rowClass(active)}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 모바일·태블릿 — 가로로 넘기는 밑줄 탭 */}
      <div
        ref={stripRef}
        role="group"
        aria-label="공연 일정"
        className="pc:hidden flex scrollbar-none gap-5 overflow-x-auto border-b border-white/10"
      >
        {[
          ...(hasCommon ? [{ id: null, label: "공통 셋리" }] : []),
          ...[...labels].map(([id, label]) => ({ id, label })),
        ].map((item) => {
          const active = item.id === selectedId;
          return (
            <button
              key={item.id ?? "common"}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              className={cn(
                "-mb-px shrink-0 border-b-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                FOCUS_RING,
                active
                  ? "border-ztmy-pink text-white"
                  : "border-transparent text-white/55 hover:text-white",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
