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
