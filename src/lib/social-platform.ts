import type { ComponentType } from "react";
import { GlobeIcon } from "@/components/icons/GlobeIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { XIcon } from "@/components/icons/XIcon";
import { SpotifyIcon } from "@/components/icons/SpotifyIcon";

export const SOCIAL_PLATFORMS = [
  "web",
  "youtube",
  "instagram",
  "x",
  "spotify",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/**
 * 소셜 플랫폼 키 → 아이콘 매핑. info 안내(INFORMATION) 등이 같은 키로 이 매핑을
 * 공유합니다(홈 공식 링크 묶음은 OFFICIAL_ICON_LINKS의 이미지 아이콘을 따로 씀).
 */
export const SOCIAL_PLATFORM_ICON: Record<
  SocialPlatform,
  ComponentType<{ className?: string }>
> = {
  web: GlobeIcon,
  youtube: YouTubeIcon,
  instagram: InstagramIcon,
  x: XIcon,
  spotify: SpotifyIcon,
};
