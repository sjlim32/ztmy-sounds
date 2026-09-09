"use client";

import { cn } from "@/lib/utils";

interface SortFilterBarProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

/**
 * 곡/앨범 리스트가 각자 갖는 "정렬" 필터 한 행 — 옵션 목록만 다르고 생김새는
 * 동일해서 공용으로 뺐다. 곡·앨범 각각 자기 groupBy 상태를 스스로 갖고
 * 이 컴포넌트에는 현재 값과 변경 콜백만 내려준다(서로 상태를 공유하지 않음).
 * label을 바꿔주면 정렬 기준(정렬) 외에 정렬 방향(순서) 같은 다른 공용
 * 토글 행에도 그대로 재사용할 수 있다. 카드 테두리/배경은 이 컴포넌트가
 * 아니라 부모가 감싸는 쪽이 책임진다 — 정렬 기준·정렬 방향처럼 여러 행이
 * 하나의 카드 안에 같이 들어가야 하기 때문(앞으로 공용 옵션이 더 늘어도
 * 같은 카드에 행만 추가하면 된다).
 */
export function SortFilterBar<T extends string>({
  options,
  value,
  onChange,
  label = "정렬",
}: SortFilterBarProps<T>) {
  return (
    <div
      role="group"
      aria-label={`${label} 필터`}
      className="flex flex-wrap items-center gap-2"
    >
      <span
        className={cn(
          "text-sm font-semibold tracking-wide text-white/70 uppercase",
          "tablet:text-base",
        )}
      >
        {label}
      </span>
      <div className="flex gap-1 rounded-md bg-black/30 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              "tablet:text-base",
              value === option.value
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/80",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
