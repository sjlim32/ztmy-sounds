import type { Song } from "@/lib/guide/types";
import byoushinWoKamu from "./01_byoushin-wo-kamu";
import aitsuraZeninDousoukai from "./02_aitsura-zenin-dousoukai";
import obenkyouShitoiteyo from "./03_obenkyou-shitoiteyo";
import seigi from "./04_seigi";
import taidada from "./05_taidata";
import timeLeft from "./06_time-left";
import milabo from "./07_milabo";
import nouriuenoCraker from "./08_nouriueno-cracker";
import nareaiserve from "./09_nareai-serve";
import mirrorTune from "./10_mirror-tune";
import hanaichiMonnme from "./11_hanaichi-monnme";
import cream from "./12_cream";
import kiraKiller from "./13_kira-killer";
import hippocampalPain from "./14_hippocampal-pain";

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
  taidada,
  timeLeft,
  milabo,
  nouriuenoCraker,
  nareaiserve,
  mirrorTune,
  hanaichiMonnme,
  cream,
  kiraKiller,
  hippocampalPain
];

export function getSong(id: string): Song | null {
  return songList.find((song) => song.id === id) ?? null;
}
