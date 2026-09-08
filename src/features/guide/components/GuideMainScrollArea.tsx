"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollFadeMask } from "@/lib/use-scroll-fade-mask";

/**
 * tablet 이상에서 GuidePlayerArea + NoticePanel이 함께 스크롤되는 영역.
 * guide/layout.tsx와 slam/layout.tsx가 동일하게 씁니다.
 *
 * min-h-0/flex-1로 부모 flex row의 남은 높이를 물려받게 해봤지만, 실제로는
 * 이 요소가 늘 내용 높이만큼 자라버려서(overflow가 전혀 발생하지 않아)
 * overflow-y-auto도, 스크롤 페이드도 동작하지 않았습니다. 그래서 SongPanel과
 * 똑같이 뷰포트 기준 높이를 직접 지정해 확실히 잘리는 박스로 만듭니다 — 두
 * 컴포넌트가 같은 행(row)에서 나란히 있으니 높이 공식도 그대로 맞춥니다.
 */
export function GuideMainScrollArea({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const scrollRef = useScrollFadeMask<HTMLDivElement>();

  return (
    <div
      ref={scrollRef}
      className={cn(
        "contents",
        "tablet:flex tablet:min-w-0 tablet:flex-1 tablet:flex-col tablet:items-center tablet:justify-center-safe tablet:overflow-y-auto",
        "tablet:scrollbar-thin tablet:[scrollbar-color:transparent_transparent] tablet:hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
        "tablet:[&::-webkit-scrollbar]:w-1.5 tablet:[&::-webkit-scrollbar-thumb]:rounded-full tablet:[&::-webkit-scrollbar-thumb]:bg-transparent tablet:hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
        segment
          ? "tablet:h-[88vh]"
          : "tablet:h-[min(65vh,calc(140dvh-10rem))]",
      )}
    >
      {children}
    </div>
  );
}
