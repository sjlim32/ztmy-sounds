"use client";

import type { ReactNode } from "react";
import { EntranceFade } from "@/components/EntranceFade";
import { PageScrollBody } from "@/components/PageScrollBody";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { cn } from "@/lib/utils";
import { useScrollFadeMask } from "@/lib/use-scroll-fade-mask";

/**
 * /zutopia 최상위 스크롤 컨테이너. layout.tsx는 metadata를 export해야 해서
 * 서버 컴포넌트로 남겨두고, ref를 붙여야 하는 실제 스크롤 박스만 이
 * 클라이언트 컴포넌트로 분리했습니다 — /info, /guide와 동일한 스크롤
 * 페이드 처리.
 */
// 아래 <main>의 id이자 ScrollToTopButton이 스크롤을 지켜볼 대상.
const ZUTOPIA_SCROLL_CONTAINER_ID = "zutopia-scroll-container";

export function ZutopiaScrollArea({ children }: { children: ReactNode }) {
  const scrollRef = useScrollFadeMask<HTMLElement>();

  return (
    <>
      {/* <main> 안에 두면 안 된다 — 스크롤 페이드용 mask가 걸린 요소는 자손의
          position:fixed 기준이 되어(SongDbDrawer 주석 참고), 버튼이 화면이
          아니라 스크롤 내용에 붙어 같이 올라가 버린다. */}
      <ScrollToTopButton containerId={ZUTOPIA_SCROLL_CONTAINER_ID} />

      <main
        id={ZUTOPIA_SCROLL_CONTAINER_ID}
        ref={scrollRef}
        className={cn(
          "min-h-0 w-full flex-1 overflow-y-auto scroll-smooth",
          "scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
        )}
      >
        <PageScrollBody
          innerClassName={cn(
            "mx-auto w-full px-3 pt-6 pb-10",
            "tablet:max-w-4xl tablet:px-6 tablet:py-16",
          )}
        >
          <EntranceFade>{children}</EntranceFade>
        </PageScrollBody>
      </main>
    </>
  );
}
