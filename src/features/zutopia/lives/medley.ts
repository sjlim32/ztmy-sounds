import type { Json } from "@/lib/supabase/database.types";
import type { LiveSetlistEntry } from "@/features/zutopia/lives/types";

/**
 * 메들리 행(setlists.note의 type "medley") — 곡이 연결되지 않은 한 줄에 실제 곡들을
 * song_ids 순서로 담는다. 메들리가 아니거나 곡 id가 없으면 null.
 */
export function parseMedleySongIds(
  note: Json | null | undefined,
): string[] | null {
  if (!note || typeof note !== "object" || Array.isArray(note)) return null;
  const { type, song_ids: songIds } = note as Record<string, unknown>;
  if (type !== "medley" || !Array.isArray(songIds)) return null;
  const ids = songIds.filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
  return ids.length > 0 ? ids : null;
}

/** 세트리스트의 곡 수 — 메들리는 한 번호여도 안에 든 곡을 모두 센다. */
export function setlistSongCount(
  entries: Pick<LiveSetlistEntry, "medley">[],
): number {
  return entries.reduce((sum, entry) => sum + (entry.medley?.length ?? 1), 0);
}
