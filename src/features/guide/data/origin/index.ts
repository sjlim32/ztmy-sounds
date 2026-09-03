import type { Song } from "@/features/guide/lib/types";
import nareaiserve from "./49_o_nareai-serve";

const originSongList: Song[] = [nareaiserve];

const originSongsById = new Map(originSongList.map((song) => [song.id, song]));

/** 곡 id에 해당하는 음원(스튜디오) 버전 데이터가 있으면 반환, 없으면 null. */
export function getOriginSong(id: string): Song | null {
  return originSongsById.get(id) ?? null;
}
