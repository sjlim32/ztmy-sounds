// 투어 소속 공연일 판정(순수 함수) — 상세 조회(lives/data.ts)와 사이트맵 lastmod
// 계산(last-modified.ts)이 같이 쓴다.

export interface TourRef {
  id: string;
  slug: string;
}

/**
 * 투어 소속 공연일을 찾는 PostgREST or 필터. 공연일은 tour_id로 묶는 게
 * 원칙이지만, slug에 투어 slug를 그대로 넣어(tour_id 없이) 등록된 행도
 * 있어 둘 다 투어 소속으로 본다. 같은 기준을 쓰는 곳: isTourDateRow(아래),
 * search/data.ts(getSetlistLinks의 entrySlugByLiveId), live-history/units.ts(buildAllUnits의 투어 찾기) —
 * 기준을 바꾸면 함께 고친다.
 */
export function tourDateFilter(tour: TourRef): string {
  return `tour_id.eq.${tour.id},slug.eq.${tour.slug}`;
}

/** tourDateFilter와 같은 기준의 JS 판정. */
export function isTourDateRow(
  live: { tour_id: string | null; slug: string | null },
  tour: TourRef,
): boolean {
  return live.tour_id === tour.id || live.slug === tour.slug;
}
