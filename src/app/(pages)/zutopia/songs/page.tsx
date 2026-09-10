import type { Metadata } from "next";
import {
  getAlbumsCount,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { SongDbNav } from "@/features/zutopia/song-db/components/SongDbNav";
import { SongListView } from "@/features/zutopia/song-db/components/SongListView";
import { ZutopiaSectionHeader } from "@/features/zutopia/components/ZutopiaSectionHeader";

export const metadata: Metadata = {
  title: "디스코그래피·곡",
  description: "계속 한밤중이면 좋을텐데의 발매 음원 현황입니다.",
};

export default async function ZutopiaSongsPage() {
  const [songs, albumCount] = await Promise.all([
    getSongsWithAlbums(),
    getAlbumsCount(),
  ]);

  return (
    <div>
      <ZutopiaSectionHeader
        title="디스코그래피"
        description="전체 곡과 앨범 목록"
      />

      <div className="mt-3">
        <SongDbNav songCount={songs.length} albumCount={albumCount} />

        <div className="mt-8">
          <SongListView songs={songs} />
        </div>
      </div>
    </div>
  );
}
