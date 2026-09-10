import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import {
  getAlbumsCount,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { SongDbNav } from "@/features/zutopia/song-db/components/SongDbNav";
import { SongListView } from "@/features/zutopia/song-db/components/SongListView";

export const metadata: Metadata = {
  title: "노래 DB · 곡",
  description: "즛토마요 전체 곡 목록입니다.",
};

export default async function ZutopiaSongsPage() {
  const [songs, albumCount] = await Promise.all([
    getSongsWithAlbums(),
    getAlbumsCount(),
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
        <SongDbNav songCount={songs.length} albumCount={albumCount} />

        <div className="mt-8">
          <SongListView songs={songs} />
        </div>
      </div>
    </div>
  );
}
