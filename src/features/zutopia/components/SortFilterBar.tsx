"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FilterChip, FilterRow } from "@/components/FilterChips";

/**
 * 정렬/필터 줄(SortFilterBar)들을 감싸는 카드 — 곡·앨범·공연 목록이 모두 이걸
 * 써서 생김새·여백·줄 간격이 같다(FilterPanel). 배경 그림이 화려해서 옅은 흰
 * 면으로는 칩이 묻혀, 공연 상세 티켓(LIVE_SURFACE_CLASS)과 같은 어두운 면을 쓴다.
 * 참전 기록 현황 막대·목록 카드처럼 필터가 아닌 카드도 이 면을 같이 쓴다.
 */
export const ZUTOPIA_SURFACE_CLASS =
  "rounded-lg border border-white/10 bg-black/60 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md";

/** 필터 카드 = 공통 면(ZUTOPIA_SURFACE_CLASS) + 줄 쌓기·안쪽 여백. */
export const SORT_FILTER_CARD_CLASS = `${ZUTOPIA_SURFACE_CLASS} flex flex-col gap-2 px-3 py-2.5 tablet:px-4 tablet:py-3`;

/**
 * 곡·앨범·공연 목록 위 필터 카드 — 안에 SortFilterBar 줄들을 쌓고, summary
 * (개수 등)는 태블릿 이상에서 오른쪽 위, 모바일에선 맨 위 줄에 둔다.
 */
export function FilterPanel({
  summary,
  className,
  children,
}: {
  summary?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(SORT_FILTER_CARD_CLASS, "relative", className)}>
      {summary && (
        <div className="tablet:absolute tablet:top-3 tablet:right-4 flex items-center gap-3 text-sm text-white/60">
          {summary}
        </div>
      )}
      {children}
    </div>
  );
}

export interface SortFilterOption<T extends string> {
  value: T;
  label: string;
  /** 이 옵션에 해당하는 항목 수 — 이름 옆에 작게 붙인다. */
  count?: number;
  /** 이름 앞 색 점(공연 종류 색 등). */
  dotClassName?: string;
  /** 고른 칸 색을 바꿀 때(기본은 마젠타). */
  activeClassName?: string;
  /** 지금 조건에선 해당 항목이 없는 옵션 — 흐리게 하고 누를 수 없게. */
  disabled?: boolean;
  /** 있으면 이름 대신 아이콘만 보이고, 이름은 화면 읽기·툴팁으로 쓴다. */
  icon?: ReactNode;
}

interface SortFilterBarProps<T extends string> {
  options: SortFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  // 이 컴포넌트가 항상 "정렬/필터" 용도로 쓰이는 건 아니다(예: 앨범 커버
  // 판본 선택은 필터가 아니라 표시 옵션) — 그런 경우 접근성 이름이 잘못
  // "필터"로 읽히지 않도록 group의 aria-label을 통째로 덮어쓸 수 있게 한다.
  groupLabel?: string;
  /** 작은 칩 + 줄바꿈(가로 스크롤 대신) — 옵션이 많아도 한눈에 보여야 하는 줄. */
  compact?: boolean;
}

/**
 * 곡·앨범·공연 목록의 정렬/필터 한 줄 — 생김새는 사이트 공용 필터
 * (FilterRow + FilterChip, 가이드 곡 목록과 같은 칩)이고, 여기선 옵션 목록과
 * 현재 값·변경 콜백만 받는다(곡·앨범 각각 자기 상태를 갖고 서로 공유하지
 * 않음). label로 정렬 기준 외에 순서·형식·연도 같은 다른 줄에도 쓴다. 카드
 * 테두리/배경은 부모(FilterPanel)가 감싼다 — 여러 줄이 한 카드에 같이 들어가야 해서.
 */
export function SortFilterBar<T extends string>({
  options,
  value,
  onChange,
  label = "정렬",
  groupLabel,
  compact = false,
}: SortFilterBarProps<T>) {
  return (
    <FilterRow
      role="group"
      aria-label={groupLabel ?? `${label} 필터`}
      label={label}
      wrap={compact}
    >
      {options.map((option) => (
        <FilterChip
          key={option.value}
          active={value === option.value}
          onClick={() => onChange(option.value)}
          compact={compact || !!option.icon}
          disabled={option.disabled && value !== option.value}
          activeClassName={option.activeClassName}
          label={option.icon ? option.label : undefined}
          count={option.count}
        >
          {option.dotClassName && (
            <span
              aria-hidden
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                option.dotClassName,
              )}
            />
          )}
          {option.icon ?? option.label}
        </FilterChip>
      ))}
    </FilterRow>
  );
}
