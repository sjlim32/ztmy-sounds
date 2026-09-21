"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { ARTIST } from "@/data/artist";
import { SOCIAL_LINKS } from "@/data/social-links";
import { SOCIAL_PLATFORM_ICON } from "@/lib/social-platform";
import { cn } from "@/lib/utils";

const TALLY_FORM_ID = "814rXx";

// 자기 스크롤 영역 안에 Footer를 직접 넣는 페이지들 — 루트 레이아웃의 전역
// 인스턴스(placement 기본값, inline=false)는 이 경로들에서 대신 자기 자신을
// 숨긴다. 그렇지 않으면 앱 셸(overflow-hidden 고정 레이아웃, 자세한 배경은
// ZutopiaScrollArea 주석 참고)의 children 래퍼 바로 뒤에 항상 렌더링되는
// 루트 Footer가, 그 페이지의 실제 스크롤 콘텐츠와 무관하게 화면 하단에
// 고정된 것처럼 보인다 — 콘텐츠가 짧아도 항상 뷰포트 맨 아래, 콘텐츠가
// 길어도 스크롤과 상관없이 항상 뷰포트 맨 아래에 떠 있는 문제.
const SELF_MANAGED_FOOTER_PREFIXES = ["/zutopia", "/info", "/credits"];

/**
 * 전역 저작권 푸터. 고정/sticky가 아니라 각 페이지 콘텐츠 맨 아래에
 * 일반 흐름으로 붙습니다.
 * 노래 가사 페이지(/guide/[songId])는 화면을 전부 가사에 쓰므로 표시하지 않습니다.
 *
 * inline=true는 페이지가 자기 스크롤 컨테이너 안에서 직접 렌더링할 때 쓴다
 * (ZutopiaScrollArea, info/credits 페이지) — 그 경로 자신이 바로
 * SELF_MANAGED_FOOTER_PREFIXES가 가리키는 예외이므로, 그 숨김 규칙을
 * 적용하지 않는다.
 */
export function Footer({ inline = false }: { inline?: boolean } = {}) {
  const pathname = usePathname();
  if (pathname.startsWith("/guide/")) return null;
  if (
    !inline &&
    SELF_MANAGED_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  return (
    <footer
      className={cn(
        "flex flex-col items-center gap-1 border-t border-white/10 py-1 text-center text-[10px] font-medium text-white/50",
        "tablet:items-end tablet:border-t-0 tablet:text-end tablet:px-3 tablet:text-white/40 tablet:text-xs",
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
              "rounded-full border border-white/15 bg-black/40 px-3 py-0.5 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur-sm",
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
              "rounded-full border border-white/15 bg-black/40 px-3 py-0.5 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur-sm",
              "hover:border-ztmy-magenta/60 tablet:text-xs transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
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
                  <Icon
                    className={cn("h-3.5 w-3.5", "tablet:h-4 tablet:w-4")}
                  />
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
