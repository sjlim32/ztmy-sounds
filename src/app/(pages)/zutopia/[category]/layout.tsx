import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getZutopiaCategory } from "@/features/zutopia/registry";
import { ZutopiaSectionHeader } from "@/features/zutopia/components/ZutopiaSectionHeader";

export async function generateMetadata(
  props: LayoutProps<"/zutopia/[category]">,
): Promise<Metadata> {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) return {};

  return {
    title: category.label,
    description: category.description,
  };
}

/**
 * 카테고리 하나(예: "지난 공연") 안에서 목록 페이지와 항목 상세 페이지가
 * 공유하는 레이아웃. 항목마다 실제 URL(/zutopia/[category]/[slug])이 따로
 * 있는 "독립 라우트" 구조라, 북마크/공유가 그대로 되고 항목별 SEO
 * 메타데이터도 분리됩니다.
 *
 * 예전엔 여기서 카테고리 안의 모든 항목을 탭 버튼으로 나열했는데(항목이
 * 늘어날수록 탭도 계속 늘어나는 구조라 확장성이 없었음), lives 목록에
 * 투어까지 합쳐지며 항목 수가 계속 늘어날 예정이라 제거했습니다 — 항목
 * 탐색은 이제 목록 페이지 자체의 필터(예: LiveListView)가 맡습니다.
 */
export default async function ZutopiaCategoryLayout(
  props: LayoutProps<"/zutopia/[category]">,
) {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) notFound();

  return (
    <div>
      <ZutopiaSectionHeader
        title={category.label}
        description={category.description}
      />

      <div className="mt-8">{props.children}</div>
    </div>
  );
}
