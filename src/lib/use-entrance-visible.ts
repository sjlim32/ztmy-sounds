import { useEffect, useState } from "react";

// GuideDimOverlay의 duration-700(화면이 어두워지는 시간)과 맞춰, 그 뒤에
// 내용이 이어서 나타나도록 주는 지연. 각 페이지 내용이 마운트되는 시점에
// 이 훅을 호출해 같은 딜레이로 진입 애니메이션을 맞춥니다.
export const PANEL_ENTER_DELAY_MS = 150;

/**
 * 마운트 시점 기준 PANEL_ENTER_DELAY_MS 뒤에 true가 되는 훅. 페이지에 처음
 * 들어올 때 내용이 서서히 나타나는 진입 애니메이션에 씁니다(/guide의 패널,
 * EntranceFade).
 */
export function usePanelEntranceVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), PANEL_ENTER_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  return visible;
}
