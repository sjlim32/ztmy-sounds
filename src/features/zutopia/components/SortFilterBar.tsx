"use client";

import { FilterChip, FilterRow } from "@/components/FilterChips";

/**
 * 정렬/필터 줄(SortFilterBar)들을 감싸는 카드 — 곡·앨범·공연 목록이 모두 이걸
 * 써서 안쪽 여백·줄 간격이 같다. 위치(relative 등)만 호출부가 얹는다.
 */
export const SORT_FILTER_CARD_CLASS =
  "flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 tablet:px-4 tablet:py-3";

interface SortFilterBarProps<T extends string> {
  options: { value: T; label: string }[];
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
 * 테두리/배경은 부모가 SORT_FILTER_CARD_CLASS로 감싼다 — 여러 줄이 한 카드에
 * 같이 들어가야 해서.
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
          compact={compact}
        >
          {option.label}
        </FilterChip>
      ))}
    </FilterRow>
  );
}
