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

// getRemaining()의 days는 시간 차이를 단순히 24시간 단위로 나눈 값이라, 자정을
// 넘기기 전엔 실제로 하루 전(전날)인데도 0으로 나옵니다(예: 공연 20:50인데
// 지금이 전날 23:57이면 20시간 53분 차이라 0일로 계산됨). "당일"이나 "D-day"
// 표시는 남은 시간이 아니라 KST 기준 날짜(연-월-일)의 차이로 판단해야 합니다.
// target이 now보다 하루 늦으면 1, 같은 날이면 0, 하루 이르면 -1을 반환합니다.
export function getKstDayDiff(targetMs: number, nowMs: number): number {
  const targetMidnight = new Date(
    `${KST_DATE_FORMATTER.format(targetMs)}T00:00:00Z`,
  ).getTime();
  const nowMidnight = new Date(
    `${KST_DATE_FORMATTER.format(nowMs)}T00:00:00Z`,
  ).getTime();
  return Math.round((targetMidnight - nowMidnight) / 86_400_000);
}
