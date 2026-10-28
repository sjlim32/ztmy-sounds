"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LOGO } from "@/lib/seo";
import {
  FOCUS_RING,
  GHOST_ICON_BUTTON_CLASS,
} from "@/components/button-styles";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { findSitePage } from "@/components/site-pages";
import { InfoTabs } from "@/features/info/components/InfoTabs";
import { ZutopiaHeaderNav } from "@/features/zutopia/components/ZutopiaHeaderNav";

/**
 * 하위 페이지(응원 가이드·슬램 가이드·공연 정보·즛토피아) 공용 헤더.
 * 메인(/)과 출처(/credits)에는 없다.
 *
 * - 태블릿 이상: 왼쪽 [로고 │ 페이지 이름] + 오른쪽에 그 페이지 전용
 *   내비게이션. 로고는 메인으로, 페이지 이름은 그 페이지 첫 화면으로 가는
 *   링크라 본문에 따로 "홈으로"·"뒤로가기" 버튼을 두지 않는다. 페이지 이름은
 *   최상위 이름만 쓴다 — 그 안의 위치(곡/앨범/공연, 탭)는 오른쪽 탭이 알려준다.
 * - 모바일: 전역 상단 바(MobileHeader)가 있어서 로고 줄은 그리지 않고,
 *   페이지 전용 내비게이션이 있을 때만 상단 바 바로 아래 한 줄로 보여준다.
 *
 * 페이지 전용 내비게이션(getPageNavKind):
 * - 가이드·슬램: 없음
 * - 공연 정보: 본문 탭(투어 일정·공연 지도·…)
 * - 즛토피아: 첫 화면엔 없음, 곡·앨범·공연 안으로 들어가면 구역 이동
 */
export function SiteHeader() {
  const pathname = usePathname();
  const page = findSitePage(pathname);
  if (!page || page.headerless) return null;

  const navKind = getPageNavKind(pathname);
  const back = getBackTarget(pathname);

  return (
    <>
      <header
        className={cn(
          "hidden shrink-0 items-center justify-between gap-6 border-b border-white/10 bg-black/40 px-10 backdrop-blur-md",
          `tablet:flex ${SITE_HEADER_HEIGHT_CLASS}`,
        )}
      >
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/"
            aria-label="메인으로"
            className={cn("shrink-0 rounded-md", FOCUS_RING)}
          >
            {/* 로고 글자가 남색이라 어두운 배경에 묻혀서 메인 Header처럼 흰
          테두리를 두른다. */}
            <Image
              src={LOGO.src}
              alt={LOGO.alt}
              width={LOGO.width}
              height={LOGO.height}
              preload
              className="h-10 w-auto [filter:drop-shadow(0.5px_0_0_#fff)_drop-shadow(-0.5px_0_0_#fff)_drop-shadow(0_0.5px_0_#fff)_drop-shadow(0_-0.5px_0_#fff)]"
            />
          </Link>
          {page && (
            <>
              <span aria-hidden className="h-5 w-px bg-white/20" />
              {/* 뒤로가기는 로고가 아니라 페이지 이름 앞에 둔다 — 로고는 어느
              하위 페이지든 같은 자리에 고정되고, 뒤로가기("이 페이지 안에서 한
              단계 위")는 페이지 이름과 한 덩어리로 읽힌다. 헤더의 다른 요소처럼
              면·테두리 없이 화살표만(공용 GHOST_ICON_BUTTON_CLASS). */}
              <div className={cn("flex items-center gap-1", back && "-ml-1")}>
                {back && (
                  <Link
                    href={back.href}
                    aria-label={back.label}
                    title={back.label}
                    className={cn(GHOST_ICON_BUTTON_CLASS, "group h-8 w-8")}
                  >
                    <ChevronLeftIcon className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                  </Link>
                )}
                <Link
                  href={page.href}
                  aria-current={pathname === page.href ? "page" : undefined}
                  className={cn(
                    "rounded-md text-base font-semibold whitespace-nowrap text-white transition-colors hover:text-white/70",
                    FOCUS_RING,
                  )}
                >
                  {page.label}
                </Link>
              </div>
            </>
          )}
        </div>
        {navKind && (
          <div className="h-full min-w-0 overflow-x-auto">
            <PageNav kind={navKind} />
          </div>
        )}
      </header>

      {navKind && (
        <div
          className={cn(
            "h-11 shrink-0 scrollbar-none overflow-x-auto border-b border-white/10 bg-black/40 px-4 backdrop-blur-md",
            "tablet:hidden",
          )}
        >
          <PageNav kind={navKind} className="w-max" />
        </div>
      )}
    </>
  );
}

/**
 * 태블릿 이상 헤더 높이. 가이드·슬램은 목록·가사 패널 높이를 화면 높이에서
 * 이 값을 빼서 정한다(SongPanel, GuideMainScrollArea, player-layout.ts의
 * calc(94vh-4rem)) — 바꾸면 거기도 같이 바꾼다.
 */
const SITE_HEADER_HEIGHT_CLASS = "tablet:h-16";

/**
 * 헤더 페이지 이름 앞 뒤로가기 — 브라우저 기록이 아니라 주소를 한 단계 올라간다
 * (링크로 바로 들어와도 엉뚱한 곳으로 가지 않게). 공연 상세 → 공연 목록,
 * 곡·앨범·공연 목록 → ZUTOPIA 첫 화면, 가이드·슬램 곡 상세 → 곡 목록. 한 단계
 * 위가 메인(/)이면 로고와 같은 일이라 두지 않는다.
 */
function getBackTarget(
  pathname: string,
): { href: string; label: string } | null {
  const segments = pathname.split("/").filter(Boolean);
  segments.pop();
  if (segments.length === 0) return null;
  const href = `/${segments.join("/")}`;
  return { href, label: BACK_LABELS[href] ?? "이전 단계로 돌아가기" };
}

/** 뒤로가기 설명(마우스를 올리면 뜨는 문구·화면 읽기용) — 가는 곳 기준. */
const BACK_LABELS: Record<string, string> = {
  "/zutopia": "ZUTOPIA로 돌아가기",
  "/zutopia/lives": "공연 목록으로 돌아가기",
  "/guide": "응원 가이드 곡 목록으로 돌아가기",
  "/slam": "슬램 가이드 곡 목록으로 돌아가기",
};

type PageNavKind = "info" | "zutopia";

function getPageNavKind(pathname: string): PageNavKind | null {
  if (pathname.startsWith("/info")) return "info";
  // 즛토피아 첫 화면(/zutopia)은 카드로 구역을 고르므로 헤더 내비게이션이 없다.
  if (pathname.startsWith("/zutopia/")) return "zutopia";
  return null;
}

function PageNav({
  kind,
  className,
}: {
  kind: PageNavKind;
  className?: string;
}) {
  return kind === "info" ? (
    <InfoTabs className={className} />
  ) : (
    <ZutopiaHeaderNav className={className} />
  );
}
