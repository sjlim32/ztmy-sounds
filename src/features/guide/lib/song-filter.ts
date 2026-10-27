import type { CallTag, Song, SongImportance } from "@/features/guide/lib/types";
import { getCachedSongCallTags } from "@/features/guide/lib/song-call-tags";

/** 곡 목록 필터 — 각 줄에서 하나씩(또는 전체=null) 골라 함께(AND) 적용한다. */
export interface SongFilter {
  importance: SongImportance | null;
  callTag: CallTag | null;
}

export const EMPTY_SONG_FILTER: SongFilter = {
  importance: null,
  callTag: null,
};

export const SONG_IMPORTANCE_LABEL: Record<SongImportance, string> = {
  essential: "필수 숙지",
  recommended: "예습 중요",
};

/** 원래 순서(곡 번호 순)는 그대로 두고 조건에 맞는 곡만 남긴다. */
export function filterSongs(songs: Song[], filter: SongFilter): Song[] {
  return songs.filter(
    (song) =>
      (filter.importance === null || song.importance === filter.importance) &&
      (filter.callTag === null ||
        getCachedSongCallTags(song).includes(filter.callTag)),
  );
}
