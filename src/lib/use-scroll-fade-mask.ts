import { useEffect, useRef } from "react";

const FADE_SIZE = "20px";

/**
 * 스크롤 컨테이너 상하 끝에 닿으면 그쪽 페이드를 꺼서(불투명 처리) "여기가
 * 끝"임을 보여주고, 끝이 아니면 투명하게 페이드시켜 "더 있음"을 암시.
 * 실제로 스크롤하지 않는 쪽(예: display:contents인 요소)에 붙어도 계산만
 * 무의미해질 뿐 부작용은 없습니다.
 */
export function useScrollFadeMask<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateFade = () => {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      el.style.maskImage = `linear-gradient(to bottom, ${atTop ? "black" : "transparent"}, black ${FADE_SIZE}, black calc(100% - ${FADE_SIZE}), ${atBottom ? "black" : "transparent"})`;
    };

    // scroll 이벤트는 빠른 트랙패드/관성 스크롤에서 화면 주사율보다도 자주
    // 발생할 수 있어서, 매번 바로 style을 쓰지 않고 rAF로 프레임당 한 번만
    // 반영합니다(CustomCursor의 mousemove 처리와 동일한 패턴).
    let rafId = 0;
    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updateFade();
      });
    };

    updateFade();
    el.addEventListener("scroll", scheduleUpdate);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", scheduleUpdate);
      resizeObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return ref;
}
