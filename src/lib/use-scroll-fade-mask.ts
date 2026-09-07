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

    updateFade();
    el.addEventListener("scroll", updateFade);
    const resizeObserver = new ResizeObserver(updateFade);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFade);
      resizeObserver.disconnect();
    };
  }, []);

  return ref;
}
