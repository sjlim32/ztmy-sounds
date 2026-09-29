import type { Json } from "@/lib/supabase/database.types";

export interface LiveStreamingLinks {
  variation?: string;
  spotify?: string;
  youtubeMusic?: string;
  appleMusic?: string;
}

/**
 * lives/tours.metadata는 비정형 jsonb라 런타임에 형태를 확인해야 한다
 * (AlbumDetailPanel의 getAlbumImageSource와 동일한 패턴). 아직 실데이터에
 * youtube_music/apple_music 키가 없어 정확한 키 이름은 spotify 키의
 * snake_case 관례를 따라 추정했다 — 실제 값이 다르면 이 함수만 고치면 된다.
 */
export function parseStreamingMetadata(
  metadata: Json | null,
): LiveStreamingLinks {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  const m = metadata as Record<string, unknown>;
  const asString = (value: unknown) =>
    typeof value === "string" && value.length > 0 ? value : undefined;

  return {
    variation: asString(m.variation),
    spotify: asString(m.spotify),
    youtubeMusic: asString(m.youtube_music),
    appleMusic: asString(m.apple_music),
  };
}
