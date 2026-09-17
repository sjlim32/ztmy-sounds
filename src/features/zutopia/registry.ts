import { getLiveEntries } from "@/features/zutopia/lives/data";
import type { ZutopiaCategory } from "@/features/zutopia/types";

// 즛토피아는 "지난 공연" 말고도 나중에 다른 대분류(예: 굿즈, 디스코그래피 등)가
// 늘어날 수 있어서, 카테고리 하나 아래에 항목들이 딸리는 2단 구조로 둡니다.
// URL도 그대로 /zutopia/<카테고리 슬러그>/<항목 슬러그>가 됩니다.
//
// 새 카테고리를 추가할 땐 이 배열에 { slug, label, description, getEntries }를
// 하나 더하면 됩니다. 카테고리 안에 새 항목을 추가할 땐(예: Supabase에 공연을
// 추가) 목록/탭에는 바로 나타나고, 상세 페이지도 기본 뷰(DefaultLiveContent)로
// 자동 렌더링됩니다 — 사진/공지 등 수동 콘텐츠가 필요할 때만
// [category]/[slug]/page.tsx의 CONTENT_BY_KEY에 등록하면 됩니다.
export const ZUTOPIA_CATEGORIES: ZutopiaCategory[] = [
  {
    slug: "lives",
    label: "지난 공연",
    description: "공연 및 세트리스트 정보",
    image: "/assets/zutopia/components/lives.webp",
    getEntries: getLiveEntries,
  },
];

export function getZutopiaCategory(slug: string): ZutopiaCategory | undefined {
  return ZUTOPIA_CATEGORIES.find((category) => category.slug === slug);
}
