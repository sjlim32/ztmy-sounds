import type { Song } from "@/lib/guide/types";
import byoushinWoKamu from "./01_byoushin-wo-kamu";
import nouriuenoCraker from "./02_nouriueno-cracker";
import seigi from "./03_seigi";
import obenkyouShitoiteyo from "./04_obenkyou-shitoiteyo";
import milabo from "./05_milabo";
import aitsuraZeninDousoukai from "./06_aitsura-zenin-dousoukai";
import mirrorTune from "./07_mirror-tune";
import timeLeft from "./08_time-left";
import kiraKiller from "./09_kira-killer";
import hanaichiMonnme from "./10_hanaichi-monnme";
import nareaiserve from "./11_nareai-serve";
import hippocampalPain from "./12_hippocampal-pain";
import taidada from "./13_taidata";
import cream from "./14_cream";

/**
 * Each song's data lives in its own file under `src/data/songs/` (one file
 * per song, matching its `id`) so a long lyric sheet doesn't bloat a single
 * shared array. This module just aggregates them for the list/lookup APIs
 * the guide routes rely on.
 */
export const songList: Song[] = [
  byoushinWoKamu,
  nouriuenoCraker,
  seigi,
  obenkyouShitoiteyo,
  milabo,
  aitsuraZeninDousoukai,
  mirrorTune,
  timeLeft,
  kiraKiller,
  hanaichiMonnme,
  nareaiserve,
  hippocampalPain,
  taidada,
  cream,
];

export function getSong(id: string): Song | null {
  return songList.find((song) => song.id === id) ?? null;
}
