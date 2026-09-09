import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

export async function getSongsWithAlbums(): Promise<SongWithAlbums[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*, song_albums(track_number, disc_number, albums(*))")
    .order("title");

  if (error) {
    throw new Error(`곡 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...song }) => ({
    ...song,
    albums: song_albums.map((row) => ({
      ...row.albums,
      track_number: row.track_number,
      disc_number: row.disc_number,
    })),
  }));
}

export async function getAlbumsWithSongs(): Promise<AlbumWithSongs[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*, song_albums(track_number, disc_number, songs(*))")
    .order("release_date");

  if (error) {
    throw new Error(`앨범 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...album }) => ({
    ...album,
    // 이제 song_albums에 실제 트랙 순서(disc_number, track_number)가 있으므로
    // 곡 제목 알파벳순 대신 그 순서를 그대로 따른다.
    songs: [...song_albums]
      .sort(
        (a, b) =>
          a.disc_number - b.disc_number || a.track_number - b.track_number,
      )
      .map((row) => row.songs),
  }));
}
