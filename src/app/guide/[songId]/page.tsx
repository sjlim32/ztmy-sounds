import { notFound } from "next/navigation";
import { getSong, songs } from "@/data/songs";

export function generateStaticParams() {
  return songs.map((song) => ({ songId: song.id }));
}

// 실제 UI는 SongPanel(guide/layout.tsx에 상주)이 라우트 세그먼트를 보고 그립니다.
// 이 페이지는 존재 여부 확인(404)과 라우트 매칭 역할만 합니다.
export default async function SongPage(props: PageProps<"/guide/[songId]">) {
  const { songId } = await props.params;

  if (!getSong(songId)) {
    notFound();
  }

  return null;
}
