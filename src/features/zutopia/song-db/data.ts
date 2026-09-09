import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

// 곡 페이지는 앨범 개수를, 앨범 페이지는 곡 개수를 SongDbNav 배지에 표시하기
// 위해서만 상대 데이터셋이 필요하다 — get*WithAlbums/get*WithSongs 전체를
// (모든 앨범/곡 정보를 다대다로 조인해서) 다시 불러오는 건 개수 하나 얻자고
// 이 기능에서 가장 비싼 쿼리를 페이지마다 불필요하게 한 번씩 더 실행하는
// 것과 같다. count-only 쿼리(head: true라 실제 행 데이터는 아예 안 옴)로
// 대체한다.
export async function getSongsCount(): Promise<number> {
  const supabase = createBuildTimeSupabaseClient();
  const { count, error } = await supabase
    .from("songs")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(`곡 개수를 가져오지 못했습니다: ${error.message}`);
  }
  return count ?? 0;
}

export async function getAlbumsCount(): Promise<number> {
  const supabase = createBuildTimeSupabaseClient();
  const { count, error } = await supabase
    .from("albums")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(`앨범 개수를 가져오지 못했습니다: ${error.message}`);
  }
  return count ?? 0;
}

export async function getSongsWithAlbums(): Promise<SongWithAlbums[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*, song_albums(track_number, disc_number, albums!inner(*))")
    .eq("status", "ACTIVE")
    .eq("song_albums.albums.status", "ACTIVE")
    .order("title");

  if (error) {
    throw new Error(`곡 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...song }) => {
    // song_albums가 다대다라 같은 앨범을 가리키는 조인 행이 중복으로 들어올
    // 가능성(데이터 이상)을 방어적으로 걸러낸다 — 없으면 no-op, 있으면
    // React key 충돌과 UI 중복 표시를 막아준다. release_date 오름차순으로
    // 정렬해 "이 곡의 첫 번째 앨범"(커버 이미지 폴백 등에서 쓰임)이 매 빌드
    // 마다 임의 순서로 바뀌지 않도록 고정한다.
    const seenAlbumIds = new Set<string>();
    const albums = song_albums
      .filter((row) => {
        if (seenAlbumIds.has(row.albums.id)) return false;
        seenAlbumIds.add(row.albums.id);
        return true;
      })
      .map((row) => ({
        ...row.albums,
        track_number: row.track_number,
        disc_number: row.disc_number,
      }))
      .sort((a, b) => a.release_date.localeCompare(b.release_date));

    return { ...song, albums };
  });
}

export async function getAlbumsWithSongs(): Promise<AlbumWithSongs[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*, song_albums(track_number, disc_number, songs!inner(*))")
    .eq("status", "ACTIVE")
    .eq("song_albums.songs.status", "ACTIVE")
    .order("release_date");

  if (error) {
    throw new Error(`앨범 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map(({ song_albums, ...album }) => {
    // getSongsWithAlbums와 동일한 이유로(song_albums 조인 행 중복 방어)
    // 같은 곡을 가리키는 행이 두 번 들어오는 경우를 걸러낸다 — 없으면
    // no-op, 있으면 React key 충돌과 트랙 목록 중복 표시를 막아준다.
    const seenSongIds = new Set<string>();
    const songs = [...song_albums]
      .filter((row) => {
        if (seenSongIds.has(row.songs.id)) return false;
        seenSongIds.add(row.songs.id);
        return true;
      })
      // 이제 song_albums에 실제 트랙 순서(disc_number, track_number)가 있으므로
      // 곡 제목 알파벳순 대신 그 순서를 그대로 따른다.
      .sort(
        (a, b) =>
          a.disc_number - b.disc_number || a.track_number - b.track_number,
      )
      .map((row) => row.songs);

    return { ...album, songs };
  });
}
