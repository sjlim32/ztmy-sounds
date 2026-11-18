import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import {
  ZUTOPIA_CATEGORIES,
  getZutopiaCategory,
} from "@/features/zutopia/registry";
import { getLiveBySlug, getTourBySlug } from "@/features/zutopia/lives/data";
import { DefaultLiveContent } from "@/features/zutopia/lives/DefaultLiveContent";
import { DefaultTourContent } from "@/features/zutopia/lives/DefaultTourContent";
import type { LiveDetail } from "@/features/zutopia/lives/types";
import { isOnlineText } from "@/features/zutopia/lives/region";
import { FEED_ALTERNATE_TYPES, SITE_NAME, SITE_URL } from "@/lib/seo";
import { buildPastLiveJsonLd } from "@/lib/structured-data";

// 공연/항목마다 사진·티켓 등 손으로 채운 콘텐츠가 필요하면 이 맵에 등록해
// 기본 뷰(DefaultLiveContent)를 덮어쓴다. 등록하지 않은 공연은 기본 뷰
// (제목/날짜/장소/세트리스트)로 자동 렌더링되므로, 등록하지 않아도 상세
// 페이지가 비어있지 않다. 투어 슬러그는 이 맵의 대상이 아니다 —
// 필요해지면 그때 투어 전용 오버라이드 맵을 따로 둔다.
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

  // 투어 공연일 lives 행이 투어 slug를 그대로 쓸 수 있어(여러 행이 같은
  // slug) 투어를 먼저 확인한다 — lives부터 찾으면 단건 조회가 깨진다.
  const path = `/zutopia/${category.slug}/${slug}`;
  const tour = await getTourBySlug(slug);
  if (tour) {
    return entryMetadata({
      title: `${tour.title_ko} | ${category.label}`,
      description: `${tour.title} 아카이브.`,
      path,
      image: tour.poster_image_url,
    });
  }

  const live = await getLiveBySlug(slug);
  if (live) {
    return entryMetadata({
      title: `${live.title_ko ?? live.title} | ${category.label}`,
      description: `${live.title} 아카이브.`,
      path,
      image: live.poster_image_url ?? live.icon_image_url,
    });
  }

  return {};
}

/**
 * 상세 페이지마다 대표 주소(canonical)와 공유 미리보기 — openGraph·twitter를 안
 * 넣으면 루트 레이아웃 값(사이트 첫 화면 제목·주소·이미지)을 그대로 물려받는다.
 * 포스터가 없으면 사이트 기본 OG 이미지. alternates를 넣으면 루트의 피드 링크가
 * 덮어써지므로 FEED_ALTERNATE_TYPES도 함께.
 */
function entryMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image: string | null;
}): Metadata {
  const images = [image ?? "/og/og.webp"];
  return {
    title,
    description,
    alternates: { canonical: path, types: FEED_ALTERNATE_TYPES },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function ZutopiaEntryPage(
  props: PageProps<"/zutopia/[category]/[slug]">,
) {
  const { category: categorySlug, slug } = await props.params;
  const category = getZutopiaCategory(categorySlug);
  if (!category) notFound();

  // lives(개별 공연)와 tours(투어) 두 출처가 같은 목록에 함께 나오므로
  // (registry.ts의 getLiveEntries 참고), 슬러그가 어느 쪽인지 먼저 확인한다.
  // 투어 공연일이 투어 slug를 공유할 수 있어 투어를 먼저 본다.
  const tour = await getTourBySlug(slug);
  if (tour) {
    return <DefaultTourContent tour={tour} />;
  }

  const live = await getLiveBySlug(slug);
  if (live) {
    const Content =
      CONTENT_BY_KEY[`${categorySlug}/${slug}`] ?? DefaultLiveContent;
    const jsonLd = buildPastLiveJsonLd(
      live,
      `${SITE_URL}/zutopia/${categorySlug}/${slug}`,
      isOnlineText(live.region) || isOnlineText(live.live_venue),
    );
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // "</script>"가 든 제목이 태그를 닫지 않게 "<"를 이스케이프한다.
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Content live={live} />
      </>
    );
  }

  notFound();
}
