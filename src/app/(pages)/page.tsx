import { songList } from "@/features/guide/data/songs";
import { getSongsWithAlbums } from "@/features/zutopia/song-db/data";
import { getSongCoverSrc } from "@/features/zutopia/song-db/song-album-grouping";
import { HomeScreen } from "@/features/home/components/HomeScreen";
import type { PracticeSong } from "@/features/home/components/PracticeShortcuts";

// 곡 데이터엔 가사가 통째로 들어 있어서, 홈(클라이언트 컴포넌트)엔 바로가기에
// 필요한 제목·커버만 넘긴다 — 직접 import하면 가사 전체가 홈 번들에 실린다.
// 커버는 곡/앨범 DB(Supabase)에서 빌드 때 가져온다(가이드 곡 id = DB slug).
export default async function Home() {
  const dbSongs = await getSongsWithAlbums();
  const coverBySlug = new Map(
    dbSongs.map((song) => [song.slug, getSongCoverSrc(song)]),
  );

  const practiceSongs: PracticeSong[] = songList.map((song) => ({
    id: song.id,
    title: song.title.kr,
    jpTitle: song.title.jp,
    cover: coverBySlug.get(song.id) ?? null,
    essential: song.importance === "essential",
  }));

  return <HomeScreen practiceSongs={practiceSongs} />;
}
