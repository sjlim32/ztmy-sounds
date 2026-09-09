import type { SortDirection } from "./types";

export const DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: "desc", label: "내림차순" },
  { value: "asc", label: "오름차순" },
];

/**
 * groupAlbums(AlbumListView)/groupSongs(SongListView)가 공유하는 "오름차순
 * 기준으로 만든 그룹 배열을 desc일 때만 그룹 순서 + 그룹 내부 항목 순서를
 * 통째로 뒤집는다" 후처리 — groupBy가 뭐든 동일하게 적용되는 공용 옵션이라
 * 그룹핑 로직 자체에 분기를 늘리지 않고 이 한 곳으로 뺐다. 항목 배열을
 * 그룹 타입에서 직접 꺼내 쓰지 않고 getItems/withItems로 받는 이유는, 두
 * 호출부의 그룹 타입이 서로 다른 프로퍼티 이름(albums vs songs)을 쓰기
 * 때문 — keyof 인덱싱보다 getter/setter 한 쌍이 타입도 더 단순하다.
 */
export function applySortDirection<Group, Item>(
  groups: Group[],
  direction: SortDirection,
  getItems: (group: Group) => Item[],
  withItems: (group: Group, items: Item[]) => Group,
): Group[] {
  if (direction !== "desc") return groups;
  return groups
    .slice()
    .reverse()
    .map((group) => withItems(group, [...getItems(group)].reverse()));
}
