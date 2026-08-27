"use client";

import { useEffect, useState } from "react";
import { getRemaining, type Remaining } from "@/features/home/lib/countdown";
import type { VisitEvent } from "@/data/event";

// 공연 시작 후 이 시간(시간 단위)까지는 "당일" 취급, 그 이후엔 "종료"로 취급.
export const DONE_AFTER_HOURS = 2;

/**
 * event.date("YYYY.MM.DD") + event.time("HH:mm")을 조합해 목표 시각을 계산하고,
 * 매초 남은/지난 시간을 갱신합니다. Countdown/NextVisit이 같은 기준(2시간)으로
 * "당일" vs "종료" 상태를 판단할 수 있도록 공유합니다.
 */
export function useEventCountdown(event: VisitEvent): {
  remaining: Remaining | null;
  hoursSincePast: number;
} {
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  // 공연 시작 후 경과 시간(시간 단위). getRemaining()은 지난 뒤엔 전부 0을
  // 반환하므로 별도로 계산합니다.
  const [hoursSincePast, setHoursSincePast] = useState(0);
  const targetIso = `${event.date.replace(/\./g, "-")}T${event.time}:00+09:00`;

  useEffect(() => {
    const tick = () => {
      setRemaining(getRemaining(targetIso));
      setHoursSincePast(
        (Date.now() - new Date(targetIso).getTime()) / 3_600_000,
      );
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [targetIso]);

  return { remaining, hoursSincePast };
}
