"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  PANEL_ENTER_DELAY_MS,
  usePanelEntranceVisible,
} from "@/lib/use-entrance-visible";

/**
 * 페이지에 들어올 때 내용을 서서히 나타나게 한다 — 메인에서 넘어오면 배경이
 * 어두워지는데(GuideDimOverlay), 그 사이 내용이 먼저 툭 튀어나오지 않도록
 * /guide의 곡 목록과 같은 타이밍으로 맞춘다.
 *
 * 레이아웃에 둘 때(예: /zutopia) replayKey(보통 경로)를 주면, 그 값이 바뀔
 * 때마다(하위 페이지 이동) 다시 숨겼다가 같은 타이밍으로 나타난다 — 페이지마다
 * 따로 마운트되는 다른 페이지들과 같은 전환. 내용을 다시 마운트하지 않아
 * 레이아웃 상태는 그대로다. 다시 재생하지 않을 이동은 호출부가 같은 키를 준다.
 */
export function EntranceFade({
  className,
  children,
  replayKey,
}: {
  className?: string;
  children: ReactNode;
  replayKey?: string;
}) {
  const entered = usePanelEntranceVisible();
  const [lastKey, setLastKey] = useState(replayKey);
  const [replaying, setReplaying] = useState(false);

  // 새 내용이 그려지는 바로 그 렌더에서 숨겨야 한 프레임도 비치지 않는다.
  if (replayKey !== lastKey) {
    setLastKey(replayKey);
    setReplaying(true);
  }

  useEffect(() => {
    if (!replaying) return;
    const id = setTimeout(() => setReplaying(false), PANEL_ENTER_DELAY_MS);
    return () => clearTimeout(id);
  }, [replaying, replayKey]);

  const visible = entered && !replaying;

  return (
    <div
      className={cn(
        // 숨길 땐 전환 없이 바로(서서히 사라지면 새 내용이 비친다), 나타날 때만 서서히.
        // 움직임 줄이기 설정이면 숨기지도, 서서히 나타나지도 않고 바로 보인다.
        visible
          ? "opacity-100 transition-opacity duration-1000 motion-reduce:transition-none"
          : "opacity-0 motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
