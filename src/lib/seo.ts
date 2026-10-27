import { ARTIST } from "@/data/artist";

export const SITE_URL = "https://ztmy-sounds.fans";

export const SITE_NAME = `${ARTIST.name.kr} FAN PAGE`;

/** 로고에 적힌 사이트 브랜드명 — 도메인(ztmy-sounds)과 같은 이름. */
export const SITE_BRAND = "ZTMY SOUNDS";

/** 메인 화면 로고 아래 한 줄 소개. */
export const SITE_TAGLINE = "계속 한밤 중이면 좋을텐데 팬페이지";

export const SITE_DESCRIPTION = `일본 밴드 ${ARTIST.name.jp}(${ARTIST.name.en})의 비공식 팬페이지입니다. 공식 응원도구인 샤모지를 활용한 콜가이드, 음원·공연 아카이브 등 다양한 정보를 제공합니다.`;

/** 운영자가 정한 저작권 문구 그대로 — PC 푸터와 출처 페이지에 쓴다. */
export const COPYRIGHT_NOTICE = `본 사이트는 비공식 팬 페이지로서, 모든 영상·이미지의 저작권은 아티스트에게 있습니다. © 2026 ${ARTIST.name.jp}`;

/** 투명 여백을 잘라내고 표시 크기(최대 320px)의 2배 넘게 줄여 둔 로고 —
 * output: "export"라 next/image가 리사이즈해 주지 않는다. */
export const LOGO = {
  src: "/assets/logo/ztmy-sounds-logo.webp",
  width: 720,
  height: 324,
  alt: SITE_BRAND,
};
