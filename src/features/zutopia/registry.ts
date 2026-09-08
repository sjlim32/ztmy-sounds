export interface ZutopiaEntry {
  slug: string;
  label: string;
  name: string;
  date: string;
  thumbnail: string;
}

export interface ZutopiaCategory {
  slug: string;
  label: string;
  description: string;
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
    slug: "concerts",
    label: "공연",
    description: "역대 공연 및 세트리스트 정보",
    entries: [
      {
        slug: "sound-planet-2026",
        label: "사운드 플래닛 2026",
        name: "SOUND PLANET FESTIVAL 2026",
        date: "2026년 9월 6일",
        thumbnail: "/assets/zutopia/sound-planet-2026/sound-planet-3.webp",
      },
    ],
  },
];

export function getZutopiaCategory(slug: string): ZutopiaCategory | undefined {
  return ZUTOPIA_CATEGORIES.find((category) => category.slug === slug);
}
