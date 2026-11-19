"use client";

import { useLayoutEffect } from "react";
import type { RefObject } from "react";

// iframe(MV 유튜브)도 Tab 순환에 넣고, 순환용 숨은 칸(data-focus-sentinel)은 뺀다.
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/** 창 안에서 Tab으로 갈 수 있는 요소들(순서대로). */
export function getFocusableIn(container: HTMLElement | null): HTMLElement[] {
  return [
    ...(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
  ].filter((item) => !item.hasAttribute("data-focus-sentinel"));
}

/**
 * 화면을 덮는 창의 포커스 — 열리면 initialFocusRef(없으면 창)에 포커스, Esc면
 * onClose, Tab은 창 안에서만 돈다(포커스가 창 밖에 있으면 다시 안으로). 닫히면
 * 열었던 요소로 포커스를 돌려준다(스크롤은 건드리지 않는다). SidePanel·통합 검색
 * 창·공지 창·곡/앨범 드로어(SongDbDrawer)가 같이 쓴다.
 *
 * 여는 쪽은 useLayoutEffect라 그려지기 전에 포커스가 이미 옮겨가 있다.
 * restoreFocus "next-frame": 닫을 때 포커스 되돌리기를 한 프레임 미룬다 — 커밋
 * 직후 React-DOM이 자체 restoreSelection을 한 번 더 돌리는 타이밍과 겹치면 곧바로
 * focus()한 것을 그게 다시 뺏어간다(SongDbDrawer에서 실측).
 */
export function useDialogFocus({
  open,
  containerRef,
  initialFocusRef,
  onClose,
  restoreFocus = "immediate",
}: {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  restoreFocus?: "immediate" | "next-frame";
}) {
  useLayoutEffect(() => {
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
      const items = getFocusableIn(container);
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
      const restore = () => opener?.focus?.({ preventScroll: true });
      if (restoreFocus === "next-frame") requestAnimationFrame(restore);
      else restore();
    };
  }, [open, onClose, containerRef, initialFocusRef, restoreFocus]);
}
