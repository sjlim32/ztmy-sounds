/**
 * 공연 목록의 종류 — 투어(tours 테이블), 페스티벌(lives.type FESTIVAL), 콘서트
 * (그 밖의 모든 lives.type: CONCERT·EVENT…). 목록 필터·카드 표시·허브 요약이
 * 모두 이 세 가지를 쓴다.
 */
export type ZutopiaEntryType = "tour" | "festival" | "concert";

export const ENTRY_TYPE_LABEL: Record<ZutopiaEntryType, string> = {
  tour: "투어",
  festival: "페스티벌",
  concert: "콘서트",
};
// 종류 색 — 투어 하늘, 페스티벌 보라, 콘서트 분홍. 마젠타는 내한 태그 색이라
// 쓰지 않고, 내한 태그와 가장 자주 나란히 놓이는 투어에 마젠타와 가장 먼
// 하늘색을 준다. 점(DOT)은 상세 티켓의 종류 표시(LiveTypeBadge)가, 꽉 찬
// 면(TAG)은 목록 카드의 포스터 위 태그가 쓴다 — 포스터 위에서는 점만으로는
// 구분이 안 돼 면 전체를 종류 색으로 채운다(밝은 색 면엔 어두운 글자).
export const ENTRY_TYPE_DOT: Record<ZutopiaEntryType, string> = {
  tour: "bg-ztmy-sky",
  festival: "bg-ztmy-purple",
  concert: "bg-ztmy-pink",
};
export const ENTRY_TYPE_TAG: Record<ZutopiaEntryType, string> = {
  tour: "bg-ztmy-sky text-black/85",
  festival: "bg-ztmy-purple text-white",
  concert: "bg-ztmy-pink text-black/85",
};
// 필터·그룹·요약이 항상 이 순서로 보여주기 위한 목록.
export const ENTRY_TYPE_ORDER: ZutopiaEntryType[] = [
  "tour",
  "festival",
  "concert",
];

export interface ZutopiaEntry {
  slug: string;
  label: string;
  name: string;
  date: string;
  thumbnail: string;
  // 허브 카드 메타 문구("N개의 콘서트, N개의 페스티벌")를 만드는 데만 쓴다.
  // 나중에 이 카테고리처럼 나뉘지 않는 대분류가 생기면 생략해도 된다.
  type?: ZutopiaEntryType;
  // 연도 추출·정렬용 원본 ISO 날짜("YYYY-MM-DD"). `date`는 이미
  // "2026년 9월 5일" 같은 한글 표시 문자열로 가공돼 있어 파싱에 안 쓴다.
  startDate?: string;
  // 목록 카드에 날짜 옆에 표시할 도시명(한글). lives는 region 컬럼에서
  // 뽑아 채우고, tours는 위치 컬럼 자체가 없어(투어 하나가 여러 도시를
  // 돌 수 있어서) 항상 비워둔다.
  city?: string;
  // 내한 공연이면 몇 번째 내한인지(metadata.visited) — 목록 카드 강조용.
  visitOrdinal?: number | null;
}

export interface ZutopiaCategory {
  slug: string;
  label: string;
  description: string;
  // 허브(/zutopia) 카드 배경 이미지. entries[0]의 썸네일을 빌려 쓰면 그
  // 항목이 바뀌거나 순서가 바뀔 때 카테고리 대표 이미지도 같이 흔들리므로,
  // 카테고리 자체의 고정 이미지를 따로 둔다.
  image?: string;
  // 카테고리 안의 항목 목록을 가져오는 함수. "lives"처럼 Supabase 등
  // 외부 데이터 소스를 쓸 수 있어 비동기다.
  getEntries: () => Promise<ZutopiaEntry[]>;
}

// 허브 카드 메타 문구를 만든다. entries에 type이 하나라도 있으면 타입별
// 개수로("N개의 콘서트, N개의 페스티벌"), 없으면("굿즈" 같은 나중 카테고리)
// 기존처럼 "N개 항목"으로 돌아간다.
export function summarizeEntryTypes(entries: ZutopiaEntry[]): string {
  const counts = new Map<ZutopiaEntryType, number>();
  for (const entry of entries) {
    if (!entry.type) continue;
    counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return `${entries.length}개 항목`;
  }

  return ENTRY_TYPE_ORDER.filter((type) => counts.has(type))
    .map((type) => `${counts.get(type)} ${ENTRY_TYPE_LABEL[type]}`)
    .join(" · ");
}
