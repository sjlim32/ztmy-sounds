import { ARTIST } from "@/data/artist";

export const SITE_URL = "https://ztmy-sounds.fans";

export const SITE_NAME = `${ARTIST.name.kr} FAN PAGE`;

/** 로고에 적힌 사이트 브랜드명 — 도메인(ztmy-sounds)과 같은 이름. */
export const SITE_BRAND = "ZTMY SOUNDS";

/** 새로 추가된 응원 가이드 곡을 알리는 RSS 피드(src/app/feed.xml/route.ts). */
export const FEED_URL = "/feed.xml";
export const FEED_TITLE = `${SITE_BRAND} 응원 가이드`;

/** 메타데이터 alternates.types(피드 링크) — 루트 레이아웃이 넣는다. 하위 페이지가
 * alternates를 지정하면 통째로 덮어써지니 그런 페이지는 pageAlternates를 쓴다. */
export const FEED_ALTERNATE_TYPES = {
  "application/rss+xml": [{ url: FEED_URL, title: FEED_TITLE }],
};

/** 페이지 대표 주소 + 피드 링크 — alternates를 지정하는 페이지는 이걸 쓴다. */
export function pageAlternates(path: string) {
  return { canonical: path, types: FEED_ALTERNATE_TYPES };
}

/** 사이트 기본 공유 이미지(1200×630). */
export const DEFAULT_OG_IMAGE = {
  url: "/og/og.webp",
  width: 1200,
  height: 630,
};

/** openGraph를 지정하는 페이지가 함께 넣을 공통값 — openGraph도 통째로 덮어써진다. */
export const BASE_OPEN_GRAPH = {
  locale: "ko_KR",
  type: "website",
} as const;

/** 메인 화면 로고 아래 한 줄 소개. */
export const SITE_TAGLINE = "계속 한밤중이면 좋을텐데 팬페이지";

export const SITE_DESCRIPTION = `일본 밴드 ${ARTIST.name.jp}(${ARTIST.name.en})의 비공식 팬페이지입니다. 공식 응원도구인 샤모지를 활용한 응원 가이드, 음원 DB·공연 아카이브 등 다양한 정보를 제공합니다.`;

/** 운영자가 정한 저작권 문구 그대로 — PC 푸터와 출처 페이지에 쓴다. */
export const COPYRIGHT_NOTICE = `본 사이트는 비공식 팬페이지로서, 별도 기재되지 않은 영상물·이미지의 저작권은 원 아티스트에게 있습니다. © 2026 ${ARTIST.name.jp}`;

/** 투명 여백을 잘라내고 표시 크기(최대 320px)의 2배 넘게 줄여 둔 로고 —
 * output: "export"라 next/image가 리사이즈해 주지 않는다. */
export const LOGO = {
  src: "/assets/logo/ztmy-sounds-logo.webp",
  width: 720,
  height: 324,
  alt: SITE_BRAND,
};
