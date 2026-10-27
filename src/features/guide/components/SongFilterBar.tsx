import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CallIcon } from "@/features/guide/components/CallIcon";
import {
  SONG_IMPORTANCES,
  type CallTag,
  type SongImportance,
} from "@/features/guide/lib/types";
import {
  SONG_IMPORTANCE_LABEL,
  type SongFilter,
} from "@/features/guide/lib/song-filter";
import { CALL_TAG_SHORT_LABEL } from "@/features/guide/lib/call-tag-style";
import { ACTIVE_TAB_CLASS, TAB_CLASS } from "@/components/button-styles";

/**
 * 곡 목록 위 필터 두 줄 — 중요도 / 응원법. 각 줄에서 하나를 고르고, 이미
 * 고른 걸 다시 누르거나 "전체"를 누르면 해제된다. 두 줄은 함께(AND) 적용.
 */
export function SongFilterBar({
  filter,
  callTags,
  onChange,
  className,
}: {
  filter: SongFilter;
  callTags: readonly CallTag[];
  onChange: (filter: SongFilter) => void;
  className?: string;
}) {
  const setImportance = (importance: SongImportance | null) =>
    onChange({
      ...filter,
      importance: filter.importance === importance ? null : importance,
    });
  const setCallTag = (callTag: CallTag | null) =>
    onChange({
      ...filter,
      callTag: filter.callTag === callTag ? null : callTag,
    });

  return (
    <div
      role="group"
      aria-label="곡 목록 필터"
      className={cn("flex flex-col gap-1.5 px-4 py-2", className)}
    >
      <FilterRow label="중요도">
        <Chip
          active={filter.importance === null}
          onClick={() => setImportance(null)}
        >
          전체
        </Chip>
        {SONG_IMPORTANCES.map((importance) => (
          <Chip
            key={importance}
            active={filter.importance === importance}
            onClick={() => setImportance(importance)}
          >
            {SONG_IMPORTANCE_LABEL[importance]}
          </Chip>
        ))}
      </FilterRow>
      <FilterRow label="응원법">
        <Chip active={filter.callTag === null} onClick={() => setCallTag(null)}>
          전체
        </Chip>
        {callTags.map((tag) => (
          <Chip
            key={tag}
            active={filter.callTag === tag}
            onClick={() => setCallTag(tag)}
          >
            <CallIcon name={tag} size={18} className="mr-0" />
            {CALL_TAG_SHORT_LABEL[tag]}
          </Chip>
        ))}
      </FilterRow>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-11 shrink-0 text-sm font-medium text-white/60">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      // 탭과 같은 "여러 개 중 고르기" 스타일(button-styles.ts) — 고른 칸은 흰 면
      className={cn(
        TAB_CLASS,
        "inline-flex items-center gap-1 px-2.5 py-1",
        active && ACTIVE_TAB_CLASS,
      )}
    >
      {children}
    </button>
  );
}
