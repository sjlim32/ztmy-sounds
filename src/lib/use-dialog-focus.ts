"use client";

import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

// iframe(MV 유튜브)도 Tab 순환에 넣고, 순환용 숨은 칸(data-focus-sentinel)은 뺀다.
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * 창 안에서 Tab으로 갈 수 있는 요소들(순서대로) — 화면에 보이는 것만(모바일·태블릿에
 * 따로 그리고 한쪽을 display:none으로 숨긴 요소는 뺀다).
 */
export function getFocusableIn(container: HTMLElement | null): HTMLElement[] {
  return [
    ...(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
  ].filter(
    (item) =>
      !item.hasAttribute("data-focus-sentinel") &&
      item.getClientRects().length > 0,
  );
}

/** 지금 열려 있는 모달 창들(문서 순서) — 닫혀서 aria-hidden 아래 남은 창은 뺀다. */
function openModals(): Element[] {
  return [...document.querySelectorAll('[aria-modal="true"]')].filter(
    (modal) => !modal.closest('[aria-hidden="true"]'),
  );
}

/**
 * 이 창이 키를 처리할 차례인지 — 포커스가 어느 모달 안에 있으면 그 모달이, 아무 모달
 * 밖(body 등)이면 문서에서 맨 마지막(맨 위에 그려진) 열린 모달이 처리한다. 창이 둘
 * 열렸을 때 Esc 한 번에 둘 다 닫히거나 Tab이 가려진 창으로 들어가지 않게.
 */
function ownsKeys(container: HTMLElement | null, active: Element | null) {
  if (!container) return false;
  const modal = active?.closest('[aria-modal="true"]');
  if (modal) return modal === container;
  return openModals().at(-1) === container;
}

/**
 * 화면을 덮는 창의 포커스 — 열리면 initialFocusRef(없으면 창)에 포커스, Esc면
 * onClose, Tab은 창 안에서만 돈다. 닫히면 열었던 요소로 포커스를 돌려준다(스크롤은
 * 건드리지 않는다). SidePanel·통합 검색 창·공지 창·곡/앨범 드로어가 같이 쓴다.
 *
 * - 여는 쪽은 useLayoutEffect라 그려지기 전에 포커스가 이미 옮겨가 있다.
 * - 되돌리기는 늘 한 프레임 미룬다 — 커밋 직후 React-DOM의 restoreSelection이 커밋
 *   전 포커스 요소(닫히는 동안 남아 있는 창 안 요소)로 포커스를 다시 가져가서, 곧바로
 *   되돌리면 뺏긴다(실측). 그 사이 사용자가 창 밖 다른 곳을 눌러 포커스가 옮겨 갔으면
 *   (body·창 안이 아니면) 되돌리지 않는다. 되돌릴 곳이 없으면(연 요소가 body이거나
 *   문서에서 빠졌으면) 닫힌 창 안에 남은 포커스만 푼다.
 * - 되돌리기를 기다리는 사이 다시 열리면(StrictMode의 effect 두 번 실행, 한 프레임 안에
 *   닫았다 열기) 그 되돌리기를 취소하고 처음 연 요소를 그대로 이어받는다.
 * - onClose는 ref로 들고 있어서 호출부가 매 렌더 새 함수를 넘겨도 다시 열린 것처럼
 *   돌지 않는다.
 * - trapOutside false: 포커스가 창 밖에 있을 땐 Tab을 가로채지 않는다(첫·끝 요소에서만
 *   감싼다) — 열린 채 뒤 목록을 눌러 고르는 비모달 드로어(SongDbDrawer).
 * - Esc는 한글 조합 중이거나, 창 안 요소가 이미 처리했으면(preventDefault — 글자가 든
 *   검색칸은 Esc로 글자만 지운다) 창을 닫지 않는다.
 */
export function useDialogFocus({
  open,
  containerRef,
  initialFocusRef,
  onClose,
  trapOutside = true,
}: {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  trapOutside?: boolean;
}) {
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });
  const pendingRestore = useRef<{
    frame: number;
    opener: HTMLElement | null;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    let opener = document.activeElement as HTMLElement | null;
    if (pendingRestore.current) {
      cancelAnimationFrame(pendingRestore.current.frame);
      opener = pendingRestore.current.opener;
      pendingRestore.current = null;
    }
    // 닫히는 동안에도 창은 남아 있어(usePresence) 되돌리기 판정에 그대로 쓴다.
    const dialog = containerRef.current;
    (initialFocusRef?.current ?? dialog)?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      const container = containerRef.current;
      const active = document.activeElement;
      if (!ownsKeys(container, active)) return;
      if (event.key === "Escape") {
        if (event.isComposing || event.defaultPrevented) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusableIn(container);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const outside = !container?.contains(active);
      if (outside && !trapOutside) return;
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const frame = requestAnimationFrame(() => {
        pendingRestore.current = null;
        const active = document.activeElement;
        const inDialog = !!dialog && !!active && dialog.contains(active);
        const moved = !!active && active !== document.body && !inDialog;
        if (moved) return;
        const canRestore =
          !!opener && opener !== document.body && opener.isConnected;
        if (canRestore) opener!.focus({ preventScroll: true });
        else if (inDialog) (active as HTMLElement).blur();
      });
      pendingRestore.current = { frame, opener };
    };
  }, [open, containerRef, initialFocusRef, trapOutside]);
}
