import type { Song } from "@/features/zutopia/song-db/types";

export interface SongMetadata {
  description: string | null;
  isUnreleased: boolean;
}

/**
 * songs.metadata는 비정형 jsonb라 런타임에 형태를 확인해야 한다 — description은
 * 비어 있지 않은 문자열일 때만, unrelease는 "true"(문자열/불리언)일 때만 인정한다.
 */
export function parseSongMetadata(metadata: Song["metadata"]): SongMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { description: null, isUnreleased: false };
  }
  const { description, unrelease } = metadata as {
    description?: unknown;
    unrelease?: unknown;
  };
  return {
    description:
      typeof description === "string" && description.trim().length > 0
        ? description
        : null,
    isUnreleased: unrelease === "true" || unrelease === true,
  };
}
