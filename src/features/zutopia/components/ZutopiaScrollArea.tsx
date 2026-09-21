"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useScrollFadeMask } from "@/lib/use-scroll-fade-mask";

/**
 * /zutopia 최상위 스크롤 컨테이너. layout.tsx는 metadata를 export해야 해서
 * 서버 컴포넌트로 남겨두고, ref를 붙여야 하는 실제 스크롤 박스만 이
 * 클라이언트 컴포넌트로 분리했습니다 — /info, /guide와 동일한 스크롤
 * 페이드 처리.
 *
 * 폭 제한(max-w-4xl)은 <main> 자신이 아니라 안쪽 래퍼 div에 준다 — Footer를
 * 이 스크롤 영역 맨 끝(콘텐츠 흐름을 그대로 따라가도록)에 넣되, 사이트
 * 전역에서처럼 화면 폭 전체를 쓰는 바(Footer.tsx 참고)로 유지하기 위함.
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
      )}
    >
      <div
        className={cn(
          "mx-auto px-3 pt-6 pb-10",
          "tablet:max-w-4xl tablet:px-6 tablet:py-16",
        )}
      >
        {children}
      </div>
      <Footer inline />
    </main>
  );
}
