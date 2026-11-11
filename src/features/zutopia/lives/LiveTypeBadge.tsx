import { cn } from "@/lib/utils";
import {
  ENTRY_TYPE_DOT,
  type ZutopiaEntryType,
} from "@/features/zutopia/types";
import type { Live } from "./types";

// "TOUR"은 lives.type에는 없는 값이다 — tours 테이블 항목(투어)은
// lives.type 값을 안 갖고 있어서, 종류를 하나 늘려 표현한다.
export type LiveBadgeType = Live["type"] | "TOUR";

// 공연 목록과 같은 세 종류(투어·페스티벌·콘서트)로 묶는다 — 페스티벌·투어가
// 아닌 lives.type(CONCERT·EVENT…)은 모두 콘서트.
function badgeEntryType(type: LiveBadgeType): ZutopiaEntryType {
  if (type === "TOUR") return "tour";
  if (type === "FESTIVAL") return "festival";
  return "concert";
}

// 티켓의 다른 항목 이름(DATE, VENUE 등)과 같은 영문 대문자.
const LABEL: Record<ZutopiaEntryType, string> = {
  tour: "Tour",
  festival: "Festival",
  concert: "Concert",
};

/**
 * 공연/투어 상세 티켓(LiveTicket) 맨 위 줄의 공연 종류 — 면 없이 점 색 + 영문
 * 대문자(티켓 항목 이름과 같은 결). 예전엔 제목 위에 따로 떠 있는 알약이었는데,
 * 티켓 정보와 한 덩어리로 읽히게 티켓 안으로 옮겼다.
 */
export function LiveTypeBadge({ type }: { type: LiveBadgeType }) {
  const entryType = badgeEntryType(type);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs font-bold tracking-[0.25em] text-white uppercase",
        "tablet:text-sm",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", ENTRY_TYPE_DOT[entryType])} />
      {LABEL[entryType]}
    </span>
  );
}
