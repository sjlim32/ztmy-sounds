import { useEffect, useRef, useState } from "react";
import { cva } from "class-variance-authority";

// GuideDimOverlay의 duration-700(화면이 어두워지는 시간)과 맞춰, 그 뒤에
// 패널이 이어서 나타나도록 주는 지연. SongPanel/NoticePanel이 각자
// 마운트되는 시점에 이 훅을 호출해 같은 딜레이로 진입 애니메이션을
// 맞춥니다.
export const PANEL_ENTER_DELAY_MS = 150;

/**
 * 마운트 시점 기준 PANEL_ENTER_DELAY_MS 뒤에 true가 되는 훅. /guide
 * 최초 진입 시 패널이 서서히 나타나는 진입 애니메이션에 씁니다.
 */
export function usePanelEntranceVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), PANEL_ENTER_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  return visible;
}

// 지금 열려/선택되어 있는 항목을 표시하는 좌측 액센트 바. 선택 시 항상,
// 그 외에는 hover 시에만 나타남 (사이트 그라데이션 시그니처). SongList의
// 곡 항목과 NoticeAccordionItem(모바일)이 함께 씁니다.
export const accentBarStyles = cva(
  "from-ztmy-pink to-ztmy-purple absolute inset-y-1 left-0 w-1 origin-top scale-y-0 rounded-full bg-linear-to-b transition-transform duration-300",
  {
    variants: {
      selected: {
        true: "scale-y-100",
        false: "group-hover:scale-y-100",
      },
    },
  },
);

const FADE_SIZE = "20px";

/**
 * 스크롤 컨테이너 상하 끝에 닿으면 그쪽 페이드를 꺼서(불투명 처리) "여기가
 * 끝"임을 보여주고, 끝이 아니면 투명하게 페이드시켜 "더 있음"을 암시.
 * SongList의 곡 목록(tablet 이상)과 모바일 통합 스크롤(GuideListScroll)이
 * 함께 씁니다 — 실제로 스크롤하지 않는 쪽(예: display:contents인 요소)에
 * 붙어도 계산만 무의미해질 뿐 부작용은 없습니다.
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
