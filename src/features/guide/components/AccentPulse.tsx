"use client";

import { useEffect, useRef } from "react";
import type { CallTag } from "@/features/guide/lib/types";
import { CALL_TAG_COLOR } from "@/features/guide/lib/call-tag-style";
import { pulseLine } from "@/features/guide/lib/accent-pulse";

/**
 * 강조 타이밍마다 줄 왼쪽 아이콘(GutterMarker의 data-gutter-icon)이 하는 동작 —
 * 그 응원의 실제 움직임을 크게 한 번. index는 몇 번째 강조인지(좌우를 번갈아).
 * 아이콘 바깥 칸엔 재생 중 반복 애니메이션(CSS)이 걸려 있어서, 겹치지 않게 안쪽
 * 이미지에 Web Animations API로 재생한다.
 */
function getKickKeyframes(tag: CallTag, index: number): Keyframe[] {
  const side = index % 2 === 0 ? -1 : 1;
  switch (tag) {
    case "swing":
      return [
        { transform: "rotate(0deg) scale(1)" },
        { transform: `rotate(${side * 30}deg) scale(1.3)`, offset: 0.35 },
        { transform: "rotate(0deg) scale(1)" },
      ];
    case "dance":
      return [
        { transform: "translate(0, 0) rotate(0deg) scale(1)" },
        {
          transform: `translate(${side * 3}px, -6px) rotate(${side * 14}deg) scale(1.25)`,
          offset: 0.35,
        },
        { transform: "translate(0, 0) rotate(0deg) scale(1)" },
      ];
    default:
      return [
        { transform: "scale(1)" },
        { transform: "scale(1.35)", offset: 0.35 },
        { transform: "scale(1)" },
      ];
  }
}

/**
 * ✋가 없는 응원 줄(흔들기·노래·댄스 등)의 강조 타이밍(line.accents) 효과 —
 * 강조 수(count)가 늘 때마다 줄 왼쪽 아이콘이 그 응원 동작을 크게 한 번(흔들기는
 * 좌우로 번갈아 기울기) 하고 줄 배경이 응원 색으로 번쩍인다. 발음 줄 강조 단어가
 * 차례로 켜지는 표시는 PronunciationText가 같은 count로 그린다. 자리를 차지하지
 * 않는 빈 표식이다. 움직임 줄이기 설정이면 아이콘 동작 없이 배경만.
 */
export function AccentPulse({ count, tag }: { count: number; tag: CallTag }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const lastCountRef = useRef(0);

  // 강조 수가 늘어날 때만(= 새 타이밍이 됨) 울린다. 뒤로 seek해서 줄어들 땐
  // 조용히 기준만 맞춘다.
  useEffect(() => {
    if (count > lastCountRef.current) {
      const line = anchorRef.current?.closest("li");
      if (line) {
        pulseLine(line, CALL_TAG_COLOR[tag]);
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const icon = line.querySelector<HTMLElement>("[data-gutter-icon] img");
        if (icon && !reduceMotion) {
          icon.animate(getKickKeyframes(tag, count - 1), {
            duration: 380,
            easing: "ease-out",
          });
        }
      }
    }
    lastCountRef.current = count;
  }, [count, tag]);

  return <span ref={anchorRef} aria-hidden className="hidden" />;
}
