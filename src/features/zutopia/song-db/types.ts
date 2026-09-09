import type { Database } from "@/lib/supabase/database.types";

export type Song = Database["public"]["Tables"]["songs"]["Row"];
export type Album = Database["public"]["Tables"]["albums"]["Row"];

// song_albums 조인 컬럼(track_number, disc_number)을 앨범 정보에 얹어둔다 —
// 같은 곡이 앨범마다 트랙 번호가 다를 수 있어(다대다), "이 곡의 트랙 번호"가
// 아니라 "이 곡-이 앨범 조합의 트랙 번호"로 취급해야 한다.
export interface SongAlbumRef extends Album {
  track_number: number;
  disc_number: number;
}

export interface SongWithAlbums extends Song {
  albums: SongAlbumRef[];
}

export interface AlbumWithSongs extends Album {
  songs: Song[];
}

export type AlbumGroupBy = "type" | "year";
export type SongGroupBy = "album" | "year";
export type SortDirection = "asc" | "desc";
