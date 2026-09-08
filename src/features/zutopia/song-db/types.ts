import type { Database } from "@/lib/supabase/database.types";

export type Song = Database["public"]["Tables"]["songs"]["Row"];
export type Album = Database["public"]["Tables"]["albums"]["Row"];

export interface SongWithAlbums extends Song {
  albums: Album[];
}

export interface AlbumWithSongs extends Album {
  songs: Song[];
}
