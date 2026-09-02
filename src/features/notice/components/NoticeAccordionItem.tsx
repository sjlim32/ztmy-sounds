"use client";

import { cn } from "@/lib/utils";
import type { Notice } from "@/features/notice/lib/types";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { accentBarStyles } from "@/features/guide/components/list-entrance";

interface NoticeAccordionItemProps {
  notice: Notice;
  isOpen: boolean;
  onToggle: () => void;
  isDismissed: boolean;
  /** always-open 항목일 때만 전달됨 — 체크박스 노출 여부를 결정 */
  onDismissChange?: (dismissed: boolean) => void;
}

export function NoticeAccordionItem({
  notice,
  isOpen,
  onToggle,
  isDismissed,
  onDismissChange,
}: NoticeAccordionItemProps) {
  const Content = notice.content;

  return (
    <div
      data-role="notice-item"
      // 모바일: 박스 없는 flat한 행(전체 화면에 GuideDimOverlay가 이미
      // bg-black/50을 깔아줘서 항목별 배경이 따로 필요 없음, SongList
      // 항목과 동일한 톤). tablet 이상: 기존 카드 박스 유지.
      className={cn(
        "w-full overflow-hidden",
        "tablet:rounded-sm tablet:bg-black/50",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group relative flex w-full flex-col gap-1.5 text-left focus-visible:outline-none",
          "tablet:px-4 tablet:py-3",
        )}
      >
        <span
          className={cn(accentBarStyles({ selected: isOpen }), "tablet:hidden")}
        />

        <span className="flex items-center justify-between">
          <span
            className={cn(
              "px-6 font-mono text-[10px] font-medium tracking-[0.3em] uppercase",
              "tablet:px-0",
              notice.isAlwaysOpen ? "text-ztmy-pink" : "text-white/40",
            )}
          >
            {notice.isAlwaysOpen ? "Notice" : "Guide"}
          </span>
          <ChevronDownIcon
            className={cn(
              "h-3 w-3 shrink-0 text-white/40 transition-transform group-hover:text-white/70",
              !isOpen && "rotate-180",
            )}
          />
        </span>

        <span
          className={cn(
            "transi px-6 text-base leading-tight font-bold tracking-tight",
            "tablet:text-2xl tablet:px-0",
            isOpen ? "text-white/60" : "text-white",
          )}
        >
          {notice.title}
        </span>

        <span className="relative block h-px w-full overflow-hidden bg-white/15">
          <span
            className={cn(
              "from-ztmy-pink to-ztmy-purple absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-linear-to-r transition-transform duration-500 ease-out",
              isOpen ? "scale-x-100" : "group-hover:scale-x-100",
            )}
          />
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "space-y-3 border-b border-white/10 px-2 pb-4 text-sm leading-relaxed [&_strong]:text-white",
              "tablet:px-4 tablet:text-lg tablet:border-b-0",
            )}
          >
            <Content />

            {onDismissChange && (
              <label className="flex items-center gap-1.5 text-xs text-white/50">
                <input
                  type="checkbox"
                  checked={isDismissed}
                  onChange={(event) => onDismissChange(event.target.checked)}
                  className="accent-ztmy-purple h-3 w-3"
                />
                다시 열지 않기
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
