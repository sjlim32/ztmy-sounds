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
  // 이 곡에 대응하는 응원 가이드(/guide/[songId])가 있으면 그 경로, 없으면
  // null. guide-link.ts가 title 기준으로 매칭해 data.ts에서 미리 채운다.
  guideHref: string | null;
}

// 위 SongAlbumRef와 반대 방향 — 앨범 안에서 "이 곡-이 앨범 조합의 트랙 번호"를
// 담는다. 같은 곡이 여러 앨범에 실리면 앨범마다 트랙 번호가 다르므로 Song
// 자체가 아니라 이 조인 결과에만 존재한다.
export interface AlbumSongRef extends Song {
  track_number: number;
  disc_number: number;
  guideHref: string | null;
}

export interface AlbumWithSongs extends Album {
  songs: AlbumSongRef[];
}

export type AlbumGroupBy = "type" | "year";
export type SongGroupBy = "album" | "year";
export type SortDirection = "asc" | "desc";
