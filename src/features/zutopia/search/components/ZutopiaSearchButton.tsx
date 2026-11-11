"use client";

import { cn } from "@/lib/utils";
import { GHOST_BUTTON_CLASS } from "@/components/button-styles";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { openSearchDialog } from "./search-dialog-store";

/** 헤더의 검색 버튼 — 태블릿 이상은 "검색 /", 모바일은 돋보기만. */
export function ZutopiaSearchButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={openSearchDialog}
      aria-label={compact ? "통합 검색" : undefined}
      aria-haspopup="dialog"
      className={cn(
        GHOST_BUTTON_CLASS,
        compact
          ? "size-9 justify-center px-0"
          : "border border-white/15 bg-black/40 pr-1.5 hover:border-white/30",
      )}
    >
      <SearchIcon className="size-5" />
      {!compact && (
        <>
          검색
          <kbd
            aria-hidden
            className="ml-1 flex h-6 min-w-6 items-center justify-center rounded border border-white/20 px-1.5 font-mono text-sm text-white/55"
          >
            /
          </kbd>
        </>
      )}
    </button>
  );
}
