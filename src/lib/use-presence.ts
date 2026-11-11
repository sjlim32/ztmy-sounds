"use client";

import { useEffect, useState } from "react";

/**
 * 닫힌 뒤에도 움직임이 끝날 때까지(ms) 그려 둘지 — 열리면 바로 true, 닫히면 ms 뒤
 * false. 여닫는 창(SidePanel·통합 검색 창)이 사라지는 움직임을 보여 주려고 쓴다.
 */
export function usePresence(open: boolean, ms: number): boolean {
  const [present, setPresent] = useState(open);
  // 열리면 렌더 중에 바로 맞춘다(effect를 기다리면 한 프레임 늦게 그려진다).
  if (open && !present) setPresent(true);
  useEffect(() => {
    if (open || !present) return;
    const timer = setTimeout(() => setPresent(false), ms);
    return () => clearTimeout(timer);
  }, [open, present, ms]);
  return present;
}
