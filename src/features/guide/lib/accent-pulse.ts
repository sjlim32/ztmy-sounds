"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/features/guide/player-context";

/**
 * 강조 타이밍(line.accents)이 되는 순간 그 가사 줄(<li>) 배경을 응원 색으로
 * 번쩍였다가 원래 배경으로 빠지게 한다. ring이면 테두리 안쪽 빛도 함께 —
 * 박수 줄은 "둥" 울리는 느낌을 더하고, 흔들기 등은 배경만 강조한다.
 * 줄의 원래 배경(재생 중 응원 색)은 클래스·인라인으로 칠해져 있어서, 그 위에
 * 잠깐만 덮어썼다 돌아오도록 Web Animations API로 줄 요소에 직접 재생한다
 * (리렌더 없음).
 */
export function pulseLine(
  line: HTMLElement,
  color: string,
  { ring = false }: { ring?: boolean } = {},
) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  line.animate(
    reduceMotion
      ? [{ backgroundColor: `${color}40` }, {}]
      : [
          // 줄 크기·위치는 건드리지 않는다(transform scale 등을 쓰면 줄 전체
          // 글자가 좌우로 밀려 보이고 목록에 가로 넘침이 생김) — 색과 안쪽
          // 그림자만 바꿔서 레이아웃 변화 없이 "울림"만 표현한다.
          ring
            ? {
                backgroundColor: `${color}55`,
                boxShadow: `inset 0 0 0 2px ${color}cc, inset 0 0 18px ${color}66`,
              }
            : { backgroundColor: `${color}55` },
          ring
            ? { boxShadow: `inset 0 0 0 0 ${color}00, inset 0 0 0 ${color}00` }
            : {},
        ],
    { duration: reduceMotion ? 250 : 420, easing: "ease-out" },
  );
}

/**
 * 지금까지 지난 강조 타이밍 수. 유튜브 iframe의 getCurrentTime()은 매 프레임
 * 바뀌지 않고 띄엄띄엄 갱신된다 — 박수처럼 짧은 간격에 맞추려면 그대로 쓰면
 * 늦게 터지므로, 마지막으로 값이 바뀐 순간을 기준점으로 잡고 재생 중이면 흐른
 * 시간만큼 앞으로 추정한다.
 */
export function useAccentCount(
  lineStart: number,
  accents: readonly number[],
  enabled: boolean,
): number {
  const { getCurrentTime, isPlaying } = usePlayer();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let frameId = 0;
    let lastRaw: number | undefined;
    let anchor = { time: 0, at: 0 };

    const tick = () => {
      const now = performance.now();
      const raw = getCurrentTime();
      if (raw !== undefined && raw !== lastRaw) {
        lastRaw = raw;
        anchor = { time: raw, at: now };
      }
      const time = isPlaying
        ? anchor.time + (now - anchor.at) / 1000
        : anchor.time;
      // 앞뒤로 seek해도 맞도록 매번 "지금까지 지나간 강조 수"를 새로 센다.
      const passed = accents.filter((offset) => lineStart + offset <= time);
      setCount(passed.length);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [enabled, getCurrentTime, isPlaying, lineStart, accents]);

  return enabled ? count : 0;
}
