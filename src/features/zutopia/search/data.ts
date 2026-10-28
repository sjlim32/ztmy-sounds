import "server-only";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import {
  getAlbumsWithSongs,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { getLiveEntries } from "@/features/zutopia/lives/data";
import type {
  SearchLive,
  ZutopiaSearchIndex,
} from "@/features/zutopia/search/types";

/**
 * 곡 id → 그 곡을 부른 공연 목록 항목(slug)을 잇기 위해 세트리스트 전체를
 * 가볍게(id만) 읽는다. 공연 목록 항목은 단독 공연(lives.slug)이거나 투어
 * (tours.slug)인데, 투어 소속 공연일은 자기 목록 항목이 없어서 그 투어로
 * 묶는다 — lives/data.ts의 tourDateFilter와 같은 기준(tour_id가 있거나
 * slug가 투어 slug와 같은 행).
 */
async function getSetlistLinks(): Promise<{
  songIdsBySlug: Map<string, Set<string>>;
  titleEnBySlug: Map<string, string>;
}> {
  const supabase = createBuildTimeSupabaseClient();
  const [setlists, lives, tours] = await Promise.all([
    supabase.from("setlists").select("song_id, live_id, tour_id"),
    supabase
      .from("lives")
      .select("id, slug, tour_id, title_en")
      .eq("status", "ACTIVE"),
    supabase.from("tours").select("id, slug, title_en").eq("status", "ACTIVE"),
  ]);
  for (const result of [setlists, lives, tours]) {
    if (result.error) {
      throw new Error(
        `검색용 세트리스트를 가져오지 못했습니다: ${result.error.message}`,
      );
    }
  }

  const tourSlugById = new Map(tours.data!.map((tour) => [tour.id, tour.slug]));
  const entrySlugByLiveId = new Map(
    lives.data!.flatMap((live) => {
      const slug = live.tour_id
        ? tourSlugById.get(live.tour_id)
        : (live.slug ?? undefined);
      return slug ? [[live.id, slug] as const] : [];
    }),
  );

  const songIdsBySlug = new Map<string, Set<string>>();
  for (const row of setlists.data!) {
    const slug = row.tour_id
      ? tourSlugById.get(row.tour_id)
      : row.live_id
        ? entrySlugByLiveId.get(row.live_id)
        : undefined;
    if (!slug) continue;
    const ids = songIdsBySlug.get(slug) ?? new Set<string>();
    ids.add(row.song_id);
    songIdsBySlug.set(slug, ids);
  }
  // 목록 항목(단독 공연·투어)의 영어 제목 — 목록용 getLiveEntries엔 없어서 여기서 같이 읽는다.
  const titleEnBySlug = new Map<string, string>();
  for (const row of [
    ...lives.data!.filter((live) => !live.tour_id),
    ...tours.data!,
  ]) {
    if (row.slug && row.title_en) titleEnBySlug.set(row.slug, row.title_en);
  }
  return { songIdsBySlug, titleEnBySlug };
}

/** 즛토피아 첫 화면 통합 검색용 인덱스(빌드 때 한 번). */
export async function getZutopiaSearchIndex(): Promise<ZutopiaSearchIndex> {
  const [songs, albums, liveEntries, { songIdsBySlug, titleEnBySlug }] =
    await Promise.all([
      getSongsWithAlbums(),
      getAlbumsWithSongs(),
      getLiveEntries(),
      getSetlistLinks(),
    ]);

  const lives: SearchLive[] = liveEntries.map((entry) => ({
    slug: entry.slug,
    label: entry.label,
    name: entry.name,
    titleEn: titleEnBySlug.get(entry.slug) ?? null,
    date: entry.date,
    year: entry.startDate?.slice(0, 4) ?? "",
    thumbnail: entry.thumbnail,
    songIds: [...(songIdsBySlug.get(entry.slug) ?? [])],
  }));

  return {
    songs: songs.map((song) => ({
      id: song.id,
      slug: song.slug,
      title: song.title,
      titleKo: song.title_ko,
      titleEn: song.title_en,
      // 곡 커버가 없으면 첫 앨범 커버(곡 목록과 같은 기준).
      cover: song.cover_image_url ?? song.albums[0]?.cover_image_url ?? null,
      releaseYear: song.release_date.slice(0, 4),
    })),
    albums: albums.map((album) => ({
      id: album.id,
      slug: album.slug,
      title: album.title,
      titleKo: album.title_ko,
      titleEn: album.title_en,
      cover: album.cover_image_url,
      releaseYear: album.release_date.slice(0, 4),
      songIds: album.songs.map((song) => song.id),
    })),
    lives,
  };
}
