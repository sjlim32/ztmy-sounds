import type { Metadata } from "next";
import {
  getAlbumsWithSongs,
  getSongsCount,
} from "@/features/zutopia/song-db/data";
import { SongDbNav } from "@/features/zutopia/song-db/components/SongDbNav";
import { AlbumListView } from "@/features/zutopia/song-db/components/AlbumListView";
import { ZutopiaSectionHeader } from "@/features/zutopia/components/ZutopiaSectionHeader";

export const metadata: Metadata = {
  title: "디스코그래피·앨범",
  description: "계속 한밤중이면 좋을텐데의 발매 앨범 현황입니다.",
};

export default async function ZutopiaAlbumsPage() {
  const [songCount, albums] = await Promise.all([
    getSongsCount(),
    getAlbumsWithSongs(),
  ]);

  return (
    <div>
      <ZutopiaSectionHeader
        title="디스코그래피"
        description="전체 곡과 앨범 목록"
      />

      <div className="mt-3">
        <SongDbNav songCount={songCount} albumCount={albums.length} />

        <div className="mt-8">
          <AlbumListView albums={albums} />
        </div>
      </div>
    </div>
  );
}
