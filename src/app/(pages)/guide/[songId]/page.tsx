import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSong, songList } from "@/features/guide/data/songs";

export function generateStaticParams() {
  return songList.map((song) => ({ songId: song.id }));
}

export async function generateMetadata(
  props: PageProps<"/guide/[songId]">,
): Promise<Metadata> {
  const { songId } = await props.params;
  const song = getSong(songId);

  if (!song) return {};

  const title = `${song.title.jp} (${song.title.kr})`;
  const description = `${song.title.kr} (${song.title.en}) 샤모지 콜가이드`;
  const thumbnail = `https://img.youtube.com/vi/${song.youtubeId}/maxresdefault.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: thumbnail, width: 1280, height: 720 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [thumbnail],
    },
  };
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
