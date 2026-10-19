export type TicketRoundState =
  "upcoming" | "applying" | "drawing" | "payment" | "ended";

export interface TicketScheduleRound {
  id: string;
  name: string;
  applyStart: string; // ISO 8601 with +09:00 timezone
  applyEnd: string;
  applyLabel: string;
  paymentStart: string;
  paymentEnd: string;
  paymentLabel: string;
  limit: string;
  links?: {
    name: string;
    href: string;
  }[];
}

export const TICKET_SCHEDULE_NOTE =
  "※ 여러 공연을 원하는 경우, 반드시 한 번의 신청에 모두 포함하여 신청해야 합니다.";

export const TICKET_PRESALE_SCHEDULE: TicketScheduleRound[] = [
  {
    id: "premium-1st",
    name: "PREMIUM 최속 선행",
    applyStart: "2026-10-16T21:00:00+09:00",
    applyEnd: "2026-10-29T23:59:59+09:00",
    applyLabel: "10/16(금) 21:00 ~ 10/29(목) 23:59",
    paymentStart: "2026-11-07T18:00:00+09:00",
    paymentEnd: "2026-11-10T23:59:59+09:00",
    paymentLabel: "11/7(토) 18:00 ~ 11/10(화) 23:59",
    limit: "1공연당 2매까지 (동반자는 비회원 가능, 지정석 접수)",
    links: [
      {
        name: "국내 신청 바로가기",
        href: "https://zutomayo.net/apicula-denki_apply_pre/",
      },
      {
        name: "Apply (Outside Japan)",
        href: "https://zutomayo.net/apicula-denki_apply_pre_en/",
      },
    ],
  },
  {
    id: "premium-2nd",
    name: "PREMIUM 2차 선행",
    applyStart: "2026-11-07T20:00:00+09:00",
    applyEnd: "2026-11-09T23:59:59+09:00",
    applyLabel: "11/7(토) 20:00 ~ 11/9(월) 23:59",
    paymentStart: "2026-11-17T18:00:00+09:00",
    paymentEnd: "2026-11-20T23:59:59+09:00",
    paymentLabel: "11/17(화) 18:00 ~ 11/20(금) 23:59",
    limit: "1공연당 2매까지",
  },
  {
    id: "general-fastest",
    name: "일반 최속 선행",
    applyStart: "2026-11-17T20:00:00+09:00",
    applyEnd: "2026-11-29T23:59:59+09:00",
    applyLabel: "11/17(화) 20:00 ~ 11/29(일) 23:59",
    paymentStart: "2026-12-05T18:00:00+09:00",
    paymentEnd: "2026-12-08T23:59:59+09:00",
    paymentLabel: "12/5(토) 18:00 ~ 12/8(화) 23:59",
    limit: "1공연당 4매까지",
  },
  {
    id: "premium-upgrade",
    name: "프리미엄석 Upgrade",
    applyStart: "2026-12-01T20:00:00+09:00",
    applyEnd: "2026-12-06T23:59:59+09:00",
    applyLabel: "12/1(화) 20:00 ~ 12/6(일) 23:59",
    paymentStart: "2026-12-12T18:00:00+09:00",
    paymentEnd: "2026-12-15T23:59:59+09:00",
    paymentLabel: "12/12(토) 18:00 ~ 12/15(화) 23:59",
    limit: "PREMIUM 선행(1차·2차) 지정석 구매 회원 대상 (1공연당 2매)",
  },
];

/**
 * 현지(JST/KST) 기준 티켓 회차의 현재 상태를 계산한다.
 */
export function getTicketRoundState(
  round: TicketScheduleRound,
  nowMs: number,
): TicketRoundState {
  const applyStartMs = Date.parse(round.applyStart);
  const applyEndMs = Date.parse(round.applyEnd);
  const paymentStartMs = Date.parse(round.paymentStart);
  const paymentEndMs = Date.parse(round.paymentEnd);

  if (nowMs < applyStartMs) return "upcoming";
  if (nowMs <= applyEndMs) return "applying";
  if (nowMs < paymentStartMs) return "drawing";
  if (nowMs <= paymentEndMs) return "payment";
  return "ended";
}

/**
 * 마감일까지 남은 일수(D-Day)를 계산한다.
 */
export function getDaysRemaining(targetIso: string, nowMs: number): number {
  const targetMs = Date.parse(targetIso);
  const diffMs = targetMs - nowMs;
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}
