import type { Metadata } from "next";
import { Suspense } from "react";
import { getSongsWithAlbums } from "@/features/zutopia/song-db/data";
import { parseSongMetadata } from "@/features/zutopia/song-db/song-metadata";
import { SongListView } from "@/features/zutopia/song-db/components/SongListView";

export const metadata: Metadata = {
  title: "디스코그래피·곡",
  description: "계속 한밤중이면 좋을텐데의 발매 음원 현황입니다.",
};

export default async function ZutopiaSongsPage() {
  const songs = await getSongsWithAlbums();

  const unreleased = songs.filter(
    (song) => parseSongMetadata(song.metadata).isUnreleased,
  ).length;
  const released = songs.length - unreleased;

  // 페이지 이름·곡·앨범 사이 이동은 헤더(SiteHeader)가 맡아서, 본문엔 화면에
  // 안 보이는 제목(h1)만 둔다(화면 읽기·검색 노출용).
  return (
    <div>
      <h1 className="sr-only">즛토피아 곡 목록</h1>
      {/* SongListView가 드로어 상태를 URL 쿼리스트링(useSearchParams)
      으로 들고 있어서(SongListView 주석 참고), 정적 export 빌드
      요구사항대로 Suspense로 감싸야 한다. */}
      <Suspense fallback={null}>
        <SongListView
          songs={songs}
          summary={`전체 ${released}곡${
            unreleased > 0 ? ` · 미공개 ${unreleased}곡` : ""
          }`}
        />
      </Suspense>
    </div>
  );
}
