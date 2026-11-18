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
import { buildPastLiveJsonLd } from "@/features/zutopia/lives/json-ld";
import {
  BASE_OPEN_GRAPH,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  pageAlternates,
} from "@/lib/seo";
import { serializeJsonLd } from "@/lib/structured-data";
import { ARTIST } from "@/data/artist";

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
      description: `${ARTIST.name.kr} ${tour.title_ko} 투어 일정·세트리스트 아카이브.`,
      path,
      // DB에 빈 문자열("")로 들어간 주소도 있어 ??가 아니라 ||로 거른다.
      image: tour.poster_image_url || null,
    });
  }

  const live = await getLiveBySlug(slug);
  if (live) {
    return entryMetadata({
      title: `${live.title_ko ?? live.title} | ${category.label}`,
      description: `${ARTIST.name.kr} ${live.title_ko ?? live.title} 세트리스트·공연 정보 아카이브.`,
      path,
      image: liveImage(live),
    });
  }

  return {};
}

/** 공연 대표 이미지 — 포스터 → 아이콘. DB에 빈 문자열("")도 있어 ||로 거른다. */
function liveImage(live: {
  poster_image_url: string | null;
  icon_image_url: string | null;
}): string | null {
  return live.poster_image_url || live.icon_image_url || null;
}

/**
 * 상세 페이지마다 대표 주소(canonical)와 공유 미리보기 — openGraph·twitter를 안
 * 넣으면 루트 레이아웃 값(사이트 첫 화면 제목·주소·이미지)을 그대로 물려받는다.
 * 포스터가 없으면 사이트 기본 OG 이미지(크기 포함). 포스터는 대부분 세로·정사각이라
 * 가로로 잘리는 큰 카드 대신 작은 카드(summary)로 보낸다.
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
  return {
    title,
    description,
    alternates: pageAlternates(path),
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      ...BASE_OPEN_GRAPH,
      images: [image ? { url: image } : DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image ?? DEFAULT_OG_IMAGE.url],
    },
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
      { ...live, image: liveImage(live) },
      `${SITE_URL}/zutopia/${categorySlug}/${slug}`,
    );
    return (
      <>
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          />
        )}
        <Content live={live} />
      </>
    );
  }

  notFound();
}
