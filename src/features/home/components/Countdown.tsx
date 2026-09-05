"use client";

import { useId } from "react";
import type { Remaining } from "@/features/home/lib/countdown";
import { EMPTY_AT_DAYS } from "@/features/home/lib/event-countdown";
import type { Event } from "@/data/event";
import { cn } from "@/lib/utils";
import { MoonPhase } from "@/features/home/components/MoonPhase";

interface CountdownProps {
  remaining: Remaining | null;
  isEventDay: boolean;
  daysUntilEvent: number;
  isDone: boolean;
  accent: Event["accent"];
}

/**
 * remaining 등을 event가 아니라 미리 계산된 값으로 직접 받습니다 — 홈 화면에
 * 모바일/데스크톱용으로 이 컴포넌트가 동시에 두 번 마운트되는데, 각자
 * useEventCountdown을 부르면 1초 타이머가 두 개 따로 돌게 되므로, 부모
 * (page.tsx)에서 한 번만 계산해 내려받습니다. accent에 따라 남은 기간을
 * 물풍선(내한)/달의 위상(원정)으로 다르게 시각화합니다.
 */
export function Countdown({
  remaining,
  isEventDay,
  daysUntilEvent,
  isDone,
  accent,
}: CountdownProps) {
  if (!remaining) return null;

  return (
    <div
      data-role="countdown"
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-lg bg-black/30 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
        "tablet:gap-4 tablet:p-4",
      )}
    >
      {/* 위쪽 날짜/장소 티켓 스텁과 같은 chrome(둥근 어두운 박스)을 써서 한
      세트처럼 보이도록 맞췄습니다. accent는 따로 띠를 얹지 않고, 이미 그
      자체로 색이 다른 물풍선/달 아이콘이 전달합니다. */}
      {accent === "away" ? (
        <MoonPhase
          remaining={remaining}
          isEventDay={isEventDay}
          daysUntilEvent={daysUntilEvent}
          isDone={isDone}
        />
      ) : (
        <WaterBalloon
          remaining={remaining}
          isEventDay={isEventDay}
          daysUntilEvent={daysUntilEvent}
          isDone={isDone}
        />
      )}

      <div className="tablet:space-y-1 space-y-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        {remaining.isPast ? (
          !isDone ? (
            <p className="tablet:text-sm text-xs font-medium text-white">
              공연이 시작되었습니다 !!
            </p>
          ) : (
            <>
              <p className="tablet:text-sm text-xs font-medium text-white">
                다음 내한을 기다려주세요 !
              </p>
              <p
                className={cn(
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
              className={cn(
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
          </>
        )}
      </div>
    </div>
  );
}

/*====================== 남은 기간 물풍선 (내한) ======================*/

function WaterBalloon({
  remaining,
  isEventDay,
  daysUntilEvent,
  isDone,
}: {
  remaining: Remaining;
  isEventDay: boolean;
  daysUntilEvent: number;
  isDone: boolean;
}) {
  // 공연 시작 2시간 후까지는 "당일"(TODAY) 취급, 그 이후엔 "종료".
  const isToday = !isDone && (isEventDay || remaining.isPast);

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
            <stop offset="0%" stopColor="var(--ztmy-magenta)" />
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
          <span className="tablet:text-xl font-mono text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            D-DAY
          </span>
        ) : (
          <span className="tablet:text-xl font-mono text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            D-{daysUntilEvent}
          </span>
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
