import { cn } from "@/lib/utils";
import type { Live } from "./types";

// "TOUR"은 lives.type에는 없는 값이다 — tours 테이블 항목(투어/단독 공연)은
// lives.type 값을 안 갖고 있어서, 뱃지 종류를 하나 늘려 표현한다.
export type LiveBadgeType = Live["type"] | "TOUR";

// 페스티벌/콘서트/행사/투어를 한눈에 구분하는 점 색 — 텍스트는 항상
// 흰색으로 고정하고(배경색 대비 걱정 없이) 점 색으로만 구분한다.
const LABEL: Record<LiveBadgeType, string> = {
  FESTIVAL: "페스티벌",
  CONCERT: "콘서트",
  EVENT: "행사",
  TOUR: "단독 공연",
};
const DOT: Record<LiveBadgeType, string> = {
  FESTIVAL: "bg-ztmy-pink",
  CONCERT: "bg-ztmy-magenta",
  EVENT: "bg-ztmy-sky",
  TOUR: "bg-ztmy-magenta",
};

/**
 * 공연/투어 상세 페이지 포스터 코너에 붙는 타입 뱃지 — DefaultLiveContent와
 * DefaultTourContent가 똑같은 모양(검은 반투명 pill + 점 색 + 라벨)을 쓰도록
 * 여기 하나로 뺐다. 전에는 두 파일이 각자 비슷하지만 미묘하게 다른 뱃지를
 * 그려서(투어 쪽은 배경을 항상 마젠타로 꽉 채우는 등) 같은 상세 페이지
 * 계열인데도 디자인이 어긋나 보였다.
 */
export function LiveTypeBadge({ type }: { type: LiveBadgeType }) {
  return (
    <span
      className={cn(
        "absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm",
        "font-mono text-xs tracking-[0.2em] text-white uppercase",
        "tablet:top-4 tablet:left-4 tablet:px-3.5 tablet:py-1.5 tablet:text-sm",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          "tablet:h-2 tablet:w-2",
          DOT[type],
        )}
      />
      {LABEL[type]}
    </span>
  );
}
