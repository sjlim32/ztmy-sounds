"use client";

import { useEffect, useState } from "react";
import {
  getRemaining,
  getKstDayDiff,
  type Remaining,
} from "@/features/home/lib/countdown";
import { getEventStartDate, type Event } from "@/data/event";

// 공연 시작 후 이 시간(시간 단위)까지는 "당일" 취급, 그 이후엔 "종료"로 취급.
export const DONE_AFTER_HOURS = 2;

// Countdown의 물풍선/달 위상 비주얼이 완전히 채워지기까지 걸리는 기간(일).
// WaterBalloon과 MoonPhase가 같은 기준으로 "얼마나 찼는지"를 계산하도록 공유합니다.
export const EMPTY_AT_DAYS = 90;

/**
 * event.date("YYYY.MM.DD", 다일차 공연이면 배열의 첫째 날) + event.time("HH:mm")을
 * 조합해 목표 시각을 계산하고, 매초 남은/지난 시간을 갱신합니다. Countdown/
 * NextEventCard가 같은 기준(2시간)으로 "당일" vs "종료" 상태를 판단할 수 있도록
 * 공유합니다.
 */
export function useEventCountdown(event: Event): {
  remaining: Remaining | null;
  hoursSincePast: number;
  isEventDay: boolean;
  daysUntilEvent: number;
  isDone: boolean;
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
  // 공연 시작 2시간 후까지는 "당일" 취급, 그 이후엔 "종료". Countdown/NextEventCard가
  // 매번 같은 공식을 반복 계산하지 않도록 여기서 한 번만 판단해 내려줍니다.
  const [isDone, setIsDone] = useState(false);
  const targetIso = `${getEventStartDate(event).replace(/\./g, "-")}T${event.time}:00+09:00`;

  useEffect(() => {
    const targetMs = new Date(targetIso).getTime();
    const tick = () => {
      const now = Date.now();
      const r = getRemaining(targetIso, now);
      const hsp = (now - targetMs) / 3_600_000;
      setRemaining(r);
      setHoursSincePast(hsp);
      const dayDiff = getKstDayDiff(targetMs, now);
      setDaysUntilEvent(dayDiff);
      setIsEventDay(dayDiff === 0);
      setIsDone(r.isPast && hsp >= DONE_AFTER_HOURS);
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [targetIso]);

  return { remaining, hoursSincePast, isEventDay, daysUntilEvent, isDone };
}
