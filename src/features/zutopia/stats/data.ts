import "server-only";
import { cache } from "react";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getLiveHistory } from "@/features/zutopia/live-history/data";
import { inPersonUnits } from "@/features/zutopia/live-history/units";
import {
  getAlbumsWithSongs,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { getSongCoverSrc } from "@/features/zutopia/song-db/song-album-grouping";
import { isCountableOriginal } from "@/features/zutopia/song-db/song-metadata";
import { buildStatSections } from "./compute";
import type { StatSection, StatSong, StatTour } from "./types";

/**
 * 통계 페이지 기록(빌드 때 한 번). 곡은 isCountableOriginal — 원곡·발매곡만이고
 * 협업곡도 뺀다(참전 기록은 들은 협업곡을 넣는 것과 다름). 라이브 기록은 원곡으로
 * 세고, 앨범 수록곡도 어레인지는 원곡으로 바꿔 센다.
 */
export const getStatSections = cache(async (): Promise<StatSection[]> => {
  const supabase = createBuildTimeSupabaseClient();
  const [history, songs, albums, toursResult] = await Promise.all([
    getLiveHistory(),
    getSongsWithAlbums(),
    getAlbumsWithSongs(),
    supabase
      .from("tours")
      .select(
        "id, slug, title, title_ko, start_date, end_date, poster_image_url",
      )
      .eq("status", "ACTIVE"),
  ]);
  if (toursResult.error) {
    throw new Error(
      `투어 목록을 가져오지 못했습니다: ${toursResult.error.message}`,
    );
  }

  const statSongs: StatSong[] = songs
    .filter(isCountableOriginal)
    .map((song) => ({
      id: song.id,
      slug: song.slug,
      title: song.title,
      titleKo: song.title_ko,
      releaseDate: song.release_date.slice(0, 10),
      cover: getSongCoverSrc(song),
    }));
  const songIds = new Set(statSongs.map((song) => song.id));

  const tours: StatTour[] = toursResult.data.map((tour) => ({
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    titleKo: tour.title_ko.trim(),
    startDate: tour.start_date.slice(0, 10),
    endDate: tour.end_date?.slice(0, 10) ?? null,
    poster: tour.poster_image_url,
  }));

  return buildStatSections({
    // 통계는 현장 공연만 — 온라인 공연은 뺀다.
    units: inPersonUnits(history.units),
    upcoming: inPersonUnits(history.upcoming),
    songs: statSongs,
    albums: albums.map((album) => ({
      id: album.id,
      slug: album.slug,
      title: album.title,
      titleKo: album.title_ko,
      cover: album.cover_image_url,
      songIds: [
        ...new Set(
          album.songs
            .map((song) => song.original_song_id ?? song.id)
            .filter((id) => songIds.has(id)),
        ),
      ],
    })),
    tours,
  });
});
