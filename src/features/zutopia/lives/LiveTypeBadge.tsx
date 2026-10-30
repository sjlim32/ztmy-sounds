import { cn } from "@/lib/utils";
import type { Live } from "./types";

// "TOUR"은 lives.type에는 없는 값이다 — tours 테이블 항목(투어)은
// lives.type 값을 안 갖고 있어서, 종류를 하나 늘려 표현한다.
// 단독 콘서트(CONCERT)와 투어(TOUR) 모두 "CONCERT"로 통일해 표기한다.
export type LiveBadgeType = Live["type"] | "TOUR";

// 티켓의 다른 항목 이름(DATE, VENUE 등)과 같은 영문 대문자 + 점 색으로 구분.
const LABEL: Record<LiveBadgeType, string> = {
  FESTIVAL: "Festival",
  CONCERT: "Concert",
  EVENT: "Event",
  TOUR: "Concert",
};
// 콘서트는 분홍 — 마젠타는 바로 옆 내한 태그 색이라 겹치지 않게.
const DOT: Record<LiveBadgeType, string> = {
  FESTIVAL: "bg-ztmy-purple",
  CONCERT: "bg-ztmy-pink",
  EVENT: "bg-ztmy-sky",
  TOUR: "bg-ztmy-pink",
};

/**
 * 공연/투어 상세 티켓(LiveTicket) 맨 위 줄의 공연 종류 — 면 없이 점 색 + 영문
 * 대문자(티켓 항목 이름과 같은 결). 예전엔 제목 위에 따로 떠 있는 알약이었는데,
 * 티켓 정보와 한 덩어리로 읽히게 티켓 안으로 옮겼다.
 */
export function LiveTypeBadge({ type }: { type: LiveBadgeType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs font-bold tracking-[0.25em] text-white uppercase",
        "tablet:text-sm",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", DOT[type])} />
      {LABEL[type]}
    </span>
  );
}
