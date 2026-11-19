import type { LiveUnit } from "@/features/zutopia/live-history/types";
import type { StatSong } from "./types";

/**
 * 통계 페이지의 "내 기록" — 참전 기록(브라우저에 저장된 체크)과 통계를 잇는다.
 * 빌드 때 buildMyStatsData로 공연일별 곡·곡별 라이브 기록을 /zutopia/stats-me.json에
 * 싣고, 브라우저가 체크한 공연이 있을 때만 받아 summarizeMine으로 센다.
 */

export interface MyStatSong {
  id: string;
  name: string;
  /** 원제(한글 제목과 다를 때) */
  sub: string | null;
  image: string | null;
  href: string;
  /** 전체 라이브 횟수(세트리스트가 있는 공연일) */
  played: number;
  /** 발매 후 세트리스트가 있는 공연일 중 부른 비율(0~1), 그런 공연일이 없으면 null */
  rate: number | null;
}

export interface MyStatsData {
  /** 현장 공연일 전부(세트리스트 없는 날은 songIds가 빈 배열) */
  units: { id: string; songIds: string[] }[];
  songs: MyStatSong[];
}

export function buildMyStatsData(input: {
  units: LiveUnit[];
  songs: StatSong[];
}): MyStatsData {
  const known = input.units.filter((unit) => unit.songIds.length > 0);
  return {
    units: input.units.map((unit) => ({ id: unit.id, songIds: unit.songIds })),
    songs: input.songs.map((song) => {
      const eligible = known.filter((unit) => unit.date >= song.releaseDate);
      const played = known.filter((unit) => unit.songIds.includes(song.id));
      return {
        id: song.id,
        name: song.titleKo || song.title,
        sub: song.titleKo && song.titleKo !== song.title ? song.title : null,
        image: song.cover,
        href: `/zutopia/songs?song=${song.slug}`,
        played: played.length,
        rate: eligible.length
          ? played.filter((unit) => unit.date >= song.releaseDate).length /
            eligible.length
          : null,
      };
    }),
  };
}

export interface MySummary {
  /** 체크한 공연일 중 지금 데이터에 있는 것 */
  attended: number;
  /** 그중 세트리스트가 있는 공연일 — 들은 곡은 이 날들로만 센다 */
  known: number;
  /** 라이브로 들은 곡 수 / 통계에 넣는 곡 수 */
  heard: number;
  total: number;
  /** 들은 곡 중 전체 라이브 횟수가 가장 적은 곡(희귀곡) */
  rare: MyStatSong[];
  /** 못 들은 곡 중 참가율이 가장 높은 곡 */
  missed: MyStatSong[];
}

/** 카드에 보여 줄 곡 수 */
export const MY_LIST_COUNT = 5;

export function summarizeMine(
  data: MyStatsData,
  attended: ReadonlySet<string>,
): MySummary {
  const mine = data.units.filter((unit) => attended.has(unit.id));
  const heardIds = new Set(mine.flatMap((unit) => unit.songIds));
  const heard = data.songs.filter((song) => heardIds.has(song.id));
  const missed = data.songs.filter(
    (song) => !heardIds.has(song.id) && song.rate != null && song.played > 0,
  );
  return {
    attended: mine.length,
    known: mine.filter((unit) => unit.songIds.length > 0).length,
    heard: heard.length,
    total: data.songs.length,
    rare: [...heard]
      .sort((a, b) => a.played - b.played || a.name.localeCompare(b.name, "ko"))
      .slice(0, MY_LIST_COUNT),
    missed: missed
      .sort((a, b) => b.rate! - a.rate! || b.played - a.played)
      .slice(0, MY_LIST_COUNT),
  };
}
