"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 화면을 덮는 창의 포커스 — 열리면 initialFocusRef(없으면 창)에 포커스, Esc면
 * onClose, Tab은 창 안에서만 돈다(포커스가 창 밖에 있으면 다시 안으로). 닫히면
 * 열었던 요소로 포커스를 돌려준다(스크롤은 건드리지 않는다). SidePanel·통합 검색
 * 창이 같이 쓴다.
 */
export function useDialogFocus({
  open,
  containerRef,
  initialFocusRef,
  onClose,
}: {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    (initialFocusRef?.current ?? containerRef.current)?.focus({
      preventScroll: true,
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      const items = [
        ...(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
      ];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || !container?.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !container?.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, containerRef, initialFocusRef]);
}
