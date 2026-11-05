"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * 버튼 바로 밑에 열리는 작은 창(드롭다운). 화면을 가리지 않고, 바깥을 누르거나
 * Esc로 닫는다. 위치 기준이 되는 부모(relative)는 호출부가 만든다 — 모바일에서
 * 부모 폭 전체로 펼치려면 부모를 줄 전체 폭 요소로 둔다.
 *
 * - 바깥 닫기는 pointerdown이 아니라 click 기준 — 모바일에서 화면을 쓸어 스크롤만
 *   해도 닫혀 버리지 않게(스크롤 제스처는 click을 만들지 않는다).
 * - closeOnOutside=false면 바깥을 눌러도 닫지 않는다(받은 기록 확인처럼 실수로
 *   닫히면 되돌릴 수 없는 내용). Esc·여는 버튼으로는 닫힌다.
 * - 열리면 안쪽 첫 입력 요소로 포커스, 닫히면 열었던 요소로 돌려준다.
 */
export function Popover({
  open,
  onClose,
  label,
  children,
  className,
  closeOnOutside = true,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
  closeOnOutside?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      // 포커스가 창 안에 있었거나 사라졌으면 열었던 버튼으로 되돌린다.
      const active = document.activeElement;
      if (!active || active === document.body || node?.contains(active))
        opener?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!closeOnOutside) return;
      const target = event.target as Node;
      // 여는 버튼(data-popover-trigger)을 다시 누른 건 버튼이 직접 닫는다.
      const trigger = (target as Element).closest?.("[data-popover-trigger]");
      if (!ref.current?.contains(target) && !trigger) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, closeOnOutside]);

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
