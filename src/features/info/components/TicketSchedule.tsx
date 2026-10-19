"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";
import {
  TICKET_PRESALE_SCHEDULE,
  TICKET_SCHEDULE_NOTE,
  getTicketRoundState,
  getDaysRemaining,
  type TicketRoundState,
} from "@/features/info/data/ticket-schedule";

const REFRESH_INTERVAL_MS = 30_000;

export function TicketSchedule() {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 현지 시각 기반 초기 상태 보정 (docs/CONVENTIONS.md)
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const activeRound = nowMs
    ? TICKET_PRESALE_SCHEDULE.find(
        (r) => getTicketRoundState(r, nowMs) === "applying",
      )
    : null;

  return (
    <div className="tablet:p-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/35 p-3.5 backdrop-blur-xs">
      {/* 카드 상단 헤더 */}
      <div className="tablet:flex-row tablet:items-center tablet:justify-between flex flex-col gap-1.5 border-b border-white/10 pb-3">
        <div>
          <h3 className="tablet:text-lg flex items-center gap-2 text-base font-bold text-white">
            <span className="bg-ztmy-pink h-2.5 w-2.5 rounded-full" />
            티켓 선행 접수 일정
          </h3>
          <p className="mt-0.5 text-xs text-white/60">
            공식 팬클럽 PREMIUM 선행 및 일반 선행 추첨 일정 안내
          </p>
        </div>

        {activeRound && (
          <div className="tablet:self-auto flex items-center gap-2 self-start">
            <span className="border-ztmy-pink/40 bg-ztmy-pink/15 text-ztmy-pink inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="bg-ztmy-pink absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-ztmy-pink relative inline-flex h-2 w-2 rounded-full" />
              </span>
              {activeRound.name} 진행 중
            </span>
          </div>
        )}
      </div>

      {/* 회차별 일정 목록 */}
      <div className="flex flex-col gap-2.5">
        {TICKET_PRESALE_SCHEDULE.map((round) => {
          const state: TicketRoundState = nowMs
            ? getTicketRoundState(round, nowMs)
            : "upcoming";
          const isApplying = state === "applying";
          const isPayment = state === "payment";
          const isDrawing = state === "drawing";
          const isEnded = state === "ended";
          const daysLeft =
            nowMs && isApplying
              ? getDaysRemaining(round.applyEnd, nowMs)
              : null;

          return (
            <div
              key={round.id}
              className={cn(
                "tablet:p-4 relative flex flex-col gap-2.5 rounded-xl border p-3.5 transition-all",
                isApplying &&
                  "border-ztmy-pink/50 from-ztmy-pink/15 ring-ztmy-pink/40 bg-linear-to-r via-black/40 to-black/30 shadow-[0_0_20px_rgba(255,107,157,0.12)] ring-1",
                isPayment &&
                  "border-ztmy-sun/50 from-ztmy-sun/15 ring-ztmy-sun/40 bg-linear-to-r via-black/40 to-black/30 ring-1",
                !isApplying &&
                  !isPayment &&
                  !isEnded &&
                  "border-white/10 bg-black/25",
                isEnded && "border-white/5 bg-black/20 opacity-55",
              )}
            >
              {/* 회차 타이틀 & 상태 뱃지 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-bold",
                      isApplying
                        ? "tablet:text-lg text-base text-white"
                        : "tablet:text-base text-sm text-white/90",
                    )}
                  >
                    {round.name}
                  </span>

                  {/* 상태 뱃지 */}
                  {isApplying && (
                    <span className="bg-ztmy-pink shadow-ztmy-pink/40 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                      </span>
                      접수 중
                    </span>
                  )}
                  {isPayment && (
                    <span className="bg-ztmy-sun rounded-full px-2.5 py-0.5 text-xs font-bold text-black">
                      당락·입금 중
                    </span>
                  )}
                  {isDrawing && (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                      추첨 대기
                    </span>
                  )}
                  {state === "upcoming" && (
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-medium text-white/50">
                      접수 예정
                    </span>
                  )}
                  {isEnded && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">
                      마감
                    </span>
                  )}
                </div>

                {/* 진행 중 마감 카운트다운 */}
                {isApplying && daysLeft !== null && (
                  <span className="border-ztmy-pink/30 bg-ztmy-pink/10 text-ztmy-pink rounded-md border px-2.5 py-0.5 font-mono text-xs font-semibold">
                    {daysLeft === 0 ? "오늘 마감" : `D-${daysLeft} 마감`}
                  </span>
                )}
              </div>

              {/* 일정 세부 정보 */}
              <div className="tablet:text-sm flex flex-col gap-1.5 text-xs">
                {/* 접수 기간 */}
                <div className="tablet:flex-row tablet:items-baseline tablet:gap-2 flex flex-col gap-0.5">
                  <span className="tablet:min-w-20 shrink-0 font-medium text-white/55">
                    접수 기간 :
                  </span>
                  <span
                    className={cn(
                      "font-mono",
                      isApplying ? "text-ztmy-pink font-bold" : "text-white/90",
                    )}
                  >
                    {round.applyLabel}
                  </span>
                </div>

                {/* 당락·입금 */}
                <div className="tablet:flex-row tablet:items-baseline tablet:gap-2 flex flex-col gap-0.5">
                  <span className="tablet:min-w-20 shrink-0 font-medium text-white/55">
                    당락·입금 :
                  </span>
                  <span
                    className={cn(
                      "font-mono",
                      isPayment ? "text-ztmy-sun font-bold" : "text-white/80",
                    )}
                  >
                    {round.paymentLabel}
                  </span>
                </div>

                {/* 매수 제한 및 유의사항 */}
                <div className="flex items-start gap-1 text-xs text-white/70">
                  <span className="text-white/40">•</span>
                  <span>{round.limit}</span>
                </div>
              </div>

              {/* 바로가기 신청 버튼 (진행 중일 때 강조) */}
              {round.links && round.links.length > 0 && (
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2 pt-2",
                    isApplying
                      ? "border-ztmy-pink/20 border-t"
                      : "border-t border-white/5",
                  )}
                >
                  {round.links.map((link, idx) => (
                    <SiteLink
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "tablet:text-sm rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
                        isApplying && idx === 0
                          ? "bg-ztmy-pink shadow-ztmy-pink/25 hover:bg-ztmy-pink/90 text-white shadow-md"
                          : isApplying
                            ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                            : "border border-white/10 bg-black/40 text-white/70 hover:text-white",
                      )}
                    >
                      {link.name}
                    </SiteLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 유의사항 안내 문구 */}
      <div className="border-t border-white/10 pt-2.5">
        <p className="text-xs text-white/55">{TICKET_SCHEDULE_NOTE}</p>
      </div>
    </div>
  );
}
