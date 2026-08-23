"use client";

import { useId } from "react";
import type { Remaining } from "@/lib/guide/countdown";
import {
  DONE_AFTER_HOURS,
  useEventCountdown,
} from "@/lib/guide/event-countdown";
import type { VisitEvent } from "@/data/event";
import clsx from "clsx";

interface CountdownProps {
  event: VisitEvent;
}

export function Countdown({ event }: CountdownProps) {
  const { remaining, hoursSincePast } = useEventCountdown(event);

  if (!remaining) return null;

  return (
    <div
      data-role="countdown"
      className={clsx(
        "flex w-full items-center justify-center gap-3 rounded-md bg-black/40 p-4",
        "tablet:gap-4 tablet:bg-transparent",
      )}
    >
      <WaterBalloon remaining={remaining} hoursSincePast={hoursSincePast} />

      <div className="tablet:space-y-1 space-y-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        {remaining.isPast ? (
          hoursSincePast < DONE_AFTER_HOURS ? (
            <p className="tablet:text-sm text-xs font-medium text-white">
              공연이 시작되었습니다 !!
            </p>
          ) : (
            <>
              <p className="tablet:text-sm text-xs font-medium text-white">
                다음 내한을 기다려주세요 !
              </p>
              <p
                className={clsx(
                  "mt-1 flex items-baseline gap-3 font-mono text-base font-bold text-white/60 tabular-nums",
                  "tablet:text-xl",
                )}
              >
                <span className="inline-flex items-baseline gap-0.5">
                  <span>+</span>
                  <span>{remaining.days}</span>
                  <span className="text-xs font-normal">일</span>
                </span>
                <span className="inline-flex items-baseline gap-0.5">
                  <span>{String(remaining.hours).padStart(2, "0")}</span>
                  <span className="text-xs font-normal">시</span>
                </span>
                <span className="inline-flex items-baseline gap-0.5">
                  <span>{String(remaining.minutes).padStart(2, "0")}</span>
                  <span className="text-xs font-normal">분</span>
                </span>
                <span className="inline-flex items-baseline gap-0.5">
                  <span>{String(remaining.seconds).padStart(2, "0")}</span>
                  <span className="text-xs font-normal">초</span>
                </span>
              </p>
            </>
          )
        ) : (
          <>
            <p className="tablet:text-xs font-mono text-[9px] tracking-[0.3em] text-white/50 uppercase">
              공연까지
            </p>
            <p
              className={clsx(
                "flex items-baseline gap-1.5 font-mono text-base font-bold text-white tabular-nums",
                "tablet:gap-3 tablet:text-2xl",
              )}
            >
              <span className="tablet:gap-1 inline-flex items-baseline gap-0.5">
                <span>
                  {String(remaining.days * 24 + remaining.hours).padStart(
                    2,
                    "0",
                  )}
                </span>
                <span className="tablet:text-[10px] text-[8px] font-normal text-white/50">
                  시
                </span>
              </span>
              <span className="tablet:gap-1 inline-flex items-baseline gap-0.5">
                <span>{String(remaining.minutes).padStart(2, "0")}</span>
                <span className="tablet:text-[10px] text-[8px] font-normal text-white/50">
                  분
                </span>
              </span>
              <span className="tablet:gap-1 inline-flex items-baseline gap-0.5">
                <span>{String(remaining.seconds).padStart(2, "0")}</span>
                <span className="tablet:text-[10px] text-[8px] font-normal text-white/50">
                  초
                </span>
              </span>
            </p>
            <span className="tablet:w-28 relative mt-1 block h-1 w-20 overflow-hidden bg-white/15">
              <span className="from-ztmy-pink to-ztmy-purple absolute inset-y-0 left-0 w-full bg-linear-to-r" />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/*====================== 남은 기간 물풍선 ======================*/

const EMPTY_AT_DAYS = 90; // 물풍선이 다 차기까지 걸리는 시간

function WaterBalloon({
  remaining,
  hoursSincePast,
}: {
  remaining: Remaining;
  hoursSincePast: number;
}) {
  // 공연 시작 2시간 후까지는 "당일"(TODAY) 취급, 그 이후엔 "종료".
  const isDone = remaining.isPast && hoursSincePast >= DONE_AFTER_HOURS;
  const isToday = !isDone && (remaining.days === 0 || remaining.isPast);

  const totalSeconds =
    remaining.days * 86400 +
    remaining.hours * 3600 +
    remaining.minutes * 60 +
    remaining.seconds;
  const fillFraction = isDone
    ? 0
    : isToday
      ? 1
      : 1 - Math.min(totalSeconds / (EMPTY_AT_DAYS * 86400), 1);

  const waterY = 92 - fillFraction * 84;

  // Countdown이 모바일/데스크톱 레이아웃용으로 동시에 두 번 렌더링되기 때문에 인스턴스마다 고유한 id를 만들어 사용합니다.
  const uid = useId();
  const balloonClipId = `balloon-clip-${uid}`;
  const waterGradientId = `water-gradient-${uid}`;
  const fireGradientId = `fire-gradient-${uid}`;

  return (
    <div className="tablet:h-24 tablet:w-24 relative h-16 w-16 shrink-0 overflow-visible drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <defs>
          <clipPath id={balloonClipId}>
            <circle cx="50" cy="50" r="42" />
          </clipPath>
          {/* 원(y=8~92) 고정 좌표 기준 그라데이션 */}
          <linearGradient
            id={waterGradientId}
            gradientUnits="userSpaceOnUse"
            x1="50"
            y1="8"
            x2="50"
            y2="92"
          >
            <stop offset="0%" stopColor="var(--ztmy-pink)" />
            <stop offset="100%" stopColor="var(--ztmy-purple)" />
          </linearGradient>
          {isToday && (
            <linearGradient
              id={fireGradientId}
              gradientUnits="userSpaceOnUse"
              x1="50"
              y1="8"
              x2="50"
              y2="92"
            >
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="45%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          )}
        </defs>

        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-white/10"
        />

        <g clipPath={`url(#${balloonClipId})`}>
          <WaveFill waterY={waterY} gradientId={waterGradientId} />
        </g>

        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={isToday ? `url(#${fireGradientId})` : "currentColor"}
          strokeWidth={isToday ? "3" : "2"}
          strokeDasharray={isDone ? "4 3" : undefined}
          className={
            isToday
              ? "animate-[fire-glow_1.4s_ease-in-out_infinite]"
              : "text-white/20"
          }
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isDone ? (
          <span className="tablet:text-2xl font-mono text-base font-bold text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            -
          </span>
        ) : isToday ? (
          <span className="tablet:text-lg font-mono text-[10px] font-bold tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            TODAY
          </span>
        ) : (
          <>
            <span className="tablet:text-2xl font-mono text-base font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {remaining.days}
            </span>
            <span className="tablet:text-[10px] text-[7px] tracking-widest text-white/80 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              일 남음
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// 물결 웨이브 도형: -25~125 구간(6주기)을 그려서, x축으로 -25px만큼
// 애니메이션시켜도(한 주기) 빈틈 없이 이어지도록 여유를 둡니다. 아래쪽 사각형은
// 수위가 원 상단 가까이(가득 찬 상태) 있어도 원 하단까지 항상 덮도록 충분히 깊게.
const WAVE_PATH =
  "M -25 0 Q -18.75 -3 -12.5 0 Q -6.25 3 0 0 Q 6.25 -3 12.5 0 Q 18.75 3 25 0 " +
  "Q 31.25 -3 37.5 0 Q 43.75 3 50 0 Q 56.25 -3 62.5 0 Q 68.75 3 75 0 " +
  "Q 81.25 -3 87.5 0 Q 93.75 3 100 0 Q 106.25 -3 112.5 0 Q 118.75 3 125 0 " +
  "L 125 200 L -25 200 Z";

function WaveFill({
  waterY,
  gradientId,
}: {
  waterY: number;
  gradientId: string;
}) {
  return (
    <>
      {/* 뒤쪽 웨이브: 살짝 투명하고 느리게, 앞쪽과 다른 위상으로 깊이감 */}
      <g style={{ transform: `translateY(${waterY - 1.5}px)` }}>
        <path
          d={WAVE_PATH}
          fill={`url(#${gradientId})`}
          fillOpacity={0.5}
          className="animate-[wave-flow_5s_linear_infinite_reverse]"
        />
      </g>
      {/* 앞쪽 웨이브 */}
      <g style={{ transform: `translateY(${waterY}px)` }}>
        <path
          d={WAVE_PATH}
          fill={`url(#${gradientId})`}
          className="animate-[wave-flow_3s_linear_infinite]"
        />
      </g>
    </>
  );
}
