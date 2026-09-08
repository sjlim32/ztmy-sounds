"use client";

import { useEffect, useRef } from "react";

// 정적 커서(globals.css)와 같은 기준으로 상태를 판단합니다 — 우선순위는
// 비활성 > 텍스트 입력 > 도움말 > 링크/버튼 > 드래그 > 기본 순입니다.
// .cursor-help가 POINTER_SELECTOR보다 먼저 검사되는 이유: <button>은 그
// 자체로 POINTER_SELECTOR에 걸리므로, 버튼인데 도움말 커서를 쓰고 싶은
// 경우(예: 노래 DB 앨범 커버) .cursor-help를 먼저 확인해야 우선합니다.
const NOT_ALLOWED_SELECTOR =
  '[disabled], [aria-disabled="true"], .cursor-not-allowed';
const TEXT_SELECTOR =
  'input[type="text"], input[type="email"], input[type="search"], input[type="password"], input[type="url"], input[type="tel"], input[type="number"], textarea, [contenteditable="true"]';
const HELP_SELECTOR = ".cursor-help";
const POINTER_SELECTOR =
  'a, button, [role="button"], select, summary, label[for], input[type="submit"], input[type="button"], .cursor-pointer';
const MOVE_SELECTOR = '[draggable="true"], .cursor-move';

const SPRITES = {
  normal: "/cursors/normal-sheet.png",
  link: "/cursors/link-sheet.png",
  text: "/cursors/text-sheet.png",
  unavailable: "/cursors/unavailable-sheet.png",
  move: "/cursors/move-sheet.png",
  // help는 8프레임 애니메이션 시트가 없고 정적 프레임(help.png)만 있습니다 —
  // globals.css의 `.custom-cursor[data-state="help"]`가 steps(8) 애니메이션을
  // 꺼서 빈 프레임이 섞이지 않게 합니다.
  help: "/cursors/help.png",
} as const;

type CursorState = keyof typeof SPRITES;

function resolveState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "normal";
  if (target.closest(NOT_ALLOWED_SELECTOR)) return "unavailable";
  if (target.closest(TEXT_SELECTOR)) return "text";
  if (target.closest(HELP_SELECTOR)) return "help";
  if (target.closest(POINTER_SELECTOR)) return "link";
  if (target.closest(MOVE_SELECTOR)) return "move";
  return "normal";
}

/**
 * ZUTOMAYO 픽셀 커서를 실제로 애니메이션(8프레임 순환)하기 위한 마우스 추종
 * 엘리먼트. CSS cursor 속성은 애니메이션을 지원하지 않아서, 네이티브 커서를
 * 숨기고(html.custom-cursor-active, globals.css) 이 div를 직접 마우스 위치에
 * 그립니다. 마우스가 지금 뭘 hover 중인지에 따라 어떤 스프라이트를 보여줄지는
 * globals.css의 정적 커서 셀렉터와 동일한 기준으로 판단합니다.
 *
 * 포인터가 정밀한 기기(마우스)에서만 동작합니다 — 터치 기기에는 커서 개념이
 * 없어서 pointer: fine이 아니면 아무 것도 하지 않고 조용히 빠집니다.
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = cursorRef.current;
    if (!el) return;

    document.documentElement.classList.add("custom-cursor-active");
    // mouseover는 hover 대상이 실제로 "바뀔 때만" 발생하므로, 첫 이동 전에는
    // 스프라이트가 아예 안 그려져 커서가 비어 보입니다. 기본 스프라이트를
    // 미리 깔아둡니다.
    el.dataset.state = "normal";
    el.style.backgroundImage = `url(${SPRITES.normal})`;

    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;

    const applyPosition = () => {
      el.style.transform = `translate3d(${pendingX}px, ${pendingY}px, 0)`;
      rafId = 0;
    };

    const handleMove = (event: MouseEvent) => {
      pendingX = event.clientX;
      pendingY = event.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(applyPosition);
      }
    };

    // hover 대상 판별(closest() 최대 4번)은 mousemove가 아니라 mouseover에
    // 걸어둡니다 — mousemove는 같은 요소 위에서 픽셀 단위로만 움직여도 초당
    // 수십~백 번씩 발생하지만, mouseover는 실제로 hover 대상이 바뀔 때만
    // 발생해서 같은 결과를 불필요하게 반복 계산하지 않습니다.
    const handleOver = (event: MouseEvent) => {
      const state = resolveState(event.target);
      if (el.dataset.state !== state) {
        el.dataset.state = state;
        el.style.backgroundImage = `url(${SPRITES[state]})`;
      }
    };

    const handleLeave = () => {
      el.style.opacity = "0";
    };
    const handleEnter = () => {
      el.style.opacity = "1";
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" aria-hidden="true" />;
}
