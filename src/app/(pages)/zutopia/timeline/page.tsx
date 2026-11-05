import type { Metadata } from "next";
import { getLiveHistory } from "@/features/zutopia/live-history/data";
import {
  getAlbumsWithSongs,
  getSongsWithAlbums,
} from "@/features/zutopia/song-db/data";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import { getSongCoverSrc } from "@/features/zutopia/song-db/song-album-grouping";
import { parseSongMetadata } from "@/features/zutopia/song-db/song-metadata";
import { buildTimelineEvents } from "@/features/zutopia/timeline/events";
import { TimelineView } from "@/features/zutopia/timeline/components/TimelineView";

export const metadata: Metadata = {
  title: "활동 연혁",
  description:
    "즛토마요의 곡 발매, 앨범 발매, 공연을 실제 시간 간격대로 한 줄 연혁으로 보여줍니다.",
};

export default async function ZutopiaTimelinePage() {
  const [history, songs, albums] = await Promise.all([
    getLiveHistory(),
    getSongsWithAlbums(),
    getAlbumsWithSongs(),
  ]);

  // 원곡만 — 편곡·버전 곡은 원곡과 같은 노래라 연혁에선 원곡 발매만 남긴다.
  const events = buildTimelineEvents({
    songs: songs
      .filter((song) => !song.original_song_id)
      .map((song) => ({
        id: song.id,
        slug: song.slug,
        title: song.title,
        titleKo: song.title_ko,
        releaseDate: song.release_date,
        unreleased: parseSongMetadata(song.metadata).isUnreleased,
        albumIds: song.albums.map((album) => album.id),
        coverSrc: getSongCoverSrc(song),
      })),
    albums: albums.map((album) => ({
      id: album.id,
      slug: album.slug,
      title: album.title,
      titleKo: album.title_ko,
      releaseDate: album.release_date,
      coverSrc: album.cover_image_url,
      typeLabel: `${ALBUM_TYPE_SHORT_LABEL[album.album_type]} ${album.album_number}집`,
    })),
    units: history.units,
  });

  return (
    <div>
      <h1 className="sr-only">활동 연혁</h1>
      <TimelineView events={events} />
    </div>
  );
}
