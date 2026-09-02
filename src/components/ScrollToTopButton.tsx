"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";

const SCROLL_THRESHOLD = 300;

export function ScrollToTopButton({ containerId }: { containerId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const handleScroll = () => {
      setVisible(container.scrollTop > SCROLL_THRESHOLD);
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
        "shadow-[0_4px_16px_rgba(255, 255, 255, 0.6)] fixed right-4 bottom-18 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/60 text-black backdrop-blur-sm",
        "hover:bg-ztmy-purple transition duration-200 hover:text-white",
        "tablet:bottom-20 tablet:h-10 tablet:w-10",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ChevronDownIcon className="tablet:h-6 tablet:w-6 h-5 w-5 rotate-180" />
    </button>
  );
}
