"use client";

import { useEffect } from "react";

// visualViewport.scale 부동소수점 오차 허용치.
const ZOOM_EPSILON = 0.01;

/**
 * `body`는 `h-dvh overflow-hidden`으로 절대 스크롤되지 않아야 한다
 * (docs/RULES.md, 실제 스크롤은 각 라우트 내부 컨테이너 담당).
 *
 * WebKit은 visual viewport가 layout viewport보다 작아지면 `overflow:
 * hidden`을 무시하고 문서를 스크롤 가능하게 풀어준다 — 핀치 줌 상태에서
 * 화면 이동이 막히지 않도록 하기 위한 설계다(WebKit bug 240860).
 * 탭을 오래 비활성화했다 돌아오면 같은 조건이 의도치 않게 발생해, 문서가
 * 헤더 높이만큼 스크롤된 채로 복귀한다 — 헤더가 사라지고 레이아웃이 위로
 * 붙어 보이는(새로고침하면 정상으로 돌아오는) 원인이다.
 *
 * 스크롤을 무조건 (0, 0)으로 되돌리면 핀치 줌 중인 사용자까지 강제로
 * 원점 스냅시켜 접근성을 해치므로, 줌 안 된 상태(scale ≈ 1)일 때만
 * 교정한다 — 그 외엔 body가 스크롤될 legitimate한 이유가 없다.
 *
 * 가상 키보드 가드: 높이 축소만으론 키보드와 주소창 접힘/펼침을 구분할
 * 수 없어(둘 다 height만 바뀜), 대신 텍스트 입력 요소에 포커스가 있는지로
 * 판별한다 — 키보드가 뜨는 유일한 트리거라 모호함이 없다.
 */
export function BodyScrollGuard() {
  useEffect(() => {
    const isZoomedIn = () => {
      const viewport = window.visualViewport;
      return viewport != null && viewport.scale > 1 + ZOOM_EPSILON;
    };

    const isEditableFocused = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return false;
      if (active.isContentEditable) return true;
      if (active.tagName === "TEXTAREA") return true;
      if (active.tagName === "INPUT") {
        // 키보드를 띄우지 않는 input type(체크박스/라디오/버튼류 등)은 제외.
        const NON_TEXT_INPUT_TYPES = new Set([
          "checkbox",
          "radio",
          "button",
          "submit",
          "reset",
          "range",
          "color",
          "file",
        ]);
        return !NON_TEXT_INPUT_TYPES.has((active as HTMLInputElement).type);
      }
      return false;
    };

    const resetScroll = () => {
      if (isZoomedIn() || isEditableFocused()) return;
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    resetScroll();
    window.addEventListener("scroll", resetScroll, { passive: true });
    window.addEventListener("pageshow", resetScroll);
    document.addEventListener("visibilitychange", resetScroll);

    return () => {
      window.removeEventListener("scroll", resetScroll);
      window.removeEventListener("pageshow", resetScroll);
      document.removeEventListener("visibilitychange", resetScroll);
    };
  }, []);

  return null;
}
