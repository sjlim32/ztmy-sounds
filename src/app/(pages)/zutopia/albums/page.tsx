import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import {
  getAlbumsWithSongs,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { SongDbNav } from "@/features/zutopia/song-db/SongDbNav";
import { AlbumListView } from "@/features/zutopia/song-db/AlbumListView";

export const metadata: Metadata = {
  title: "노래 DB · 앨범",
  description: "즛토마요 전체 앨범 목록입니다.",
};

export default async function ZutopiaAlbumsPage() {
  const [songs, albums] = await Promise.all([
    getSongsWithAlbums(),
    getAlbumsWithSongs(),
  ]);

  return (
    <div>
      <h1
        className={cn(
          "text-3xl font-bold tracking-widest text-white uppercase",
          "tablet:text-4xl",
        )}
      >
        노래 DB
      </h1>

      <div className="mt-3">
        <SongDbNav songCount={songs.length} albumCount={albums.length} />

        <div className="mt-8">
          <AlbumListView albums={albums} />
        </div>
      </div>
    </div>
  );
}
