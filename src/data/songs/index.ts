import type { Song } from "@/lib/guide/types";
import byoushinWoKamu from "./byoushin-wo-kamu";
import sampleSongTwo from "./sample-song-two";

/**
 * Each song's data lives in its own file under `src/data/songs/` (one file
 * per song, matching its `id`) so a long lyric sheet doesn't bloat a single
 * shared array. This module just aggregates them for the list/lookup APIs
 * the guide routes rely on.
 */
export const songs: Song[] = [byoushinWoKamu, sampleSongTwo];

export function getSong(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
