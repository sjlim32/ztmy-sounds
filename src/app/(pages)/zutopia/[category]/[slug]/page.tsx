import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import {
  ZUTOPIA_CATEGORIES,
  getZutopiaCategory,
} from "@/features/zutopia/registry";
import { getLiveBySlug } from "@/features/zutopia/lives/data";
import type { LiveDetail } from "@/features/zutopia/lives/types";

// 공연/항목마다 MDX 콘텐츠 구조(어떤 섹션이 있는지 등)가 다를 수 있어서, 억지로
// 공통 템플릿화하지 않고 "카테고리/항목" 슬러그로 MDX 파일을 매핑합니다. 새
// 항목을 추가할 땐 이 맵에 한 줄만 더하면 됩니다.
//
// 주의: Supabase에 새 공연을 추가하면 /zutopia/lives 목록과 탭에는 바로
// 나타나지만, 여기 등록하기 전까진 상세 페이지는 404입니다 — 최소한 이
// 세트리스트만 보여주는 content.mdx라도 만들어 등록해야 합니다.
const CONTENT_BY_KEY: Record<string, ComponentType<{ live: LiveDetail }>> = {};

export async function generateStaticParams() {
  const paramsByCategory = await Promise.all(
    ZUTOPIA_CATEGORIES.map(async (category) => {
      const entries = await category.getEntries();
      return entries.map((entry) => ({
        category: category.slug,
        slug: entry.slug,
      }));
    }),
  );
  return paramsByCategory.flat();
}

export async function generateMetadata(
  props: PageProps<"/zutopia/[category]/[slug]">,
): Promise<Metadata> {
  const { category: categorySlug, slug } = await props.params;
  const category = getZutopiaCategory(categorySlug);
  if (!category) return {};

  const live = await getLiveBySlug(slug);
  if (!live) return {};

  return {
    title: `${live.title_ko} | ${category.label}`,
    description: `${live.title} 아카이브.`,
  };
}

export default async function ZutopiaEntryPage(
  props: PageProps<"/zutopia/[category]/[slug]">,
) {
  const { category: categorySlug, slug } = await props.params;
  const category = getZutopiaCategory(categorySlug);
  if (!category) notFound();

  const live = await getLiveBySlug(slug);
  if (!live) notFound();

  const Content = CONTENT_BY_KEY[`${categorySlug}/${slug}`];
  if (!Content) notFound();

  return <Content live={live} />;
}
