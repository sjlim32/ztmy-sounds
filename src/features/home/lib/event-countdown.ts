"use client";

import { useEffect, useState } from "react";
import {
  getRemaining,
  getKstDayDiff,
  type Remaining,
} from "@/features/home/lib/countdown";
import { getEventStartDate, type Event } from "@/data/event";
import type { TourPerformanceItem } from "@/data/tour-performances";

// 공연 시작 후 이 시간(시간 단위)까지는 "당일" 취급, 그 이후엔 다음 공연(또는 전체 "종료")으로 전환.
export const DONE_AFTER_HOURS = 3;

// Countdown의 물풍선/달 위상 비주얼이 완전히 채워지기까지 걸리는 기간(일).
// WaterBalloon과 MoonPhase가 같은 기준으로 "얼마나 찼는지"를 계산하도록 공유합니다.
export const EMPTY_AT_DAYS = 90;

/**
 * 투어 공연 목록이 있을 때 현재 시각(nowMs) 기준 아직 종료되지 않은(시작 후 3시간 이내이거나 시작 전인)
 * 첫 번째 공연을 반환합니다. 모든 공연이 종료되었으면 undefined를 반환합니다.
 */
export function getActiveTourPerformance(
  event: Event,
  nowMs: number = Date.now(),
): TourPerformanceItem | undefined {
  if (!event.performances || event.performances.length === 0) {
    return undefined;
  }
  const doneAfterMs = DONE_AFTER_HOURS * 3_600_000;
  for (const perf of event.performances) {
    const targetMs = new Date(`${perf.date}T${perf.time}:00+09:00`).getTime();
    if (nowMs < targetMs + doneAfterMs) {
      return perf;
    }
  }
  return undefined;
}

// event.date("YYYY.MM.DD", 다일차 공연이면 배열의 첫째 날) + event.time("HH:mm")을
// 조합해 목표 시각(ms)을 계산합니다. 투어 공연(performances)이 있는 경우 현재 활성 공연의
// 시작 시각을 반환하며, 모든 공연이 종료된 경우 마지막 공연의 시작 시각을 반환합니다.
export function getEventTargetMs(
  event: Event,
  nowMs: number = Date.now(),
): number {
  if (event.performances && event.performances.length > 0) {
    const active = getActiveTourPerformance(event, nowMs);
    if (active) {
      return new Date(`${active.date}T${active.time}:00+09:00`).getTime();
    }
    const last = event.performances[event.performances.length - 1];
    return new Date(`${last.date}T${last.time}:00+09:00`).getTime();
  }
  const targetIso = `${getEventStartDate(event).replace(/\./g, "-")}T${event.time}:00+09:00`;
  return new Date(targetIso).getTime();
}

/**
 * 이벤트의 카운트다운을 매초 갱신합니다.
 * 투어 공연(performances가 정의된 경우)의 경우 각 공연 시작 후 3시간이 지나면
 * 자동으로 다음 공연으로 목표가 넘어가 카운트다운 및 달 위상/물풍선 비주얼이 새 공연 기준으로 갱신됩니다.
 */
export function useEventCountdown(event: Event): {
  remaining: Remaining | null;
  hoursSincePast: number;
  isEventDay: boolean;
  daysUntilEvent: number;
  isDone: boolean;
  activePerformance?: TourPerformanceItem;
} {
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  // 공연 시작 후 경과 시간(시간 단위). getRemaining()은 지난 뒤엔 전부 0을
  // 반환하므로 별도로 계산합니다.
  const [hoursSincePast, setHoursSincePast] = useState(0);
  // 남은 시간(remaining.days === 0)이 아니라 KST 날짜 차이로 "당일"/D-day를
  // 판단합니다. 그렇지 않으면 공연 전날 자정 근처(24시간 이내지만 날짜는 다른
  // 날)에도 당일 또는 "0일 남음"으로 잘못 표시되는 버그가 생깁니다.
  const [isEventDay, setIsEventDay] = useState(false);
  const [daysUntilEvent, setDaysUntilEvent] = useState(0);
  // 공연 시작 3시간 후까지는 "당일" 취급, 그 이후엔 다음 공연 또는 "종료". Countdown/NextEventCard가
  // 매번 같은 공식을 반복 계산하지 않도록 여기서 한 번만 판단해 내려줍니다.
  const [isDone, setIsDone] = useState(false);
  const [activePerformance, setActivePerformance] = useState<
    TourPerformanceItem | undefined
  >(undefined);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const active = getActiveTourPerformance(event, now);
      const targetMs = getEventTargetMs(event, now);
      const r = getRemaining(targetMs, now);
      const hsp = (now - targetMs) / 3_600_000;
      setRemaining(r);
      setHoursSincePast(hsp);
      const dayDiff = getKstDayDiff(targetMs, now);
      setDaysUntilEvent(dayDiff);
      setIsEventDay(dayDiff === 0);

      const done =
        event.performances && event.performances.length > 0
          ? !active
          : r.isPast && hsp >= DONE_AFTER_HOURS;
      setIsDone(done);
      setActivePerformance(active);
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [event]);

  return {
    remaining,
    hoursSincePast,
    isEventDay,
    daysUntilEvent,
    isDone,
    activePerformance,
  };
}
