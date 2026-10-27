"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { ARTIST } from "@/data/artist";
import { FOOTER_SOCIAL_LINKS } from "@/data/social-links";
import { FOCUS_RING, NAV_BUTTON_CLASS } from "@/components/button-styles";

const TALLY_FORM_ID = "814rXx";

// 푸터용 컴팩트 버튼(이동 버튼 스타일을 작게). 푸터는 컴팩트해야 해서 "버튼
// 글자는 text-sm부터" 규칙의 예외로 text-xs를 쓴다(docs/CONVENTIONS.md).
const FOOTER_BUTTON_CLASS = cn(NAV_BUTTON_CLASS, "h-7 px-2.5 text-xs");

// 자기 스크롤 영역 안에 Footer를 직접 넣는 페이지들 — 루트 레이아웃의 전역
// 인스턴스(placement 기본값, inline=false)는 이 경로들에서 대신 자기 자신을
// 숨긴다. 그렇지 않으면 앱 셸(overflow-hidden 고정 레이아웃, 자세한 배경은
// ZutopiaScrollArea 주석 참고)의 children 래퍼 바로 뒤에 항상 렌더링되는
// 루트 Footer가, 그 페이지의 실제 스크롤 콘텐츠와 무관하게 화면 하단에
// 고정된 것처럼 보인다 — 콘텐츠가 짧아도 항상 뷰포트 맨 아래, 콘텐츠가
// 길어도 스크롤과 상관없이 항상 뷰포트 맨 아래에 떠 있는 문제.
//
// <Footer inline />의 유일한 호출부는 PageScrollBody.tsx다 — 이 배열은 그
// PageScrollBody를 쓰는 페이지들의 경로 prefix와 수동으로 동기화해야 한다.
// 새 페이지에서 PageScrollBody를 쓰기 시작하면 그 경로 prefix를 여기에도
// 반드시 추가해야 하고(안 그러면 루트 Footer와 이중 렌더), 반대로 여기서
// prefix를 지우면 그 페이지도 PageScrollBody 사용을 그만둬야 한다(안
// 그러면 footer가 아예 안 뜸). 현재 PageScrollBody 사용처: ZutopiaScrollArea,
// app/(pages)/info/page.tsx, app/(pages)/credits/page.tsx.
const SELF_MANAGED_FOOTER_PREFIXES = ["/zutopia", "/info", "/credits"];

/**
 * 전역 푸터 — 왼쪽에 공식 링크·저작권 문구, 오른쪽 구석에 건의·출처 버튼.
 * 노래 가사 페이지(/guide/[songId])는 화면을 전부 가사에 쓰므로 표시하지 않고,
 * PC(tablet 이상)에서는 메인 화면(/)에서만 보인다 — 다른 페이지는 PC에서
 * 콘텐츠 영역을 넓게 쓰도록.
 *
 * inline=true는 PageScrollBody.tsx가 자기 스크롤 컨테이너 안에서 직접
 * 렌더링할 때 쓴다 — 그 경로 자신이 바로 SELF_MANAGED_FOOTER_PREFIXES가
 * 가리키는 예외이므로, 그 숨김 규칙을 적용하지 않는다. PageScrollBody가
 * 콘텐츠를 `flex min-h-full flex-col` wrapper로 감싸서, 콘텐츠가 짧으면
 * 화면 하단에 고정되고 콘텐츠가 길어지면 그 뒤로 밀려난다.
 */
export function Footer({ inline = false }: { inline?: boolean } = {}) {
  const pathname = usePathname();
  const footerRef = useRef<HTMLElement>(null);

  // 화면 왼쪽 아래에 떠 있는 설치·공유 버튼(InstallShareBar)이 푸터 바로 위에
  // 오도록 푸터 높이를 --footer-height로 알려준다. 숨겨져 있거나(display:none)
  // 렌더링되지 않으면 0.
  useEffect(() => {
    const root = document.documentElement;
    const el = footerRef.current;
    if (!el) {
      root.style.setProperty("--footer-height", "0px");
      return;
    }
    const observer = new ResizeObserver(() =>
      root.style.setProperty("--footer-height", `${el.offsetHeight}px`),
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty("--footer-height", "0px");
    };
  }, [pathname]);

  if (pathname.startsWith("/guide/")) return null;
  if (
    !inline &&
    SELF_MANAGED_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }
  const isHome = pathname === "/";

  return (
    // 일반적인 사이트 푸터: 위 콘텐츠와 경계선 + 어두운 배경 띠로 구분
    // (zutomayocalendar.net 푸터 참고). 왼쪽에 공식 링크 줄 → 저작권 문구,
    // 오른쪽 구석에 건의·출처, 컴팩트.
    <footer
      ref={footerRef}
      className={cn(
        "shrink-0 border-t border-white/15 bg-black/70 backdrop-blur-md",
        !isHome && "tablet:hidden",
      )}
    >
      {/* 왼쪽: 공식 링크 + 저작권 문구 / 오른쪽 구석: 건의·출처. 모바일은 위아래로 */}
      <div
        className={cn(
          "flex flex-col gap-2 px-4 py-3",
          "tablet:flex-row tablet:items-end tablet:justify-between tablet:gap-6 tablet:px-8",
        )}
      >
        <div className="flex min-w-0 flex-col items-start gap-2">
          <nav aria-label="공식 링크" className="flex items-center gap-2">
            {FOOTER_SOCIAL_LINKS.map(({ name, url, icon }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={name}
                className={cn(
                  "opacity-85 transition-opacity hover:opacity-100",
                  FOCUS_RING,
                )}
              >
                <Image
                  src={icon.src}
                  alt={name}
                  width={Math.round(icon.width / 2)}
                  height={Math.round(icon.height / 2)}
                />
              </a>
            ))}
          </nav>

          {/* 저작권 표기 — 문구는 운영자가 정한 그대로. PC에선 한 줄 고정
              (모바일은 화면 폭보다 길어서 줄바꿈 허용) */}
          <p
            className={cn(
              "text-xs leading-relaxed break-keep text-white/60",
              "tablet:whitespace-nowrap",
            )}
          >
            본 사이트는 비공식 팬 페이지로서, 사이트 내의 모든
            음원·영상·이미지의 저작권은 아티스트에게 있습니다. © 2026{" "}
            {ARTIST.name.jp}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* 건의(모바일은 폼 페이지로, PC는 팝업으로 연다)·출처 */}
          <a
            href={`https://tally.so/r/${TALLY_FORM_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(FOOTER_BUTTON_CLASS, "tablet:hidden")}
          >
            건의
          </a>
          <button
            type="button"
            data-tally-open={TALLY_FORM_ID}
            data-tally-emoji-text="👋"
            data-tally-emoji-animation="wave"
            className={cn(FOOTER_BUTTON_CLASS, "hidden", "tablet:inline-flex")}
          >
            건의
          </button>
          <Link href="/credits" className={FOOTER_BUTTON_CLASS}>
            출처
          </Link>
        </div>
      </div>

      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
      />
    </footer>
  );
}
