"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/features/guide/player-context";
import { CALL_TAG_COLOR } from "@/features/guide/lib/call-tag-style";

const CLAP = "✋";
const CLAP_COLOR = CALL_TAG_COLOR.clap;

/**
 * ✋와 ✋ 사이 간격 표기 — 데이터에 적은 문자를 화면에선 빈 간격으로 바꿔 그린다.
 * 띄어쓰기는 짧은 쉼(0.3em), 슬래시(/)는 긴 쉼(0.6em). 붙여 쓴 ✋✋는 간격 없음.
 */
function getClapGapClass(between: string): string | null {
  if (!/^[\s/]+$/.test(between)) return null; // ✋ 사이에 다른 글자가 있으면 그대로 표시
  return between.includes("/") ? "w-[0.6em]" : "w-[0.3em]";
}

/**
 * 박수가 터지는 순간 그 가사 줄(<li>) 배경이 "둥" 하고 울리게 한다 — 박수
 * 색으로 번쩍였다가 원래 배경으로 빠지고, 테두리 안쪽 빛이 사그라든다.
 * 줄의 원래 배경(재생 중 보라색)은 클래스로 칠해져 있어서, 그 위에 잠깐만
 * 덮어썼다 돌아오도록 Web Animations API로 줄 요소에 직접 재생한다(리렌더 없음).
 */
function pulseLine(line: HTMLElement) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  line.animate(
    reduceMotion
      ? [{ backgroundColor: `${CLAP_COLOR}40` }, {}]
      : [
          // 줄 크기·위치는 건드리지 않는다(transform scale 등을 쓰면 줄 전체
          // 글자가 좌우로 밀려 보이고 목록에 가로 넘침이 생김) — 색과 안쪽
          // 그림자만 바꿔서 레이아웃 변화 없이 "울림"만 표현한다.
          {
            backgroundColor: `${CLAP_COLOR}55`,
            boxShadow: `inset 0 0 0 2px ${CLAP_COLOR}cc, inset 0 0 18px ${CLAP_COLOR}66`,
          },
          {
            boxShadow: `inset 0 0 0 0 ${CLAP_COLOR}00, inset 0 0 0 ${CLAP_COLOR}00`,
          },
        ],
    { duration: reduceMotion ? 250 : 420, easing: "ease-out" },
  );
}

/**
 * 유튜브 iframe의 getCurrentTime()은 매 프레임 바뀌지 않고 띄엄띄엄 갱신된다.
 * 박수처럼 짧은 간격에 맞추려면 그대로 쓰면 늦게 터지므로, 마지막으로 값이
 * 바뀐 순간을 기준점으로 잡고 재생 중이면 흐른 시간만큼 앞으로 추정한다.
 */
function useClapCount(
  lineStart: number,
  claps: readonly number[],
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
      // 앞뒤로 seek해도 맞도록 매번 "지금까지 지나간 박수 수"를 새로 센다.
      const passed = claps.filter((offset) => lineStart + offset <= time);
      setCount(passed.length);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [enabled, getCurrentTime, isPlaying, lineStart, claps]);

  return enabled ? count : 0;
}

/**
 * 가사 원문 속 ✋를 박수 타이밍(line.claps)에 맞춰 하나씩 "짝" 치는
 * 애니메이션으로 보여준다. 재생 중인 줄일 때만 동작하고, 그 외에는 평범한
 * 텍스트처럼 보인다.
 * - 아직 칠 차례가 아닌 ✋: 흐리게
 * - 타이밍이 된 ✋: 튀어 오르며 파동이 퍼진 뒤 밝게 유지
 * - 박수가 터질 때마다 가사 줄 배경이 울림(pulseLine)
 */
export function ClapText({
  text,
  lineStart,
  claps,
  isActive,
}: {
  text: string;
  lineStart: number;
  claps: readonly number[];
  isActive: boolean;
}) {
  const count = useClapCount(lineStart, claps, isActive && claps.length > 0);
  const pieces = text.split(CLAP);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const lastCountRef = useRef(0);

  // 박수 수가 늘어날 때만(= 새 박수가 터짐) 줄 배경을 울린다. 뒤로 seek해서
  // 줄어들 땐 조용히 기준만 맞춘다.
  useEffect(() => {
    if (count > lastCountRef.current) {
      const line = anchorRef.current?.closest("li");
      if (line) pulseLine(line);
    }
    lastCountRef.current = count;
  }, [count]);

  return (
    <span ref={anchorRef}>
      {pieces.map((piece, index) => {
        const isLast = index === pieces.length - 1;
        const hasTiming = index < claps.length;
        const state =
          !isActive || !hasTiming ? "idle" : index < count ? "hit" : "pending";

        return (
          <Fragment key={index}>
            <ClapPiece text={piece} betweenClaps={index > 0 && !isLast} />
            {!isLast && (
              <span
                data-clap={state}
                className={cn(
                  "relative inline-block transition-[opacity,filter] duration-150",
                  state === "pending" && "opacity-35 grayscale",
                  // 상태가 hit으로 바뀌는 순간 애니메이션이 새로 붙어 처음부터 재생된다.
                  state === "hit" &&
                    "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border-2 after:border-[#6dd6fc] after:opacity-0 motion-safe:animate-[clap-pop_380ms_ease-out] motion-safe:after:animate-[clap-ring_480ms_ease-out]",
                )}
              >
                {CLAP}
              </span>
            )}
          </Fragment>
        );
      })}
    </span>
  );
}

function ClapPiece({
  text,
  betweenClaps,
}: {
  text: string;
  betweenClaps: boolean;
}) {
  const gapClass = betweenClaps ? getClapGapClass(text) : null;
  if (!gapClass) return <>{text}</>;

  // 공백 문자를 없애고 폭만 남기므로, 긴 박수 줄이 좁은 화면에서도
  // 간격 자리에서 줄바꿈될 수 있게 <wbr />로 줄바꿈 지점을 남긴다.
  return (
    <>
      <span aria-hidden className={cn("inline-block", gapClass)} />
      <wbr />
    </>
  );
}
