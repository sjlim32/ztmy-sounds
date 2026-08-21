"use client";

import type { Remaining } from "@/lib/guide/countdown";
import {
  DONE_AFTER_HOURS,
  useEventCountdown,
} from "@/lib/guide/event-countdown";
import type { VisitEvent } from "@/data/event";

// "텅 빈" 상태의 기준이 되는 일수 — 이만큼 남아있으면 물이 거의 없고,
// 공연일에 가까워질수록 물이 차오릅니다.
const EMPTY_AT_DAYS = 90;

// 물결 웨이브 도형: -25~125 구간(6주기)을 그려서, x축으로 -25px만큼
// 애니메이션시켜도(한 주기) 빈틈 없이 이어지도록 여유를 둡니다. 아래쪽 사각형은
// 수위가 원 상단 가까이(가득 찬 상태) 있어도 원 하단까지 항상 덮도록 충분히 깊게.
const WAVE_PATH =
  "M -25 0 Q -18.75 -3 -12.5 0 Q -6.25 3 0 0 Q 6.25 -3 12.5 0 Q 18.75 3 25 0 " +
  "Q 31.25 -3 37.5 0 Q 43.75 3 50 0 Q 56.25 -3 62.5 0 Q 68.75 3 75 0 " +
  "Q 81.25 -3 87.5 0 Q 93.75 3 100 0 Q 106.25 -3 112.5 0 Q 118.75 3 125 0 " +
  "L 125 200 L -25 200 Z";

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

  // 원(cx=50, cy=50, r=42)은 y=8~92 사이에 걸쳐 있음.
  const waterY = 92 - fillFraction * 84;

  return (
    <div className="relative h-16 w-16 shrink-0 overflow-visible tablet:h-24 tablet:w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <defs>
          <clipPath id="balloon-clip">
            <circle cx="50" cy="50" r="42" />
          </clipPath>
          {/* 원(y=8~92) 고정 좌표 기준 그라데이션 — userSpaceOnUse가 아니면
              물결 도형 자체의 로컬 bbox 기준으로 계산돼서, 수위가 바뀔 때마다
              보이는 색 구간이 달라져 버립니다. */}
          <linearGradient
            id="water-gradient"
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
              id="fire-gradient"
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

        <g clipPath="url(#balloon-clip)">
          {/* 뒤쪽 웨이브: 살짝 투명하고 느리게, 앞쪽과 다른 위상으로 깊이감 */}
          <g style={{ transform: `translateY(${waterY - 1.5}px)` }}>
            <path
              d={WAVE_PATH}
              fill="url(#water-gradient)"
              fillOpacity={0.5}
              className="animate-[wave-flow_5s_linear_infinite_reverse]"
            />
          </g>
          {/* 앞쪽 웨이브 */}
          <g style={{ transform: `translateY(${waterY}px)` }}>
            <path
              d={WAVE_PATH}
              fill="url(#water-gradient)"
              className="animate-[wave-flow_3s_linear_infinite]"
            />
          </g>
        </g>

        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={isToday ? "url(#fire-gradient)" : "currentColor"}
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
          <span className="font-mono text-base font-bold text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tablet:text-2xl">
            -
          </span>
        ) : isToday ? (
          <span className="font-mono text-[10px] font-bold tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tablet:text-lg">
            TODAY
          </span>
        ) : (
          <>
            <span className="font-mono text-base font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tablet:text-2xl">
              {remaining.days}
            </span>
            <span className="text-[7px] tracking-widest text-white/80 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tablet:text-[10px]">
              일 남음
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function Countdown({ event }: { event: VisitEvent }) {
  const { remaining, hoursSincePast } = useEventCountdown(event);

  if (!remaining) return null;

  return (
    <div
      data-role="countdown"
      className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2.5 backdrop-blur-sm tablet:w-auto tablet:gap-4 tablet:p-4"
    >
      <WaterBalloon remaining={remaining} hoursSincePast={hoursSincePast} />

      <div className="space-y-0.5 tablet:space-y-1">
        {remaining.isPast ? (
          <p className="text-xs font-medium text-white/80 tablet:text-sm">
            {hoursSincePast < DONE_AFTER_HOURS
              ? "공연이 시작되었습니다"
              : "다음 내한을 기다려주세요 !"}
          </p>
        ) : (
          <>
            <p className="text-[9px] tracking-widest text-white/40 uppercase tablet:text-xs">
              공연까지
            </p>
            <p className="flex items-baseline gap-1.5 font-mono text-sm font-semibold text-white tabular-nums tablet:gap-3 tablet:text-xl">
              <span className="inline-flex items-baseline gap-0.5 tablet:gap-1">
                <span>
                  {String(remaining.days * 24 + remaining.hours).padStart(
                    2,
                    "0",
                  )}
                </span>
                <span className="text-[8px] font-normal text-white/50 tablet:text-[10px]">
                  시
                </span>
              </span>
              <span className="inline-flex items-baseline gap-0.5 tablet:gap-1">
                <span>{String(remaining.minutes).padStart(2, "0")}</span>
                <span className="text-[8px] font-normal text-white/50 tablet:text-[10px]">
                  분
                </span>
              </span>
              <span className="inline-flex items-baseline gap-0.5 tablet:gap-1">
                <span>{String(remaining.seconds).padStart(2, "0")}</span>
                <span className="text-[8px] font-normal text-white/50 tablet:text-[10px]">
                  초
                </span>
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
