"use client";

import { useEffect, useState } from "react";
import { SCHEDULE_SHOWS } from "@/features/info/schedule";
import {
  getScheduleStatus,
  type ScheduleStatus,
} from "@/features/info/lib/schedule-status";

const REFRESH_MS = 30_000;

/**
 * 공연 일정의 현재 상태(다음 공연·당일 시간표). 지금 시각은 방문자 브라우저에서만 알 수
 * 있어서 빌드된 HTML에선 null이고, 마운트 후 채운 뒤 30초마다 갱신한다
 * (docs/CONVENTIONS.md "브라우저 API 기반 초기 상태").
 */
export function useScheduleStatus(): ScheduleStatus | null {
  const [status, setStatus] = useState<ScheduleStatus | null>(null);

  useEffect(() => {
    const tick = () => setStatus(getScheduleStatus(Date.now(), SCHEDULE_SHOWS));
    tick();
    const intervalId = setInterval(tick, REFRESH_MS);
    return () => clearInterval(intervalId);
  }, []);

  return status;
}
