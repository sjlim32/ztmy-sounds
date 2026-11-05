"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 버튼 바로 밑에 열리는 작은 창(드롭다운). 화면을 가리지 않고, 바깥을 누르거나
 * Esc로 닫는다. 위치 기준이 되는 부모(relative)는 호출부가 만든다 — 모바일에서
 * 부모 폭 전체로 펼치려면 부모를 줄 전체 폭 요소로 둔다.
 */
export function Popover({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      // 여는 버튼(data-popover-trigger)을 다시 누른 건 버튼이 직접 닫는다.
      const trigger = (target as Element).closest?.("[data-popover-trigger]");
      if (!ref.current?.contains(target) && !trigger) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={cn(
        "bg-background absolute top-full right-0 z-40 mt-2 max-h-[70dvh] overflow-y-auto rounded-lg border border-white/15 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
