import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 사이트 공용 구역 제목 줄 — 카드 밖에 제목(왼쪽), 개수 같은 흐린 고정폭 글자와 버튼
 * (오른쪽), 아래 밑줄. 구역마다 "제목 줄 + 카드 하나"로 모양을 맞춘다(투어 상세의 세트리스트·
 * 공연 일정, 공연 정보의 투어 규모·전체 일정 등). 배경 그림 위에서도 읽히게 글자 그림자.
 * 문서 구조상 제목이어야 하면 title에 <h3> 등을 넘긴다.
 */
export function SectionHeader({
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
        "drop-shadow-legible",
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
