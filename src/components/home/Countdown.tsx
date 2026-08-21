"use client";

import { useEffect, useState } from "react";
import { getRemaining, type Remaining } from "@/lib/guide/countdown";

export function Countdown({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(targetIso));
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [targetIso]);

  if (!remaining) return null;

  if (remaining.isPast) {
    return <div data-role="countdown">공연이 시작되었습니다</div>;
  }

  return (
    <div data-role="countdown">
      <span>{remaining.days}일</span>
      <span>{remaining.hours}시간</span>
      <span>{remaining.minutes}분</span>
      <span>{remaining.seconds}초</span>
    </div>
  );
}
