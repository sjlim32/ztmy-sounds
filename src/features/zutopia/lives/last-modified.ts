// 사이트맵 lastmod 계산(순수 함수) — lives/data.ts(서버 전용)와 테스트가 같이 쓰려고 따로 둔다.
import {
  isTourDateRow,
  type TourRef,
} from "@/features/zutopia/lives/tour-dates";

/** ISO 시각 둘 중 늦은 것 — 시간대 표기가 달라도 맞게 Date로 비교한다. */
function later(a: string | undefined, b: string): string {
  return a && Date.parse(a) > Date.parse(b) ? a : b;
}

/**
 * 목록 항목 slug → 마지막으로 고친 시각(ISO). 단독 공연은 그 행의 updated_at(같은
 * slug 행이 여럿이면 가장 늦은 값), 투어는 투어 행과 그 공연일 행 중 가장 늦은 값 —
 * 투어 slug를 그대로 쓴 공연일 행이 있어도 투어 값으로 덮는다(그 행도 계산에 들어감).
 */
export function computeLastModified(
  lives: readonly {
    slug: string | null;
    tour_id: string | null;
    updated_at: string;
  }[],
  tours: readonly (TourRef & { updated_at: string })[],
): Map<string, string> {
  const result = new Map<string, string>();
  for (const live of lives) {
    if (live.slug)
      result.set(live.slug, later(result.get(live.slug), live.updated_at));
  }
  for (const tour of tours) {
    result.set(
      tour.slug,
      lives
        .filter((live) => isTourDateRow(live, tour))
        .reduce((max, live) => later(max, live.updated_at), tour.updated_at),
    );
  }
  return result;
}
