import type { ZoomLevel } from "@/features/zutopia/timeline/buckets";

/** 축소 → 확대 순서. */
export const ZOOM_ORDER: readonly ZoomLevel[] = ["year", "month", "week"];
export const DEFAULT_ZOOM_LEVEL: ZoomLevel = "month";

export const ZOOM_LABEL: Record<ZoomLevel, string> = {
  year: "연",
  month: "월",
  week: "주",
};

/** 달 단계: 한 달 ≈ 150px(달 묶음 카드 하나가 들어가는 폭). */
export const MONTH_PX_PER_DAY = 5;
/** 주 단계: 한 주 = 84px. 카드(260px)가 3주쯤 — 붙은 일정만 다른 줄로. */
export const WEEK_PX_PER_DAY = 12;
/** 연 단계에서 해 하나의 최소 폭(요약 카드 폭). */
export const YEAR_MIN_WIDTH = 168;

/**
 * 연 단계 배율 — 모든 해가 화면 폭에 들어가게, 다만 해 하나가 요약 카드보다
 * 좁아지지는 않게(그땐 좌우로 스크롤).
 */
export function yearPxPerDay(viewWidth: number, totalDays: number): number {
  return Math.max(YEAR_MIN_WIDTH / 365, viewWidth / totalDays);
}

/** 확대(+1)·축소(-1) 한 단계. 양 끝에서 멈춘다. */
export function stepZoom(level: ZoomLevel, direction: 1 | -1): ZoomLevel {
  const index = ZOOM_ORDER.indexOf(level) + direction;
  return ZOOM_ORDER[Math.min(ZOOM_ORDER.length - 1, Math.max(0, index))];
}

/** 스크롤 상자 안 화면 x 자리에 있는 날짜(시작일부터 며칠째). */
export function daysAt(
  scrollLeft: number,
  screenX: number,
  pxPerDay: number,
  padLeft: number,
): number {
  return (scrollLeft + screenX - padLeft) / pxPerDay;
}

/**
 * 그 날짜가 화면 x 자리에 오게 하는 scrollLeft — 배율을 바꿀 때 기준점(버튼·
 * 카드면 가운데, 휠이면 마우스 위치) 아래 날짜를 제자리에 두는 데 쓴다.
 */
export function scrollLeftFor(
  days: number,
  screenX: number,
  pxPerDay: number,
  padLeft: number,
): number {
  return Math.max(0, padLeft + days * pxPerDay - screenX);
}
