const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 한국 시간 기준 오늘 "YYYY-MM-DD". 공연 날짜는 한국·일본(같은 시간대) 날짜라,
 * "지난 공연 / 예정" 판단은 UTC가 아니라 이 날짜로 한다 — UTC면 한국 아침
 * 9시 전에 빌드·접속할 때 하루가 어긋난다.
 */
export function koreaDate(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
