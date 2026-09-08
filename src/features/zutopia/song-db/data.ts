import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

export async function getSongsWithAlbums(): Promise<SongWithAlbums[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select(
      "id, title, title_ko, cover_image_url, created_at, song_albums(albums(*))",
    )
    .order("title");

  if (error) {
    throw new Error(`곡 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...song }) => ({
    ...song,
    albums: song_albums.map((row) => row.albums),
  }));
}

export async function getAlbumsWithSongs(): Promise<AlbumWithSongs[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*, song_albums(songs(*))")
    .order("release_date");

  if (error) {
    throw new Error(`앨범 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...album }) => ({
    ...album,
    songs: song_albums
      .map((row) => row.songs)
      .sort((a, b) => a.title.localeCompare(b.title)),
  }));
}
