/**
 * 불러올 공연일 ID 중 지금 데이터에 있는 것만 — 하나도 안 맞으면(빈 코드, 더
 * 새 빌드의 공연만 담긴 코드) 빈 목록이고, 화면은 "바꾸기"를 내놓지 않는다
 * (누르면 내 기록이 0개로 지워진다).
 */
export function importableIds(
  ids: readonly string[],
  units: readonly { id: string }[],
): string[] {
  const known = new Set(units.map((unit) => unit.id));
  return ids.filter((id) => known.has(id));
}
