"use client";

import { useEffect } from "react";

// visualViewport.scale 부동소수점 오차 허용치.
const ZOOM_EPSILON = 0.01;

/**
 * `body`는 `h-dvh overflow-hidden`으로 절대 스크롤되지 않아야 하는 구조입니다
 * (docs/RULES.md 참고, 실제 스크롤은 각 라우트 내부 컨테이너가 담당). 그런데
 * WebKit은 visual viewport가 layout viewport보다 작아지는 순간 `overflow:
 * hidden`을 의도적으로 무시하고 문서를 스크롤 가능하게 풀어줍니다 — 사용자가
 * 핀치 줌한 상태에서 화면 이동이 막혀버리는 걸 막기 위한 설계입니다(WebKit bug
 * 240860 코멘트 참고). 탭을 오래 비활성화했다가 돌아오면 브라우저 UI(주소창)
 * 상태가 그 사이 바뀌면서 같은 조건(viewport 크기 불일치)이 의도치 않게
 * 발생하고, 그 결과 문서가 헤더 높이만큼 스크롤된 채로 복귀합니다 — 화면상
 * 헤더가 사라지고 레이아웃 전체가 위로 붙어 보이는(새로고침하면 스크롤
 * 위치가 리셋되어 정상으로 돌아오는) 원인입니다.
 *
 * CSS만으로는 못 막고, 그렇다고 스크롤을 무조건 (0, 0)으로 되돌리면 핀치
 * 줌해서 화면을 보고 있는 사용자까지 강제로 원점 스냅시켜 접근성을 해치므로
 * (WebKit이 애초에 막으려던 상황을 그대로 재현하게 됨), 줌 안 된 상태
 * (visualViewport.scale ≈ 1)일 때만 교정합니다 — 그 상태에서 body가 스크롤될
 * legitimate한 이유는 이 레이아웃 구조상 없습니다.
 */
export function BodyScrollGuard() {
  useEffect(() => {
    const isZoomedIn = () => {
      const viewport = window.visualViewport;
      return viewport != null && viewport.scale > 1 + ZOOM_EPSILON;
    };

    const resetScroll = () => {
      if (isZoomedIn()) return;
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
