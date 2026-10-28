"use client";

import { Fragment, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CALL_TAG_COLOR } from "@/features/guide/lib/call-tag-style";
import { pulseLine, useAccentCount } from "@/features/guide/lib/accent-pulse";

export const CLAP = "✋";
const CLAP_COLOR = CALL_TAG_COLOR.clap;

/**
 * ✋와 ✋ 사이 간격 표기 — 데이터에 적은 문자를 화면에선 빈 간격으로 바꿔 그린다.
 * 띄어쓰기는 짧은 쉼(0.4em), 슬래시(/)는 긴 쉼(1em). 붙여 쓴 ✋✋는 간격 없음.
 */
function getClapGapClass(between: string): string | null {
  if (!/^[\s/]+$/.test(between)) return null; // ✋ 사이에 다른 글자가 있으면 그대로 표시
  return between.includes("/") ? "w-[1em]" : "w-[0.4em]";
}

/**
 * 발음 줄 속 ✋를 강조 타이밍(line.accents)에 맞춰 하나씩 "짝" 치는
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
  const count = useAccentCount(lineStart, claps, isActive && claps.length > 0);
  const pieces = text.split(CLAP);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const lastCountRef = useRef(0);

  // 박수 수가 늘어날 때만(= 새 박수가 터짐) 줄 배경을 울린다. 뒤로 seek해서
  // 줄어들 땐 조용히 기준만 맞춘다.
  useEffect(() => {
    if (count > lastCountRef.current) {
      const line = anchorRef.current?.closest("li");
      if (line) pulseLine(line, CLAP_COLOR, { ring: true });
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
                  // 박수 묶음이 앞 글자(このまま 등)에 붙어 보이지 않게 첫 ✋ 앞을 띄운다.
                  index === 0 && "ml-[0.5em]",
                  // 재생 중인 줄의 ✋는 처음부터 끝까지 같은 합성 레이어에서
                  // 그린다 — 튀어 오르는 애니메이션(transform)·흑백 필터가
                  // 붙었다 떨어질 때마다 브라우저가 이모지를 다른 방식으로 다시
                  // 그려서, 애니메이션이 끝난 직후 크기가 미세하게 바뀌어
                  // 흔들려 보였다. 필터도 같은 이유로 늘 걸어 두고 값만 바꾼다.
                  isActive &&
                    "grayscale-0 will-change-[transform,opacity,filter]",
                  state === "pending" && "opacity-35 grayscale",
                  // 상태가 hit으로 바뀌는 순간 애니메이션이 새로 붙어 처음부터
                  // 재생된다 — ✋가 튀어 오르고, 같은 ✋ 잔상이 커지며 사라진다.
                  state === "hit" &&
                    "after:pointer-events-none after:absolute after:inset-0 after:flex after:items-center after:justify-center after:opacity-0 after:content-['✋'] motion-safe:animate-[clap-pop_380ms_ease-out] motion-safe:after:animate-[clap-ghost_520ms_ease-out]",
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
