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
import {
  isCountableOriginal,
  parseSongMetadata,
} from "@/features/zutopia/song-db/song-metadata";
import { buildStatSections, buildStatSummary } from "./compute";
import { buildMyStatsData, type MyStatsData } from "./my-stats";
import type { StatSection, StatSong, StatSummary, StatTour } from "./types";

/**
 * 통계 계산 입력 — 기록(getStatSections)과 맨 위 요약(getStatSummary)이 같이 쓴다.
 * React cache는 페이지 렌더 안에서만 한 번으로 묶인다(Route Handler에선 묶이지 않아
 * stats.json route는 입력을 한 번 받아 직접 넘긴다). 곡은 isCountableOriginal — 원곡·발매곡만이고
 * 협업곡도 뺀다(참전 기록은 들은 협업곡을 넣는 것과 다름). 라이브 기록은 원곡으로
 * 세고, 앨범 수록곡도 어레인지는 원곡으로 바꿔 센다.
 */
export const getStatInput = cache(async () => {
  const supabase = createBuildTimeSupabaseClient();
  const [history, songs, albums, toursResult, canceledResult] =
    await Promise.all([
      getLiveHistory(),
      getSongsWithAlbums(),
      getAlbumsWithSongs(),
      supabase
        .from("tours")
        .select(
          "id, slug, title, title_ko, start_date, end_date, poster_image_url",
        )
        .eq("status", "ACTIVE"),
      // 취소된 공연일이 있는 투어 — 공연일이 전부 취소된 투어를 "공연일 미등록"으로
      // 잘못 세지 않게(compute.ts canceledTourIds).
      supabase
        .from("lives")
        .select("tour_id")
        .eq("status", "CANCELED")
        .not("tour_id", "is", null),
    ]);
  if (canceledResult.error) {
    throw new Error(
      `취소된 공연을 가져오지 못했습니다: ${canceledResult.error.message}`,
    );
  }
  if (toursResult.error) {
    throw new Error(
      `투어 목록을 가져오지 못했습니다: ${toursResult.error.message}`,
    );
  }

  const toStatSong = (song: (typeof songs)[number]): StatSong => ({
    id: song.id,
    slug: song.slug,
    title: song.title,
    titleKo: song.title_ko,
    releaseDate: song.release_date.slice(0, 10),
    cover: getSongCoverSrc(song),
  });
  const statSongs: StatSong[] = songs
    .filter(isCountableOriginal)
    .map(toStatSong);
  // 미공개곡(원곡만) — 곡 기록 순위엔 안 넣고 "가장 많이 부른 미공개곡"에만.
  const unreleasedSongs: StatSong[] = songs
    .filter(
      (song) =>
        !song.original_song_id && parseSongMetadata(song.metadata).isUnreleased,
    )
    .map(toStatSong);
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

  return {
    // 통계는 현장 공연만 — 온라인 공연은 뺀다.
    units: inPersonUnits(history.units),
    upcoming: inPersonUnits(history.upcoming),
    canceledTourIds: canceledResult.data.flatMap((row) => row.tour_id ?? []),
    songs: statSongs,
    unreleasedSongs,
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
  };
});

export const getStatSections = cache(async (): Promise<StatSection[]> =>
  buildStatSections(await getStatInput()),
);

/** 통계 맨 위 요약(공연일·세트리스트 확보율 등) — 같은 입력으로. */
export const getStatSummary = cache(async (): Promise<StatSummary> =>
  buildStatSummary(await getStatInput()),
);

/** "내 기록"용 공연일별 곡·곡별 라이브 기록(/zutopia/stats-me.json). */
export const getMyStatsData = cache(async (): Promise<MyStatsData> =>
  buildMyStatsData(await getStatInput()),
);
