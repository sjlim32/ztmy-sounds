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
import { FilterChip, FilterRow } from "@/components/FilterChips";

// 모바일: 칩 묶음이 패널 오른쪽 끝(바깥 px-4)까지 넘어가게 그만큼 넓힌다.
const CHIPS_BLEED_CLASS = "-mr-4 pr-4 tablet:mr-0 tablet:pr-0";

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
      <FilterRow label="중요도" chipsClassName={CHIPS_BLEED_CLASS}>
        <FilterChip
          active={filter.importance === null}
          onClick={() => setImportance(null)}
        >
          전체
        </FilterChip>
        {SONG_IMPORTANCES.map((importance) => (
          <FilterChip
            key={importance}
            active={filter.importance === importance}
            onClick={() => setImportance(importance)}
          >
            {SONG_IMPORTANCE_LABEL[importance]}
          </FilterChip>
        ))}
      </FilterRow>
      <FilterRow label="응원법" chipsClassName={CHIPS_BLEED_CLASS}>
        <FilterChip
          active={filter.callTag === null}
          onClick={() => setCallTag(null)}
        >
          전체
        </FilterChip>
        {callTags.map((tag) => (
          <FilterChip
            key={tag}
            active={filter.callTag === tag}
            onClick={() => setCallTag(tag)}
          >
            <CallIcon name={tag} size={18} className="mr-0" />
            {CALL_TAG_SHORT_LABEL[tag]}
          </FilterChip>
        ))}
      </FilterRow>
    </div>
  );
}
