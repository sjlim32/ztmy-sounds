import type { Song } from "@/features/guide/lib/types";
import byoushinwoKamu from "./01_byoushinwo-kamu";
import nouriuenoCraker from "./02_nouriueno-cracker";
import humanoid from "./03_humanoid";
import seigi from "./08_seigi";
import kuyashiiwa from "./09_kan-saete-kuyashiiwa";
import minority from "./11_minority-myakuraku";
import soudou from "./14_konnakoto-soudou";
import haze from "./15_haze-haseru-haterumade";
import obenkyouShitoiteyo from "./20_obenkyou-shitoiteyo";
import milabo from "./21_milabo";
import fastening from "./22_fastening";
import jkBomber from "./24_jk-bomber";
import darken from "./26_darken";
import haveA from "./31_have-a";
import aitsuraZeninDousoukai from "./36_aitsura-zenin-dousoukai";
import mirrorTune from "./42_mirror-tune";
import timeLeft from "./45_time-left";
import kiraKiller from "./46_kira-killer";
import hanaichiMonnme from "./48_hanaichi-monnme";
import nareaiserve from "./49_nareai-serve";
import truth from "./51_truth-in-lies";
import hippocampalPain from "./53_hippocampal-pain";
import taidada from "./54_taidada";
import shade from "./57_shade";
import cream from "./59_cream";
import medianoche from "./61_medianoche";
import almostHuman from "./64_almost-human";

export const songList: Song[] = [
  humanoid, // TODO 싱크 미세 조정 필요
  minority, // Fin
  kuyashiiwa, // TODO 싱크 마세 조정 필요
  soudou, // 싱크 완
  haze, // TODO 싱크 미세 조정 필요
  fastening, // TODO 전체 싱크 조절 필요
  jkBomber, // TODO 전체 싱크 조절 필요
  darken, // TODO 전체 싱크 조절 필요
  haveA, // TODO 전체 싱크 조절 필요
  truth,
  shade,
  medianoche,
  almostHuman,
  //*** COMPLETE ***//
  byoushinwoKamu,
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
