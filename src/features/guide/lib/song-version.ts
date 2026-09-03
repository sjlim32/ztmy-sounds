import type { Song } from "@/features/guide/lib/types";
import { getSong } from "@/features/guide/data/songs";
import { getOriginSong } from "@/features/guide/data/origin";

export type SongVersion = "live" | "studio";

/** 곡 id + 버전에 맞는 Song 데이터를 반환. studio는 origin 데이터가 없으면 live로 폴백. */
export function getSongForVersion(
  id: string,
  version: SongVersion,
): Song | null {
  if (version === "studio") {
    return getOriginSong(id) ?? getSong(id);
  }
  return getSong(id);
}

/** origin 폴더에 같은 id(=같은 번호)의 곡이 있는지 여부 — 버전 토글 노출 조건. */
export function hasOriginVersion(id: string): boolean {
  return getOriginSong(id) !== null;
}
