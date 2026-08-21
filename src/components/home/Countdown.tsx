"use client";

import { useEffect, useState } from "react";
import { getRemaining, type Remaining } from "@/lib/guide/countdown";
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

function WaterBalloon({ remaining }: { remaining: Remaining }) {
  // 24시간 이내(=날짜상 당일)로 남으면 무조건 가득 채우고 TODAY로 표시.
  const isToday = remaining.days === 0;

  const totalSeconds =
    remaining.days * 86400 +
    remaining.hours * 3600 +
    remaining.minutes * 60 +
    remaining.seconds;
  const fillFraction = isToday
    ? 1
    : 1 - Math.min(totalSeconds / (EMPTY_AT_DAYS * 86400), 1);

  // 원(cx=50, cy=50, r=42)은 y=8~92 사이에 걸쳐 있음.
  const waterY = 92 - fillFraction * 84;

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full">
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
              className="[animation:wave-flow_5s_linear_infinite_reverse]"
            />
          </g>
          {/* 앞쪽 웨이브 */}
          <g style={{ transform: `translateY(${waterY}px)` }}>
            <path
              d={WAVE_PATH}
              fill="url(#water-gradient)"
              className="[animation:wave-flow_3s_linear_infinite]"
            />
          </g>
        </g>

        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/20"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isToday ? (
          <span className="font-mono text-lg font-bold tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            TODAY
          </span>
        ) : (
          <>
            <span className="font-mono text-2xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {remaining.days}
            </span>
            <span className="text-[10px] tracking-widest text-white/80 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              일 남음
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function Countdown({ event }: { event: VisitEvent }) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  // event.date("YYYY.MM.DD") + event.time("HH:mm")을 조합해 목표 시각을 계산
  const targetIso = `${event.date.replace(/\./g, "-")}T${event.time}:00+09:00`;

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(targetIso));
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [targetIso]);

  if (!remaining) return null;

  if (remaining.isPast) {
    return (
      <div
        data-role="countdown"
        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center text-white/80 backdrop-blur-md"
      >
        공연이 시작되었습니다
      </div>
    );
  }

  return (
    <div
      data-role="countdown"
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm"
    >
      <WaterBalloon remaining={remaining} />

      <div className="space-y-1">
        <p className="text-xs tracking-widest text-white/40 uppercase">
          공연까지
        </p>
        <p className="flex items-baseline gap-3 font-mono text-xl font-semibold text-white tabular-nums">
          <span className="inline-flex items-baseline gap-1">
            <span>
              {String(remaining.days * 24 + remaining.hours).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-normal text-white/50">시</span>
          </span>
          <span className="inline-flex items-baseline gap-1">
            <span>{String(remaining.minutes).padStart(2, "0")}</span>
            <span className="text-[10px] font-normal text-white/50">분</span>
          </span>
          <span className="inline-flex items-baseline gap-1">
            <span>{String(remaining.seconds).padStart(2, "0")}</span>
            <span className="text-[10px] font-normal text-white/50">초</span>
          </span>
        </p>
      </div>
    </div>
  );
}
