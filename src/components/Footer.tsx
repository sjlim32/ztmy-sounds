"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { ARTIST } from "@/data/artist";
import { SOCIAL_LINKS } from "@/data/social-links";
import { SOCIAL_PLATFORM_ICON } from "@/lib/social-platform";
import { cn } from "@/lib/utils";

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
        "flex flex-col items-center border-t border-white/10 py-1 text-center text-[11px] text-white/50",
        "tablet:gap-1 tablet:items-end tablet:border-t-0 tablet:text-end tablet:px-3 tablet:text-white/40 tablet:text-xs",
      )}
    >
      <p className="tablet:tracking-[0.4rem] tracking-widest">
        ©{ARTIST.name.jp}
        <span className="tablet:hidden"> Fan Page · </span>
        <span>2026</span>
      </p>

      <div className="flex flex-nowrap items-center justify-center gap-3">
        <div className="flex gap-2">
          <a
            href={`https://tally.so/r/${TALLY_FORM_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "rounded-full border border-white/15 bg-black/40 px-4 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm",
              "tablet:hidden",
              "hover:border-ztmy-magenta/60 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
            )}
          >
            건의
          </a>
          <button
            type="button"
            data-tally-open={TALLY_FORM_ID}
            data-tally-emoji-text="👋"
            data-tally-emoji-animation="wave"
            className={cn(
              "hidden rounded-full border border-white/15 bg-black/40 px-3 py-0.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm",
              "tablet:inline-block",
              "hover:border-ztmy-magenta/60 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
            )}
          >
            건의
          </button>

          <Link
            href="/credits"
            className={cn(
              "rounded-full border border-white/15 bg-black/40 px-3 py-0.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm",
              "hover:border-ztmy-magenta/60 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
            )}
          >
            출처
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="tablet:inline-block hidden font-mono text-[10px] font-medium tracking-[0.3em] text-white/40 uppercase">
            Official Link
          </span>
          <nav className="flex items-center gap-3">
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
                  <Icon className={cn("h-3 w-3", "tablet:h-4 tablet:w-4")} />
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
      />
    </footer>
  );
}
