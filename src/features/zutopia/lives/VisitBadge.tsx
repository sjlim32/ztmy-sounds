import { cn } from "@/lib/utils";
import { formatVisitLabel } from "@/features/zutopia/lives/visit";
import {
  LIVE_TAG_CLASS,
  LIVE_TAG_TONE,
} from "@/features/zutopia/lives/surface";

/**
 * 내한 공연 강조 태그("두 번째 내한") — 세트리스트·공연 일정 태그(LIVE_TAG_CLASS)와
 * 같은 모양(알약·테두리 없음)에 마젠타(홈의 내한 색)로 꽉 채워 눈에 띄게 한다.
 * 상세는 티켓 맨 위 줄의 공연 종류 바로 옆(LiveTicket), 목록은 카드 그림 왼쪽
 * 위에 얹는다.
 */
export function VisitBadge({
  ordinal,
  size = "sm",
  className,
}: {
  ordinal: number;
  /** lg: 상세 티켓 맨 위 줄 — 옆 공연 종류(PC 14px)와 크기를 맞춘다. */
  size?: "sm" | "lg";
  /** 목록 카드처럼 그림 위에 얹을 때 위치·그림자를 더한다. */
  className?: string;
}) {
  return (
    <span
      className={cn(
        LIVE_TAG_CLASS,
        LIVE_TAG_TONE.visit,
        size === "lg" && "tablet:h-6 tablet:px-2 tablet:text-sm",
        className,
      )}
    >
      {formatVisitLabel(ordinal)}
    </span>
  );
}
