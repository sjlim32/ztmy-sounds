"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { ARTIST } from "@/data/artist";
import { COPYRIGHT_NOTICE } from "@/lib/seo";
import { getFeedbackUrl, TALLY_FORM_ID } from "@/lib/feedback";
import { NAV_BUTTON_CLASS } from "@/components/button-styles";
import { InstallButton } from "@/components/InstallButton";
import { ShareButton } from "@/components/ShareButton";
import { OfficialLinks } from "@/components/OfficialLinks";

// 푸터용 컴팩트 버튼(이동 버튼 스타일을 작게). 푸터는 컴팩트해야 해서 "버튼
// 글자는 text-sm부터" 규칙의 예외로 text-xs를 쓴다(docs/CONVENTIONS.md).
const FOOTER_BUTTON_CLASS = cn(NAV_BUTTON_CLASS, "h-7 px-2.5 text-xs");
const FOOTER_ICON_BUTTON_CLASS = "h-7 w-7";

/**
 * 사이트 푸터. 배경 띠 없이 글자 그림자만 줘서 홈 배경 그림 위에 다른
 * 요소들처럼 떠 있게 한다.
 * - 태블릿 이상(한 줄): 왼쪽에 저작권 문구 전문 + 공식 링크 아이콘, 오른쪽에
 *   사이트 기능 버튼 묶음 [설치][공유] | [건의][출처].
 * - 모바일(두 줄): 공식 링크 아이콘 줄, 그 아래 줄인 저작권 문구 + 출처 글자
 *   링크 + 건의 버튼. 공유는 상단 바(MobileHeader)에, 설치는 상단 배너
 *   (InstallPromptBanner)에 있다.
 *
 * 어디에 뜨나: 루트 레이아웃의 인스턴스는 메인 화면(/)에서만 그린다.
 * 스크롤 페이지(/info, /credits, /zutopia)는 PageScrollBody가 자기 스크롤
 * 끝에 inline으로 붙이고, 이건 모바일에서만 보인다(PC는 콘텐츠를 넓게 쓰도록).
 * 가이드·슬램 화면엔 없다 — 목록·가사가 화면 높이를 다 쓴다.
 */
export function Footer({ inline = false }: { inline?: boolean } = {}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  if (!inline && !isHome) return null;

  return (
    <footer
      className={cn(
        "shrink-0",
        !isHome && "tablet:hidden",
        // 화면이 700px 이하로 낮으면 홈 PC 화면의 공연 카드·곡 카드와 겹쳐서
        // 숨긴다(모바일은 푸터가 흐름 안에 있어 겹치지 않는다).
        "tablet:xlow:hidden",
      )}
    >
      <OfficialLinks
        className={cn("flex justify-center px-4 pt-2", "tablet:hidden")}
      />
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-2",
          "tablet:px-10 tablet:py-3",
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          <p
            className={cn(
              "min-w-0 truncate text-xs text-white/60 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]",
              // 태블릿 폭에선 전문이 한 줄에 안 들어가서 줄바꿈을 허용한다.
              "tablet:whitespace-normal tablet:break-keep",
            )}
          >
            {/* 모바일은 화면을 적게 차지하도록 줄인 문구 — 전문은 출처 페이지에도 있다. */}
            <span className="tablet:hidden">
              비공식 팬 페이지 · © {ARTIST.name.en} ·{" "}
              <Link
                href="/credits"
                className="underline underline-offset-2 transition-colors hover:text-white"
              >
                출처
              </Link>
            </span>
            <span className={cn("hidden", "tablet:inline")}>
              {COPYRIGHT_NOTICE}
            </span>
          </p>
          <OfficialLinks
            className={cn("hidden", "tablet:block tablet:shrink-0")}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div
            className={cn(
              "hidden",
              "tablet:flex tablet:items-center tablet:gap-1.5",
            )}
          >
            <InstallButton className={FOOTER_ICON_BUTTON_CLASS} />
            <ShareButton className={FOOTER_ICON_BUTTON_CLASS} />
            <span aria-hidden className="mx-1 h-4 w-px bg-white/20" />
          </div>

          {/* 건의: 모바일은 폼 페이지로, 태블릿 이상은 팝업으로 연다. */}
          <a
            href={getFeedbackUrl()}
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
          <Link
            href="/credits"
            className={cn(FOOTER_BUTTON_CLASS, "hidden", "tablet:inline-flex")}
          >
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
