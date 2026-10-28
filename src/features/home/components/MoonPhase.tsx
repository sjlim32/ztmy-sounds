"use client";

import { useId } from "react";
import type { Remaining } from "@/features/home/lib/countdown";
import { EMPTY_AT_DAYS } from "@/features/home/lib/event-countdown";

/**
 * 원정(Next Stage)용 카운트다운 비주얼. WaterBalloon과 같은 구조(원 안에 남은
 * 기간을 0→1로 채워가다가 당일엔 강조, 종료되면 흐려짐)를 공유하되, 하늘색/
 * 노랑 팔레트에 맞춰 초승달에서 보름달로 차오르는 달의 위상으로 표현합니다.
 *
 * fillFraction(0~1)을 달의 위상에 대응시킵니다: 0=신월(빈 원), 0.5=반달,
 * 1=보름달. cos(π·fillFraction)으로 이지러진 경계(terminator)의 가로 반지름을
 * 계산해 왼쪽 절반 원 + 타원 호 두 개로 위상 실루엣을 그립니다 — 왼쪽 절반을
 * 고정해두고 타원이 오른쪽으로 자라나게 해서, 달이 왼쪽부터 오른쪽으로 참니다.
 */
export function MoonPhase({
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
  // EMPTY_AT_DAYS(100일) 전부터 남은 기간에 비례해 차오른다 — 물풍선과 같은
  // 기준이라 D-80이면 20%, D-50이면 반달.
  const rawFraction = 1 - Math.min(totalSeconds / (EMPTY_AT_DAYS * 86400), 1);
  const fillFraction = isDone ? 0 : isToday ? 1 : rawFraction;

  // x: 1(신월, 좌측 절반이 그림자에 완전히 덮여 면적 0) -> 0(반달) -> -1(보름, 우측까지 채워져 원 전체)
  // cos 매핑 대신 선형으로: cos는 양 끝(0/1)에서 기울기가 0이라 처음과 마지막
  // 며칠의 변화가 거의 안 보인다.
  const x = 1 - 2 * fillFraction;
  const terminatorRx = 42 * Math.abs(x);
  // 두 번째 호는 첫 번째 호와 반대 방향(아래→위)으로 그려져서, sweep 값과
  // 실제로 휘는 방향의 대응이 첫 번째 호와 반대로 뒤집힙니다. 같은 sweep=0/1을
  // 그대로 쓰면 신월/보름달이 뒤바뀝니다.
  const terminatorSweep = x >= 0 ? 1 : 0;
  const moonPathD = `M 50 8 A 42 42 0 0 0 50 92 A ${terminatorRx} 42 0 0 ${terminatorSweep} 50 8 Z`;

  // Countdown이 모바일/데스크톱 레이아웃용으로 동시에 두 번 렌더링되기 때문에 인스턴스마다 고유한 id를 만들어 사용합니다.
  const uid = useId();
  const moonGradientId = `moon-gradient-${uid}`;
  const fireGradientId = `moon-fire-gradient-${uid}`;

  return (
    <div className="tablet:h-24 tablet:w-24 tablet:xlow:h-20 tablet:xlow:w-20 relative h-16 w-16 shrink-0 overflow-visible drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
      <svg
        viewBox="0 0 100 100"
        className="relative h-full w-full overflow-visible"
      >
        <defs>
          {/* 달빛은 하늘색을 섞지 않고 노랑 한 색상 안에서 채도만 조절합니다 —
          방금 차오르기 시작한 왼쪽은 옅고 뿌옇게, 이미 차 있던 오른쪽은 짙고
          선명하게. */}
          <linearGradient
            id={moonGradientId}
            gradientUnits="userSpaceOnUse"
            x1="8"
            y1="50"
            x2="92"
            y2="50"
          >
            <stop offset="0%" stopColor="#fff8e1" />
            <stop offset="100%" stopColor="var(--ztmy-sun)" />
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

        <path d={moonPathD} fill={`url(#${moonGradientId})`} />

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

      {/* 달 내부 글자는 흰색 채우기 + ztmy-dark 테두리(-webkit-text-stroke)로
      이중 대비를 만듭니다. 달이 덜 찼을 땐 배경(어두운 페이지)에 흰 글자가,
      다 찼을 땐 노란 달빛 위에 짙은 보라 테두리가 각각 대비를 담당합니다. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center [-webkit-text-stroke:0.1px_var(--ztmy-dark)]">
        {isDone ? (
          <span className="tablet:text-3xl font-mono text-lg font-extrabold text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            -
          </span>
        ) : isToday ? (
          <span className="tablet:text-2xl font-mono text-sm font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            D-DAY
          </span>
        ) : (
          <span className="tablet:text-2xl font-mono text-sm font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            D-{daysUntilEvent}
          </span>
        )}
      </div>
    </div>
  );
}
