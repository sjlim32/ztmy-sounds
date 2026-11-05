"use client";

import { useEffect, type RefObject } from "react";

/** 이만큼 움직여야 끌기로 본다 — 그보다 적으면 그냥 누르기(링크 이동). */
const DRAG_THRESHOLD = 4;

/**
 * 마우스로 배경(카드 위 포함)을 끌어 좌우로 스크롤한다. 조금이라도 끌었으면
 * 놓을 때의 클릭(링크 이동)은 막는다. 터치는 브라우저 기본 스크롤에 맡긴다.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      const startX = event.clientX;
      const startLeft = el.scrollLeft;
      let dragging = false;

      const onMove = (move: PointerEvent) => {
        const dx = move.clientX - startX;
        if (!dragging && Math.abs(dx) < DRAG_THRESHOLD) return;
        if (!dragging) {
          dragging = true;
          el.dataset.dragging = "true";
        }
        el.scrollLeft = startLeft - dx;
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (!dragging) return;
        delete el.dataset.dragging;
        // 끌고 놓은 자리의 링크가 눌리지 않게, 바로 뒤 클릭 한 번만 막는다.
        const block = (click: MouseEvent) => {
          click.preventDefault();
          click.stopPropagation();
        };
        el.addEventListener("click", block, { capture: true, once: true });
        setTimeout(() => el.removeEventListener("click", block, true), 0);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
    // 링크·그림의 기본 끌어 놓기(새 탭으로 끌기)가 끌기 스크롤을 가로채지 않게
    const onDragStart = (event: DragEvent) => event.preventDefault();

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, [ref]);
}
