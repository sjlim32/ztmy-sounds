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
 * 소셜 플랫폼 키 → 아이콘 매핑. Footer(SOCIAL_LINKS)와 info 안내(INFORMATION)가
 * 같은 키를 써서 이 매핑 하나를 공유합니다.
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
