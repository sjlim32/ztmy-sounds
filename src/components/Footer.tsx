"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { ARTIST } from "@/data/artist";
import {
  SOCIAL_PLATFORM_ICON,
  type SocialPlatform,
} from "@/lib/social-platform";
import { cn } from "@/lib/utils";

type SocialLink = {
  name: string;
  url: string;
  platform: SocialPlatform;
};

const SOCIAL_LINKS: SocialLink[] = [
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

const TALLY_FORM_ID = "814rXx";

/**
 * 전역 저작권 푸터. 고정/sticky가 아니라 각 페이지 콘텐츠 맨 아래에
 * 일반 흐름으로 붙습니다.
 * 노래 가사 페이지(/guide/[songId])는 화면을 전부 가사에 쓰므로 표시하지 않습니다.
 */
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/guide/")) return null;

  return (
    <footer
      className={cn(
        "flex flex-col items-center gap-2 border-t border-white/10 px-3 py-2 text-center text-xs text-white/50",
        "tablet:items-end tablet:border-t-0 tablet:text-end tablet:text-gray-300 tablet:text-base",
      )}
    >
      <p className="tablet:border-b tablet:border-gray-500 tablet:pb-1 tablet:tracking-[0.4rem] tablet:max-w-100 w-full tracking-widest">
        ©{ARTIST.name.jp}
        <span className="tablet:hidden"> Fan Page · </span>
        <span>2026</span>
      </p>

      <div className="tablet:gap-4 flex flex-nowrap items-center justify-center gap-3">
        <a
          href={`https://tally.so/r/${TALLY_FORM_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:border-ztmy-magenta/60 tablet:hidden rounded-full border border-white/15 bg-black/40 px-4 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          사이트 건의
        </a>
        <button
          type="button"
          data-tally-open={TALLY_FORM_ID}
          data-tally-emoji-text="👋"
          data-tally-emoji-animation="wave"
          className="hover:border-ztmy-magenta/60 hidden rounded-full border border-white/15 bg-black/40 px-4 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none tablet:inline-block"
        >
          사이트 건의
        </button>

        <span className="tablet:inline-block hidden font-mono text-[10px] font-medium tracking-[0.3em] text-white/40 uppercase">
          Official Link
        </span>
        <nav className="flex items-center gap-4 tablet:gap-6">
          {SOCIAL_LINKS.map(({ name, url, platform }) => {
            const Icon = SOCIAL_PLATFORM_ICON[platform];
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="hover:text-ztmy-purple transition-colors"
              >
                <Icon className={cn("h-4 w-4", "tablet:h-6 tablet:w-6")} />
              </a>
            );
          })}
        </nav>
      </div>

      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
      />
    </footer>
  );
}
