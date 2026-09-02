export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

// 미래면 목표까지 남은 시간을, 과거면 목표로부터 지난 시간을 같은 필드에 담아서 반환합니다 (부호는 isPast로 구분).
export function getRemaining(
  targetIso: string,
  now: number = Date.now(),
): Remaining {
  const diff = new Date(targetIso).getTime() - now;

  const totalSeconds = Math.floor(Math.abs(diff) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isPast: diff <= 0 };
}
