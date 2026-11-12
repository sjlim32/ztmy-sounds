"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FilterChip, FilterRow } from "@/components/FilterChips";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";

/**
 * 정렬/필터 줄(SortFilterBar)들을 감싸는 카드 — 곡·앨범·공연·참전·연혁·통계가
 * 모두 이걸 써서 생김새·여백·줄 간격이 같다(FilterPanel). 면은 공통
 * ZUTOPIA_SURFACE_CLASS(surface.ts).
 */
const SORT_FILTER_CARD_CLASS = `${ZUTOPIA_SURFACE_CLASS} flex flex-col gap-2 px-3 py-2.5 tablet:px-4 tablet:py-3`;

/**
 * 목록 위 필터 카드 — 곡·앨범·공연 목록이 같은 틀을 쓴다(통계·연혁은 children만).
 *
 * - filters: "무엇을 보여 줄지" 줄들(결과 수가 바뀌는 필터 — 형식·연도·곡 범위·
 *   온라인·MV 등). 위에 쌓는다.
 * - display: "어떻게 보여 줄지" 줄들(정렬·순서·보기 방식·커버 등 — 결과는 그대로).
 *   filters 아래 선을 긋고, 태블릿 이상에선 한 줄에 나란히.
 * - onReset: 필터를 건 동안 넘기면 오른쪽 위(모바일은 맨 위)에 "필터 초기화".
 * - summary: 그 밖에 오른쪽 위에 둘 짧은 안내(연혁의 "내가 간 공연 N회" 등).
 * - children: 예전 방식(구역 나눔 없이 줄만) — filters와 같은 자리.
 *
 * 새 필터·보기 옵션은 해당 구역에 줄(SortFilterBar·FilterToggleRow) 하나만 더하면
 * 같은 모양·자리로 들어간다.
 */
export function FilterPanel({
  summary,
  onReset,
  filters,
  display,
  className,
  children,
}: {
  summary?: ReactNode;
  onReset?: () => void;
  filters?: ReactNode;
  display?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const top = filters ?? children;
  return (
    <div className={cn(SORT_FILTER_CARD_CLASS, "relative", className)}>
      {(summary || onReset) && (
        <div className="tablet:absolute tablet:top-3 tablet:right-4 flex items-center gap-3 text-sm text-white/60">
          {summary}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="hover:text-ztmy-pink rounded whitespace-nowrap text-white/50 underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}
      {top && (
        <div role="group" aria-label="필터" className="flex flex-col gap-2">
          {top}
        </div>
      )}
      {display && (
        <div
          role="group"
          aria-label="정렬과 보기 방식"
          className={cn(
            "tablet:flex-row tablet:flex-wrap tablet:gap-x-8 flex flex-col gap-2",
            top && "mt-1 border-t border-white/10 pt-3",
          )}
        >
          {display}
        </div>
      )}
    </div>
  );
}

/**
 * 켜고 끄는 칩 줄 — "온라인: 제외", "MV: 있는 곡만", "보기: 마지막 라이브"처럼
 * 하나씩 누를 때마다 바뀌는 칩들. 칩마다 개수를 붙일 수 있다.
 */
export function FilterToggleRow({
  label,
  toggles,
}: {
  label: string;
  toggles: {
    label: string;
    active: boolean;
    onToggle: () => void;
    count?: number;
  }[];
}) {
  return (
    <FilterRow label={label} role="group" aria-label={`${label} 필터`}>
      {toggles.map((toggle) => (
        <FilterChip
          key={toggle.label}
          active={toggle.active}
          onClick={toggle.onToggle}
          count={toggle.count}
        >
          {toggle.label}
        </FilterChip>
      ))}
    </FilterRow>
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
