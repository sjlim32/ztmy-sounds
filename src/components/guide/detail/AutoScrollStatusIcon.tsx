"use client";

import { useState } from "react";

const THUMB_TRAVEL_PX = 16; // 트랙(36px) - 손잡이(16px) - 좌우 여백(2px*2)

/**
 * 스위치 트랙 안에서 좌우로 슬라이드되는 원형 손잡이. 상태가 바뀔 때마다
 * (effect가 아니라 렌더 중 prop 비교로) 회전각을 360도씩 계속 누적시켜서,
 * 어느 방향으로 토글해도 항상 한 바퀴 도는 것처럼 보이게 합니다.
 */
export function AutoScrollStatusIcon({ active }: { active: boolean }) {
  const [prevActive, setPrevActive] = useState(active);
  const [rotation, setRotation] = useState(0);

  if (active !== prevActive) {
    setPrevActive(active);
    setRotation((r) => r + 360);
  }

  return (
    <span
      aria-hidden
      className="absolute top-1/2 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-out"
      style={{
        transform: `translateY(-50%) translateX(${active ? THUMB_TRAVEL_PX : 0}px) rotate(${rotation}deg)`,
      }}
    />
  );
}
