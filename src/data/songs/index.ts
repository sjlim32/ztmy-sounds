import type { Song } from "@/lib/guide/types";
import byoushinWoKamu from "./01_byoushin-wo-kamu";
import aitsuraZeninDousoukai from "./02_aitsura-zenin-dousoukai";
import obenkyouShitoiteyo from "./03_obenkyou-shitoiteyo";
import seigi from "./04_seigi";

/**
 * Each song's data lives in its own file under `src/data/songs/` (one file
 * per song, matching its `id`) so a long lyric sheet doesn't bloat a single
 * shared array. This module just aggregates them for the list/lookup APIs
 * the guide routes rely on.
 */
export const songList: Song[] = [
  byoushinWoKamu,
  aitsuraZeninDousoukai,
  obenkyouShitoiteyo,
  seigi,
];

export function getSong(id: string): Song | null {
  return songList.find((song) => song.id === id) ?? null;
}
