import { cn } from "@/lib/utils";
import { formatVisitLabel } from "@/features/zutopia/lives/visit";

/**
 * 내한 공연 강조 뱃지 — LiveTypeBadge와 같은 pill 모양이지만, 타입 뱃지
 * (반투명 검정)와 나란히 놓였을 때 한눈에 튀도록 ztmy-sun으로 꽉 채운다.
 */
export function VisitBadge({ ordinal }: { ordinal: number }) {
  return (
    <span
      className={cn(
        "bg-ztmy-sun inline-flex items-center rounded-full px-3 py-1",
        "text-xs font-bold tracking-[0.1em] text-black",
        "tablet:px-3.5 tablet:py-1.5 tablet:text-sm",
      )}
    >
      {formatVisitLabel(ordinal)}
    </span>
  );
}
