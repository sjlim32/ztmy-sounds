import type { Song } from "@/features/guide/lib/types";
import byoushinwoKamu from "./01_byoushinwo-kamu";
import nouriuenoCraker from "./02_nouriueno-cracker";
import seigi from "./08_seigi";
import kuyashiiwa from "./09_kan-saete-kuyashiiwa";
import minority from "./11_minority-myakuraku";
import soudou from "./14_konnakoto-soudou";
import haze from "./15_haze-haseru-haterumade";
import obenkyouShitoiteyo from "./20_obenkyou-shitoiteyo";
import milabo from "./21_milabo";
import fastening from "./22_fastening";
import aitsuraZeninDousoukai from "./36_aitsura-zenin-dousoukai";
import mirrorTune from "./42_mirror-tune";
import timeLeft from "./45_time-left";
import kiraKiller from "./46_kira-killer";
import hanaichiMonnme from "./48_hanaichi-monnme";
import nareaiserve from "./49_nareai-serve";
import hippocampalPain from "./53_hippocampal-pain";
import taidada from "./54_taidada";
import cream from "./59_cream";
/**
 * Each song's data lives in its own file under `src/features/guide/data/songs/` (one file
 * per song, matching its `id`) so a long lyric sheet doesn't bloat a single
 * shared array. This module just aggregates them for the list/lookup APIs
 * the guide routes rely on.
 */
export const songList: Song[] = [
  kuyashiiwa, // 싱크 마세 조정 필요
  soudou, // 싱크 완
  haze, // 싱크 미세 조정 필요
  fastening, // 싱크 맞춤 필요
  byoushinwoKamu,
  nouriuenoCraker,
  seigi,
  minority,
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
