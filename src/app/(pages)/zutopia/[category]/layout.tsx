import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getZutopiaCategory } from "@/features/zutopia/registry";
import { ZutopiaCategoryTabs } from "@/features/zutopia/components/ZutopiaCategoryTabs";
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
 * 공유하는 레이아웃 — 탭처럼 보이는 nav로 그 카테고리 안의 항목들을
 * 전환합니다. 항목마다 실제 URL(/zutopia/[category]/[slug])이 따로 있는
 * "독립 라우트" 구조라, 북마크/공유가 그대로 되고 항목별 SEO 메타데이터도
 * 분리됩니다.
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

      <ZutopiaCategoryTabs category={category} />

      <div className="mt-8">{props.children}</div>
    </div>
  );
}
