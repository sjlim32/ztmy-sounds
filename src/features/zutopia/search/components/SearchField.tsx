"use client";

import { useEffect } from "react";
import type { KeyboardEvent, Ref } from "react";
import { cn } from "@/lib/utils";
import { hasOpenModal } from "@/lib/open-modal";
import { GHOST_ICON_BUTTON_CLASS } from "@/components/button-styles";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";

const SEARCH_PLACEHOLDER = "곡·별명·앨범·공연 이름으로 검색";

/**
 * 즛토피아 통합 검색창 — 첫 화면(ZutopiaSearch)과 헤더 검색 창
 * (ZutopiaSearchDialog)이 같이 쓴다. 다른 입력칸보다 눈에 띄게 높이 56px,
 * 어두운 면, 누르면 마젠타 테두리. 비어 있을 땐 태블릿 이상에서 오른쪽에
 * 단축키("/") 안내를 띄운다. ×는 검색어를 지운다.
 */
export function SearchField({
  value,
  onChange,
  onClear,
  onFocus,
  onKeyDown,
  inputRef,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
}) {
  return (
    <div className="group relative">
      <SearchIcon className="group-focus-within:text-ztmy-magenta pointer-events-none absolute top-1/2 left-4 z-10 size-6 -translate-y-1/2 text-white/60 transition-colors" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={(event) => {
          // 모바일 키보드의 "검색" 키 — 결과는 이미 보이니 키보드만 내려 결과가 가리지 않게.
          if (event.key === "Enter" && !event.nativeEvent.isComposing)
            event.currentTarget.blur();
          onKeyDown?.(event);
        }}
        enterKeyHint="search"
        aria-label="곡·앨범·공연 검색"
        placeholder={SEARCH_PLACEHOLDER}
        className={cn(
          // 모바일 Safari는 16px 미만 입력란에 포커스하면 화면을 확대해서 text-base 이상.
          "tablet:text-lg h-14 w-full rounded-xl border-2 border-white/15 bg-black/60 pr-14 pl-13 text-base text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors placeholder:text-white/45 hover:border-white/30",
          "focus:border-ztmy-magenta/70 focus:ring-ztmy-magenta/15 focus:ring-4 focus:outline-none",
          // 브라우저 기본 지우기(×) 버튼 대신 아래 버튼을 쓴다.
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="검색어 지우기"
          className={cn(
            GHOST_ICON_BUTTON_CLASS,
            "absolute top-1/2 right-3 size-9 -translate-y-1/2",
          )}
        >
          <CloseIcon className="size-5" />
        </button>
      ) : (
        <kbd
          aria-hidden
          className="tablet:flex pointer-events-none absolute top-1/2 right-4 hidden h-7 min-w-7 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 px-2 font-mono text-sm text-white/55"
        >
          /
        </kbd>
      )}
    </div>
  );
}

/**
 * 검색 단축키 — "/"(입력 중이 아닐 때) 또는 ⌘K·Ctrl+K. 다른 창(aria-modal)이
 * 열려 있으면 그 창 몫으로 두고 부르지 않는다.
 */
export function useSearchShortcut(onTrigger: () => void) {
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const isCommandK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const target = event.target as HTMLElement | null;
      const typing = !!target?.closest?.(
        "input, textarea, select, [contenteditable=true]",
      );
      const isSlash =
        event.key === "/" &&
        !typing &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;
      if (!isCommandK && !isSlash) return;
      if (hasOpenModal()) return;
      event.preventDefault();
      onTrigger();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTrigger]);
}
