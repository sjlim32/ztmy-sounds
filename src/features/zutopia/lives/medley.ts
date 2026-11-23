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

/**
 * 메들리 행을 곡마다 한 행으로 편다(통계용) — 곡 기록·순서가 보통 곡과 똑같이 세이게.
 * 번호는 메들리 자리 안에서 소수로 나눠(1, 1.25, 1.5 …) 곡 순서를 지키고 다음 곡을
 * 넘지 않는다. 활성 곡만 남기고, 메들리가 아니면 빈 배열.
 */
export function expandMedleyRow<
  T extends { track_number: number; note: Json | null },
>(row: T, isActive: (songId: string) => boolean): (T & { song_id: string })[] {
  const ids = (parseMedleySongIds(row.note) ?? []).filter(isActive);
  return ids.map((song_id, index) => ({
    ...row,
    song_id,
    track_number: row.track_number + index / ids.length,
  }));
}

/** 세트리스트의 곡 수 — 메들리는 한 번호여도 안에 든 곡을 모두 센다. */
export function setlistSongCount(
  entries: Pick<LiveSetlistEntry, "medley">[],
): number {
  return entries.reduce((sum, entry) => sum + (entry.medley?.length ?? 1), 0);
}
