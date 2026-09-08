import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import {
  ZUTOPIA_CATEGORIES,
  getZutopiaCategory,
} from "@/features/zutopia/registry";
import SoundPlanet2026Content from "@/features/zutopia/archive/sound-planet-2026/content.mdx";

// 공연/항목마다 MDX 콘텐츠 구조(어떤 섹션이 있는지 등)가 다를 수 있어서, 억지로
// 공통 템플릿화하지 않고 "카테고리/항목" 슬러그로 MDX 파일을 매핑합니다. 새
// 항목을 추가할 땐 이 맵에 한 줄만 더하면 됩니다.
const CONTENT_BY_KEY: Record<string, ComponentType> = {
  "concerts/sound-planet-2026": SoundPlanet2026Content,
};

export function generateStaticParams() {
  return ZUTOPIA_CATEGORIES.flatMap((category) =>
    category.entries.map((entry) => ({
      category: category.slug,
      slug: entry.slug,
    })),
  );
}

export async function generateMetadata(
  props: PageProps<"/zutopia/[category]/[slug]">,
): Promise<Metadata> {
  const { category: categorySlug, slug } = await props.params;
  const category = getZutopiaCategory(categorySlug);
  const entry = category?.entries.find((item) => item.slug === slug);
  if (!entry) return {};

  return {
    title: `${entry.label} | ${category?.label}`,
    description: `${entry.name} 아카이브.`,
  };
}

export default async function ZutopiaEntryPage(
  props: PageProps<"/zutopia/[category]/[slug]">,
) {
  const { category, slug } = await props.params;
  const Content = CONTENT_BY_KEY[`${category}/${slug}`];

  if (!Content) notFound();

  return <Content />;
}
