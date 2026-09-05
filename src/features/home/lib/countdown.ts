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

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
});

// getRemaining()의 days는 시간 차이를 단순히 24시간 단위로 나눈 값이라,
// 자정을 넘기기 전엔 실제로 하루 전(전날)인데도 0으로 나옵니다. "당일" 여부는
// 남은 시간이 아니라 KST 기준 날짜(연-월-일)가 실제로 같은지로 판단해야 합니다.
export function isSameKstDate(a: number, b: number): boolean {
  return KST_DATE_FORMATTER.format(a) === KST_DATE_FORMATTER.format(b);
}
