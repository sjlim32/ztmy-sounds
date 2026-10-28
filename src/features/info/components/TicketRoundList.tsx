import { cn } from "@/lib/utils";
import {
  ACTION_BUTTON_CLASS,
  LINK_BUTTON_CLASS,
} from "@/components/button-styles";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import {
  TICKET_PRESALE_SCHEDULE,
  getDaysRemaining,
  getTicketRoundState,
  type TicketRoundState,
} from "@/features/info/data/ticket-schedule";

const STATE_LABEL: Record<TicketRoundState, string> = {
  upcoming: "접수 예정",
  applying: "접수 중",
  drawing: "추첨 대기",
  payment: "당락·입금 중",
  ended: "마감",
};

/** 티켓 접수가 하나라도 아직 끝나지 않았는지(입금 기간까지 포함). */
export function isTicketScheduleOngoing(nowMs: number): boolean {
  return TICKET_PRESALE_SCHEDULE.some(
    (round) => getTicketRoundState(round, nowMs) !== "ended",
  );
}

/** 지금 접수 중인 회차(없으면 undefined). */
export function getApplyingRound(nowMs: number) {
  return TICKET_PRESALE_SCHEDULE.find(
    (round) => getTicketRoundState(round, nowMs) === "applying",
  );
}

/**
 * 홈 공연 안내 패널용 티켓 접수 일정 — /info의 TicketSchedule을 좁은 자리에
 * 맞게 줄인 목록. /info처럼 접수 중인 회차는 분홍, 당락·입금 중인 회차는
 * 노랑으로 강조하고 끝난 회차는 흐리게 한다. 접수 중인 회차만 마감 D-day와
 * 신청 링크를 보여준다.
 */
export function TicketRoundList({ nowMs }: { nowMs: number }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {TICKET_PRESALE_SCHEDULE.map((round) => {
        const state = getTicketRoundState(round, nowMs);
        const isApplying = state === "applying";
        const isPayment = state === "payment";
        const daysLeft = isApplying
          ? getDaysRemaining(round.applyEnd, nowMs)
          : null;

        return (
          <li
            key={round.id}
            className={cn(
              "flex flex-col gap-1 rounded-lg border px-3 py-2",
              isApplying &&
                "border-ztmy-pink/50 bg-ztmy-pink/10 ring-ztmy-pink/40 ring-1",
              isPayment && "border-ztmy-sun/50 bg-ztmy-sun/10",
              !isApplying && !isPayment && "border-white/10 bg-black/20",
              state === "ended" && "opacity-50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold break-keep text-white">
                {round.name}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                  isApplying && "bg-ztmy-pink text-white",
                  isPayment && "bg-ztmy-sun text-black",
                  !isApplying &&
                    !isPayment &&
                    "border border-white/15 text-white/60",
                )}
              >
                {STATE_LABEL[state]}
                {daysLeft !== null &&
                  ` · ${daysLeft === 0 ? "오늘 마감" : `D-${daysLeft}`}`}
              </span>
            </div>
            <p className="font-mono text-xs text-white/75">
              <span className="text-white/50">접수 </span>
              {round.applyLabel}
            </p>
            {(isPayment || state === "drawing") && (
              <p className="font-mono text-xs text-white/75">
                <span className="text-white/50">입금 </span>
                {round.paymentLabel}
              </p>
            )}
            {/* 신청 링크 — /info처럼 첫 링크는 분홍 면, 나머지는 테두리 버튼 */}
            {isApplying && round.links && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {round.links.map((link, index) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      index === 0
                        ? ACTION_BUTTON_CLASS
                        : cn(LINK_BUTTON_CLASS, "py-0"),
                      "h-8 px-3 text-sm",
                    )}
                  >
                    {link.name}
                    <ExternalLinkIcon className="h-3 w-3 opacity-80" />
                  </a>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
