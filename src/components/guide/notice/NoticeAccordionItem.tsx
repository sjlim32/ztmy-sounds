"use client";

import clsx from "clsx";
import type { Notice } from "@/lib/notice/types";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";

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
      className="w-full overflow-hidden rounded-xl bg-black/40 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-white"
      >
        <span className="flex-1">{notice.title}</span>
        <ChevronDownIcon
          className={clsx(
            "h-3 w-3 shrink-0 transition-transform",
            !isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={clsx(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4 text-sm text-white/70">
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
