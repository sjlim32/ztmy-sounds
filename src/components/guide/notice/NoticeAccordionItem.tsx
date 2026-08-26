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
      className="w-full overflow-hidden rounded-sm bg-black/50"
    >
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full flex-col gap-1.5 px-4 py-3 text-left focus-visible:outline-none"
      >
        <span className="flex items-center justify-between">
          <span
            className={clsx(
              "font-mono text-[10px] font-medium tracking-[0.3em] uppercase",
              notice.isAlwaysOpen ? "text-ztmy-pink" : "text-white/40",
            )}
          >
            {notice.isAlwaysOpen ? "Notice" : "Guide"}
          </span>
          <ChevronDownIcon
            className={clsx(
              "h-3 w-3 shrink-0 text-white/40 transition-transform group-hover:text-white/70",
              !isOpen && "rotate-180",
            )}
          />
        </span>

        <span className="text-2xl leading-tight font-bold tracking-tight text-white">
          {notice.title}
        </span>

        <span className="relative block h-px w-full overflow-hidden bg-white/15">
          <span
            className={clsx(
              "from-ztmy-pink to-ztmy-purple absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-linear-to-r transition-transform duration-500 ease-out",
              isOpen ? "scale-x-100" : "group-hover:scale-x-100",
            )}
          />
        </span>
      </button>

      <div
        className={clsx(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-white/70 [&_strong]:text-white">
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
