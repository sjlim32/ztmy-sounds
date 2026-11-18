import type { Metadata } from "next";
import { BASE_OPEN_GRAPH, SITE_NAME, pageAlternates } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getSong, songList } from "@/features/guide/data/songs";
import {
  cheerGuideDescription,
  songPageTitle,
} from "@/features/guide/lib/song-meta";

export function generateStaticParams() {
  return songList.map((song) => ({ songId: song.id }));
}

export async function generateMetadata(
  props: PageProps<"/guide/[songId]">,
): Promise<Metadata> {
  const { songId } = await props.params;
  const song = getSong(songId);

  if (!song) return {};

  const title = songPageTitle(song);
  const description = cheerGuideDescription(song);
  const thumbnail = `https://img.youtube.com/vi/${song.youtubeId}/maxresdefault.jpg`;

  return {
    title,
    description,
    alternates: pageAlternates(`/guide/${song.id}`),
    // openGraph는 루트 값을 통째로 덮어쓰니 공통값(사이트 이름·locale·type)도 함께.
    openGraph: {
      title,
      description,
      url: `/guide/${song.id}`,
      siteName: SITE_NAME,
      ...BASE_OPEN_GRAPH,
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
