"use client";

import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { ARTIST } from "@/data/artist";
import { GlobeIcon } from "@/components/icons/GlobeIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { XIcon } from "@/components/icons/XIcon";
import { SpotifyIcon } from "@/components/icons/SpotifyIcon";

type SocialLink = {
  name: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

const SOCIAL_LINKS: SocialLink[] = [
  { name: "OFFICIAL WEB", url: "https://zutomayo.net", icon: GlobeIcon },
  {
    name: "YOUTUBE",
    url: "https://www.youtube.com/channel/UCv6P5nsS9rP4tDtFlqLU_QQ",
    icon: YouTubeIcon,
  },
  {
    name: "INSTAGRAM",
    url: "https://www.instagram.com/zutomayo",
    icon: InstagramIcon,
  },
  { name: "X", url: "https://x.com/zutomayo", icon: XIcon },
  {
    name: "SPOTIFY",
    url: "https://open.spotify.com/artist/38WbKH6oKAZskBhqDFA8Uj?si=FaQ7gjMSQHyhYYjvebzajg",
    icon: SpotifyIcon,
  },
];

/**
 * 전역 저작권 푸터. 고정/sticky가 아니라 각 페이지 콘텐츠 맨 아래에
 * 일반 흐름으로 붙습니다.
 * 노래 가사 페이지(/guide/[songId])는 화면을 전부 가사에 쓰므로 표시하지 않습니다.
 */
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/guide/")) return null;

  return (
    <footer className="tablet:items-end tablet:border-t-0 tablet:text-end tablet:text-gray-300 flex flex-col items-center gap-2 border-t border-white/10 px-3 py-2 text-center text-xs text-white/50">
      {/* PC 이상은 Header가 이미 "Fan Page"를 표시하므로 저작권 표시만 남김 */}
      <p className="tablet:border-b tablet:border-gray-500 tablet:pb-1 tablet:tracking-[0.4rem] tracking-widest">
        © {ARTIST.name.jp}
        <span className="tablet:hidden"> Fan Page · </span>
        <span>2026</span>
      </p>

      <nav className="flex items-center gap-4">
        {SOCIAL_LINKS.map(({ name, url, icon: Icon }) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            className="hover:text-ztmy-purple transition-colors"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </nav>
    </footer>
  );
}
