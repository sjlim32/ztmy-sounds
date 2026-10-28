import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ACTIVE_FILTER_CHIP_CLASS,
  FILTER_CHIP_CLASS,
} from "@/components/button-styles";

/**
 * 사이트 공용 필터 한 줄 — 왼쪽에 이름, 오른쪽에 필터 칩들. 가이드 곡 목록
 * (SongFilterBar)과 ZUTOPIA 곡·앨범·공연 목록(SortFilterBar)이 같이 쓴다.
 * 모바일은 칩이 많아도 줄바꿈하지 않고 칩 묶음만 가로로 넘긴다(글자가 꺾이거나
 * 칩 하나만 둘째 줄로 내려가지 않게). 태블릿 이상은 줄바꿈. wrap이면 모바일도
 * 가로로 넘기지 않고 줄바꿈한다(한눈에 다 보여야 하는 줄 — 공연 연도 등).
 *
 * 칩이 두 줄이 되어도 이름은 첫 줄 칩과 높이를 맞춘다(이름 줄 높이 = 칩 높이 32px).
 */
export function FilterRow({
  label,
  children,
  chipsClassName,
  className,
  wrap = false,
  ...groupProps
}: {
  label: string;
  children: ReactNode;
  /** 칩 묶음에 얹을 클래스(예: 화면 끝까지 넘어가게 바깥 여백만큼 넓히기). */
  chipsClassName?: string;
  className?: string;
  wrap?: boolean;
  role?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)} {...groupProps}>
      <span className="min-w-11 shrink-0 text-sm leading-8 font-medium whitespace-nowrap text-white/60">
        {label}
      </span>
      <div
        className={cn(
          "flex min-w-0",
          wrap
            ? // 최대한 한 줄에 들어가게 칩 사이를 조금 좁힌다.
              "flex-wrap gap-1"
            : "tablet:flex-wrap tablet:overflow-visible scrollbar-none gap-1.5 overflow-x-auto",
          chipsClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 필터 칩 하나 — 고른 칸은 마젠타로 옅게(FILTER_CHIP_CLASS). compact면 좌우
 * 여백을 줄인 작은 칩(옵션이 많은 줄을 최대한 한 줄에 넣을 때).
 */
export function FilterChip({
  active,
  onClick,
  compact = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        FILTER_CHIP_CLASS,
        compact && "px-1.5",
        active && ACTIVE_FILTER_CHIP_CLASS,
      )}
    >
      {children}
    </button>
  );
}
