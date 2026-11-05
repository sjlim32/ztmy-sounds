"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { GHOST_ICON_BUTTON_CLASS } from "@/components/button-styles";
import { CloseIcon } from "@/components/icons/CloseIcon";

/**
 * 옆에서 나오는 작업 창 — 태블릿 이상은 화면 오른쪽의 좁은 패널(나머지 화면은
 * 옅게 어두워질 뿐 그대로 보인다), 모바일은 아래에서 올라오는 시트. 바깥을
 * 누르거나 Esc로 닫는다. 열릴 때 닫기 버튼에 포커스, 닫히면 열었던 요소로
 * 돌려준다. 열려 있는 동안 Tab은 창 안에서만 돈다. 내용이 길면 창 안에서 스크롤한다.
 */
export function SidePanel({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      // 창 밖(어두운 배경 뒤)으로 포커스가 새지 않게 Tab을 창 안에서 돌린다.
      const items = [
        ...(dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || !dialogRef.current?.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !dialogRef.current?.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="tablet:items-stretch tablet:justify-end fixed inset-0 z-50 flex items-end bg-black/40"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "bg-background flex max-h-[85dvh] w-full flex-col rounded-t-xl border-t border-white/15 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]",
          "tablet:max-h-none tablet:w-[34rem] pc:w-[40rem] tablet:rounded-none tablet:border-t-0 tablet:border-l",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="tablet:text-lg text-base font-semibold text-white"
            >
              {title}
            </h2>
            {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className={cn(GHOST_ICON_BUTTON_CLASS, "size-9 shrink-0")}
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        {/* 아이폰 홈 표시줄에 겹치지 않게 아래 여백을 넉넉히(RULES.md). */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
