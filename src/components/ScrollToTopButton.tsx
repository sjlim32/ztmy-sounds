"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";

const SCROLL_THRESHOLD = 300;
// 스크롤이 맨 아래에서 이만큼(px) 안쪽이면 내용 끝의 Footer가 보이는 상태.
const FOOTER_ZONE = 72;

/**
 * 스크롤 컨테이너(containerId)를 맨 위로 올리는 떠 있는 버튼. 평소엔 화면
 * 오른쪽 아래 구석에 붙어 있다가, 맨 아래까지 내려가 Footer가 보이면 그걸
 * 가리지 않게 위로 비켜선다 — 항상 Footer 높이만큼 띄워두면 평소에 허공에
 * 떠 보인다.
 */
export function ScrollToTopButton({ containerId }: { containerId: string }) {
  const [visible, setVisible] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const handleScroll = () => {
      setVisible(container.scrollTop > SCROLL_THRESHOLD);
      setNearBottom(
        container.scrollHeight - container.scrollTop - container.clientHeight <
          FOOTER_ZONE,
      );
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerId]);

  const scrollToTop = () => {
    document
      .getElementById(containerId)
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="맨 위로"
      tabIndex={visible ? 0 : -1}
      className={cn(
        // 하단 여백에 iOS 홈 표시줄 영역을 더한다(docs/RULES.md 참고)
        "shadow-[0_4px_16px_rgba(255, 255, 255, 0.6)] fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/60 text-black backdrop-blur-sm",
        "hover:bg-ztmy-purple transition duration-200 hover:text-white",
        "tablet:bottom-6 tablet:h-10 tablet:w-10",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
        nearBottom && "-translate-y-14",
      )}
    >
      <ChevronDownIcon className="tablet:h-6 tablet:w-6 h-5 w-5 rotate-180" />
    </button>
  );
}
