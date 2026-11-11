"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hasOpenModal } from "@/lib/open-modal";

/** 이만큼 움직였으면 누르기가 아니라 스크롤로 본다. */
const TAP_SLOP = 10;

/**
 * 버튼 바로 밑에 열리는 작은 창(드롭다운). 화면을 가리지 않고, 바깥을 누르거나
 * Esc로 닫는다. 위치 기준이 되는 부모(relative)는 호출부가 만든다 — 모바일에서
 * 부모 폭 전체로 펼치려면 부모를 줄 전체 폭 요소로 둔다.
 *
 * - 바깥 닫기: 바깥에서 누르고(pointerdown) 거의 움직이지 않고 뗀(pointerup)
 *   경우만. 화면을 쓸어 스크롤하면 닫지 않고, 창 안에서 누른 버튼이 사라져도
 *   (안에서 시작한 누르기) 닫지 않고, 창을 연 그 누르기(창이 열리기 전에 시작)도
 *   닫지 않는다. iOS는 빈 곳 탭에 click을 안 보내므로 pointer 이벤트로 판단한다.
 * - closeOnOutside=false면 바깥을 눌러도 닫지 않는다. Esc·여는 버튼으로는 닫힌다.
 * - 열리면 창 자체에 포커스(입력칸에 바로 주면 모바일 키보드가 튀어나온다), 닫히면
 *   열었던 요소로 — 스크롤은 건드리지 않는다.
 * - 화면을 덮는 다른 창(aria-modal)이 열려 있으면 Esc는 그 창 몫으로 둔다.
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
    node?.focus({ preventScroll: true });
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body || node?.contains(active))
        opener?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let down: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element;
      // 창 안이나 여는 버튼(data-popover-trigger, 버튼이 직접 닫는다)에서 시작한
      // 누르기는 바깥 누르기가 아니다.
      const inside =
        ref.current?.contains(target) ||
        target.closest?.("[data-popover-trigger]");
      down = inside ? null : { x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      const start = down;
      down = null;
      if (!start || !closeOnOutside) return;
      if (
        Math.hypot(event.clientX - start.x, event.clientY - start.y) < TAP_SLOP
      )
        onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (hasOpenModal()) return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);
    const onCancel = () => {
      down = null;
    };
    document.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, closeOnOutside]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      className={cn(
        "bg-background absolute top-full right-0 z-40 mt-2 max-h-[70dvh] overflow-y-auto rounded-lg border border-white/15 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.55)] focus:outline-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
