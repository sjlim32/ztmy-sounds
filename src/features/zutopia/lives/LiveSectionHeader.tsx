import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LIVE_SECTION_TITLE_SHADOW } from "@/features/zutopia/lives/surface";

/**
 * 공연·투어 상세의 구역 제목 줄 — 카드 밖에 제목(왼쪽), 개수 같은 흐린 고정폭 글자와 버튼
 * (오른쪽), 아래 밑줄. 투어 세트리스트·공연 일정·고른 날짜의 세트리스트가 모두 이 줄을
 * 써서 구역마다 모양이 같다. 배경 그림 위에서도 읽히게 글자 그림자. 카드 안엔 목록만.
 */
export function LiveSectionHeader({
  title,
  meta = null,
  action = null,
}: {
  title: ReactNode;
  /** 오른쪽 흐린 글자("15곡", "13회") */
  meta?: ReactNode;
  /** 오른쪽 버튼(세트리스트 비교하기 등) — meta 앞 */
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 border-b border-white/15 pb-2",
        "tablet:pb-3",
        LIVE_SECTION_TITLE_SHADOW,
      )}
    >
      <div
        className={cn(
          "min-w-0 text-base font-semibold text-white",
          "tablet:text-lg",
        )}
      >
        {title}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {action}
        {meta != null && (
          <span className="text-sm text-white/60 tabular-nums">{meta}</span>
        )}
      </div>
    </div>
  );
}
