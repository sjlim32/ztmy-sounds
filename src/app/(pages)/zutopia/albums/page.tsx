import type { Metadata } from "next";
import { Suspense } from "react";
import { getAlbumsWithSongs } from "@/features/zutopia/song-db/data";
import { AlbumListView } from "@/features/zutopia/song-db/components/AlbumListView";

export const metadata: Metadata = {
  title: "디스코그래피·앨범",
  description: "계속 한밤중이면 좋을텐데의 발매 앨범 현황입니다.",
};

export default async function ZutopiaAlbumsPage() {
  const albums = await getAlbumsWithSongs();

  // 페이지 이름·곡·앨범 사이 이동은 헤더(SiteHeader)가 맡아서, 본문엔 화면에
  // 안 보이는 제목(h1)만 둔다(화면 읽기·검색 노출용).
  return (
    <div>
      <h1 className="sr-only">즛토피아 앨범 목록</h1>
      {/* AlbumListView가 드로어 상태를 URL 쿼리스트링(useSearchParams)
      으로 들고 있어서(AlbumListView 주석 참고), 정적 export 빌드
      요구사항대로 Suspense로 감싸야 한다. */}
      <Suspense fallback={null}>
        <AlbumListView albums={albums} summary={`전체 ${albums.length}개`} />
      </Suspense>
    </div>
  );
}
