export type ZutopiaEntryType = "concert" | "festival";

const ENTRY_TYPE_LABEL: Record<ZutopiaEntryType, string> = {
  concert: "콘서트",
  festival: "페스티벌",
};
// summarizeEntryTypes가 항상 이 순서로(콘서트 → 페스티벌) 보여주기 위한 목록.
const ENTRY_TYPE_ORDER: ZutopiaEntryType[] = ["concert", "festival"];

export interface ZutopiaEntry {
  slug: string;
  label: string;
  name: string;
  date: string;
  thumbnail: string;
  // 허브 카드 메타 문구("N개의 콘서트, N개의 페스티벌")를 만드는 데만 쓴다.
  // 나중에 이 카테고리처럼 나뉘지 않는 대분류가 생기면 생략해도 된다.
  type?: ZutopiaEntryType;
}

export interface ZutopiaCategory {
  slug: string;
  label: string;
  description: string;
  // 허브(/zutopia) 카드 배경 이미지. entries[0]의 썸네일을 빌려 쓰면 그
  // 항목이 바뀌거나 순서가 바뀔 때 카테고리 대표 이미지도 같이 흔들리므로,
  // 카테고리 자체의 고정 이미지를 따로 둔다.
  image?: string;
  entries: ZutopiaEntry[];
}

// 즛토피아는 "지난 공연" 말고도 나중에 다른 대분류(예: 굿즈, 디스코그래피 등)가
// 늘어날 수 있어서, 카테고리 하나 아래에 항목들이 딸리는 2단 구조로 둡니다.
// URL도 그대로 /zutopia/<카테고리 슬러그>/<항목 슬러그>가 됩니다.
//
// 새 카테고리를 추가할 땐 이 배열에 { slug, label, description, entries: [] }를
// 하나 더하면 되고, 카테고리 안에 새 항목을 추가할 땐 해당 entries에 추가한 뒤
// [category]/[slug]/page.tsx의 CONTENT_BY_KEY에도 등록하면 됩니다.
export const ZUTOPIA_CATEGORIES: ZutopiaCategory[] = [
  {
    slug: "lives",
    label: "지난 공연",
    description: "공연 및 세트리스트 정보",
    image: "/assets/zutopia/components/lives.webp",
    entries: [
      {
        slug: "sound-planet-2026",
        label: "사운드 플래닛 2026",
        name: "SOUND PLANET FESTIVAL 2026",
        date: "2026년 9월 6일",
        thumbnail: "/assets/zutopia/sound-planet-2026/sound-planet-3.webp",
        type: "festival",
      },
    ],
  },
];

export function getZutopiaCategory(slug: string): ZutopiaCategory | undefined {
  return ZUTOPIA_CATEGORIES.find((category) => category.slug === slug);
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
    .map((type) => `${counts.get(type)}개의 ${ENTRY_TYPE_LABEL[type]}`)
    .join(", ");
}
