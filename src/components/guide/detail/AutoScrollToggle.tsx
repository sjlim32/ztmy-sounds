"use client";

import clsx from "clsx";
import { useAutoScrollPreference } from "@/lib/guide/auto-scroll";
import { AutoScrollStatusIcon } from "@/components/guide/detail/AutoScrollStatusIcon";

export function AutoScrollToggle() {
  const [autoScroll, setAutoScroll] = useAutoScrollPreference();

  return (
    <button
      type="button"
      onClick={() => setAutoScroll(!autoScroll)}
      aria-pressed={autoScroll}
      title="자동 스크롤"
      className="absolute right-0 bottom-0 flex items-center gap-2 rounded-full bg-black/40 py-1.5 pr-1.5 pl-3 backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      <span className="text-[11px] font-semibold tracking-wider text-white/80">
        AUTO SCROLL
      </span>
      <span
        className={clsx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300",
          autoScroll ? "bg-ztmy-purple" : "bg-white/15",
        )}
      >
        <AutoScrollStatusIcon active={autoScroll} />
      </span>
    </button>
  );
}
