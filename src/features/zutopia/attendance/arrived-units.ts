/**
 * 빌드 뒤에 지나간 예정 공연일을 체크 대상에 넣는다 — 정적 사이트라 빌드할 때
 * "예정"이던 공연이 다음 배포 전까지 목록에 없으면, 공연을 보고 돌아오는 길에
 * 체크할 수 없다. 오늘(한국 날짜)까지 온 예정 공연일을 최신순 앞에 붙인다.
 * 오늘을 모르면(정적 HTML 단계) 그대로 돌려준다.
 */
export function withArrivedUnits<T extends { date: string }>(
  units: T[],
  upcoming: readonly T[],
  today: string | null,
): T[] {
  if (!today) return units;
  const arrived = upcoming.filter((unit) => unit.date <= today);
  if (arrived.length === 0) return units;
  return [...arrived].reverse().concat(units);
}
