import type { Song } from "@/features/zutopia/song-db/types";

export interface SongMetadata {
  description: string | null;
  isUnreleased: boolean;
  /**
   * 협업곡(피처링·트리뷰트 앨범·타이업처럼 즛토마요가 직접 발표하지 않은 곡)의
   * 출처 문구 — metadata.collab. 협업곡이 아니면 null.
   */
  collab: string | null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/**
 * songs.metadata는 비정형 jsonb라 런타임에 형태를 확인해야 한다 — description·
 * collab은 비어 있지 않은 문자열일 때만, unrelease는 "true"(문자열/불리언)일
 * 때만 인정한다.
 */
export function parseSongMetadata(metadata: Song["metadata"]): SongMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { description: null, isUnreleased: false, collab: null };
  }
  const { description, unrelease, collab } = metadata as {
    description?: unknown;
    unrelease?: unknown;
    collab?: unknown;
  };
  return {
    description: nonEmptyString(description),
    isUnreleased: unrelease === "true" || unrelease === true,
    collab: nonEmptyString(collab),
  };
}

/**
 * 통계 곡 기록에서 세는 곡 — 원곡이고(어레인지 버전은 원곡으로 센다) 미공개곡·
 * 협업곡이 아닌 곡. 협업곡은 라이브에서 부를 것으로 기대하는 곡이 아니라서 참가율·
 * 적게 불린 곡 같은 곡 순위에 넣지 않는다. 참전 기록은 협업곡을 들은 곡에는 넣고
 * "못 들은 곡"에만 안 넣어서 이 함수 대신 따로 거른다(attendance/page.tsx).
 */
export function isCountableOriginal(
  song: Pick<Song, "original_song_id" | "metadata">,
): boolean {
  if (song.original_song_id) return false;
  const { isUnreleased, collab } = parseSongMetadata(song.metadata);
  return !isUnreleased && !collab;
}
