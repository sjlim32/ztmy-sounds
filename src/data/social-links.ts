import type { SocialPlatform } from "@/lib/social-platform";

export type SocialLink = {
  name: string;
  url: string;
  platform: SocialPlatform;
};

export const SOCIAL_LINKS: SocialLink[] = [
  { name: "OFFICIAL WEB", url: "https://zutomayo.net", platform: "web" },
  {
    name: "YOUTUBE",
    url: "https://www.youtube.com/channel/UCv6P5nsS9rP4tDtFlqLU_QQ",
    platform: "youtube",
  },
  {
    name: "INSTAGRAM",
    url: "https://www.instagram.com/zutomayo",
    platform: "instagram",
  },
  { name: "X", url: "https://x.com/zutomayo", platform: "x" },
  {
    name: "SPOTIFY",
    url: "https://open.spotify.com/artist/38WbKH6oKAZskBhqDFA8Uj?si=FaQ7gjMSQHyhYYjvebzajg",
    platform: "spotify",
  },
];

export type FooterSocialLink = {
  name: string;
  url: string;
  /** 푸터에 그대로 쓰는 아이콘 이미지(높이 48px 원본, 화면엔 24px로 표시) */
  icon: { src: string; width: number; height: number };
};

/**
 * 푸터 공식 링크 — zutomayocalendar.net 푸터와 같은 구성·아이콘 이미지(유튜브,
 * X 메인·스태프, 인스타그램 메인·스태프·mart). 위 SOCIAL_LINKS는 검색엔진용
 * 구조화 데이터(sameAs)에도 쓰여서 따로 둔다.
 */
export const FOOTER_SOCIAL_LINKS: FooterSocialLink[] = [
  {
    name: "YouTube",
    url: "https://www.youtube.com/channel/UCv6P5nsS9rP4tDtFlqLU_QQ",
    icon: { src: "/assets/footer/youtube.png", width: 47, height: 48 },
  },
  {
    name: "X (메인)",
    url: "https://x.com/zutomayo",
    icon: { src: "/assets/footer/x-main.png", width: 59, height: 48 },
  },
  {
    name: "X (스태프)",
    url: "https://x.com/zutomayo_staff",
    icon: { src: "/assets/footer/x-staff.png", width: 59, height: 48 },
  },
  {
    name: "Instagram (메인)",
    url: "https://www.instagram.com/zutomayo/",
    icon: { src: "/assets/footer/instagram-main.png", width: 59, height: 48 },
  },
  {
    name: "Instagram (스태프)",
    url: "https://www.instagram.com/zutomayo_staff/",
    icon: { src: "/assets/footer/instagram-staff.png", width: 59, height: 48 },
  },
  {
    name: "Instagram (mart)",
    url: "https://www.instagram.com/zutomayo_mart/",
    icon: { src: "/assets/footer/instagram-mart.png", width: 59, height: 48 },
  },
];
