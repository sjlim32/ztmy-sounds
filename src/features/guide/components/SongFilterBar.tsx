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
import { CALL_TAG_LABEL } from "@/features/guide/lib/call-tag-style";

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
            <CallIcon name={tag} size={16} className="mr-0" />
            {CALL_TAG_LABEL[tag]}
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
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-xs font-medium text-white/50">
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
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        "focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
        active
          ? "border-ztmy-magenta bg-ztmy-magenta/25 text-white"
          : "border-white/15 bg-black/30 text-white/70 hover:border-white/40 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
