import type { Metadata } from "next";
import {
  getAlbumsWithSongs,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { SongDbTabs } from "@/features/zutopia/song-db/SongDbTabs";

export const metadata: Metadata = {
  title: "노래 DB",
  description: "즛토마요 전체 곡과 앨범 목록입니다.",
};

export default async function ZutopiaSongDbPage() {
  const [songs, albums] = await Promise.all([
    getSongsWithAlbums(),
    getAlbumsWithSongs(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-widest text-white uppercase">
        노래 DB
      </h1>

      <div className="mt-3">
        <SongDbTabs songs={songs} albums={albums} />
      </div>
    </div>
  );
}
