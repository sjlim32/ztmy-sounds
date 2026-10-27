import { ARTIST } from "@/data/artist";

export const SITE_URL = "https://ztmy-sounds.fans";

export const SITE_NAME = `${ARTIST.name.kr} FAN PAGE`;

/** 로고에 적힌 사이트 브랜드명 — 도메인(ztmy-sounds)과 같은 이름. */
export const SITE_BRAND = "ZTMY SOUNDS";

export const SITE_DESCRIPTION = `일본 밴드 ${ARTIST.name.jp}(${ARTIST.name.en})의 비공식 팬페이지. 공식 응원도구인 샤모지를 활용한 콜가이드를 제공 중 입니다.`;

/** 투명 여백을 잘라내고 표시 크기(최대 288px)의 2.5배로 줄여 둔 로고 —
 * output: "export"라 next/image가 리사이즈해 주지 않는다. */
export const LOGO = {
  src: "/assets/logo/ztmy-sounds-logo.webp",
  width: 720,
  height: 324,
  alt: SITE_BRAND,
};
