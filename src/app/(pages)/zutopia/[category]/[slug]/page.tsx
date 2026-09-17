import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import {
  ZUTOPIA_CATEGORIES,
  getZutopiaCategory,
} from "@/features/zutopia/registry";
import { getLiveBySlug } from "@/features/zutopia/lives/data";
import { DefaultLiveContent } from "@/features/zutopia/lives/DefaultLiveContent";
import type { LiveDetail } from "@/features/zutopia/lives/types";

// 공연/항목마다 사진·티켓 등 손으로 채운 콘텐츠가 필요하면 이 맵에 등록해
// 기본 뷰(DefaultLiveContent)를 덮어쓴다. 등록하지 않은 공연은 기본 뷰
// (제목/날짜/장소/세트리스트)로 자동 렌더링되므로, 등록하지 않아도 상세
// 페이지가 비어있지 않다.
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

  const Content =
    CONTENT_BY_KEY[`${categorySlug}/${slug}`] ?? DefaultLiveContent;

  return <Content live={live} />;
}
