"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollFadeMask } from "@/lib/use-scroll-fade-mask";

/**
 * /zutopia 최상위 스크롤 컨테이너. layout.tsx는 metadata를 export해야 해서
 * 서버 컴포넌트로 남겨두고, ref를 붙여야 하는 실제 스크롤 박스만 이
 * 클라이언트 컴포넌트로 분리했습니다 — /info, /guide와 동일한 스크롤
 * 페이드 처리.
 */
export function ZutopiaScrollArea({ children }: { children: ReactNode }) {
  const scrollRef = useScrollFadeMask<HTMLElement>();

  return (
    <main
      ref={scrollRef}
      className={cn(
        "min-h-0 w-full flex-1 overflow-y-auto scroll-smooth",
        "scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
        "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
        "mx-auto px-3 pt-6 pb-10",
        "tablet:max-w-4xl tablet:px-6 tablet:py-16",
      )}
    >
      {children}
    </main>
  );
}
