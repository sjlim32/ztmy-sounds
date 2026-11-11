/**
 * 공연 목록 카드 그림과 상세 페이지 포스터를 잇는 화면 전환 이름 — 양쪽이 같은
 * 이름이면 상세로 갈 때 카드 그림이 포스터 자리로 이어지며 커진다(globals.css
 * .morph). 한 화면에서 이름이 겹치면 안 돼서 slug를 붙인다.
 */
export function posterTransitionName(slug: string): string {
  return `live-poster-${slug}`;
}
