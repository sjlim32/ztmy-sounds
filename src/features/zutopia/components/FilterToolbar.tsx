import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ACTIVE_FILTER_CHIP_CLASS,
  FILTER_CHIP_CLASS,
} from "@/components/button-styles";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";

/**
 * 목록 위 한 줄 툴바 — 자주 바꾸는 것(묶기·순서 등, controls)만 밖에 두고 나머지 필터·보기는
 * "필터" 버튼 하나(바꾼 개수 표시)로 펼치는 패널(panel — FilterPanel)에 넣는다. 오른쪽 끝엔
 * 결과 수 같은 짧은 글자(summary). 필터 카드가 여러 줄로 목록보다 먼저 화면을 차지하지 않게
 * (곡 목록). 배경 그림 위에 바로 놓이니 글자에 그림자.
 *
 * "use client" 진입 파일이 아니다 — 클라이언트 컴포넌트(SongListView)에서만 가져와서 함수
 * props(onChange)를 넘겨도 된다.
 */
export function FilterToolbar({
  controls,
  panel = null,
  changedCount = 0,
  summary = null,
}: {
  controls: ReactNode;
  /** 펼칠 필터 패널 — 없으면(거를 것이 없는 목록 — 앨범) "필터" 버튼도 없다. */
  panel?: ReactNode;
  /** 기본값에서 바꾼 필터·보기 옵션 수 — "필터" 버튼에 숫자로 */
  changedCount?: number;
  summary?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="flex flex-col gap-3">
      <div className="drop-shadow-legible-sm flex flex-wrap items-center gap-x-3 gap-y-2">
        {controls}
        {panel && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              FILTER_CHIP_CLASS,
              (open || changedCount > 0) && ACTIVE_FILTER_CHIP_CLASS,
            )}
          >
            필터
            {changedCount > 0 && (
              <span className="font-mono tabular-nums">{changedCount}</span>
            )}
            <ChevronDownIcon
              className={cn(
                "size-3.5 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        )}
        {summary && (
          <span className="ml-auto font-mono text-sm text-white/60 tabular-nums">
            {summary}
          </span>
        )}
      </div>
      {panel && open && (
        <div id={panelId} className="animate-content-in">
          {panel}
        </div>
      )}
    </div>
  );
}

/** 툴바의 고르기 상자(묶기 등) — 필터 칩과 같은 모양 + 오른쪽 꺾쇠. */
export function ToolbarSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-white/60">
      {label}
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={cn(
            FILTER_CHIP_CLASS,
            "appearance-none pr-7 text-white",
            "[&>option]:bg-background",
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-white/60" />
      </span>
    </label>
  );
}
