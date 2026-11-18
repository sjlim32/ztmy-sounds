import type { Metadata } from "next";
import { BASE_OPEN_GRAPH, SITE_NAME, pageAlternates } from "@/lib/seo";
import { notFound } from "next/navigation";
import { songList } from "@/features/guide/data/songs";
import { getSongsWithTag } from "@/features/guide/lib/song-call-tags";
import {
  slamGuideDescription,
  songPageTitle,
} from "@/features/guide/lib/song-meta";

const slamSongList = getSongsWithTag("slam", songList);

// output: "export"는 generateStaticParams()가 빈 배열을 반환하면 빌드가
// 실패합니다. 아직 슬램 태그가 붙은 가사가 하나도 없는 동안에는 전체 곡
// 목록으로 정적 경로를 만들어두고, 실제로는 아래 SlamSongPage의
// getSlamSong() 체크가 각 경로를 404로 처리합니다.
export function generateStaticParams() {
  const songs = slamSongList.length > 0 ? slamSongList : songList;
  return songs.map((song) => ({ songId: song.id }));
}

function getSlamSong(songId: string) {
  return slamSongList.find((song) => song.id === songId) ?? null;
}

export async function generateMetadata(
  props: PageProps<"/slam/[songId]">,
): Promise<Metadata> {
  const { songId } = await props.params;
  const song = getSlamSong(songId);

  if (!song) return {};

  const title = songPageTitle(song);
  const description = slamGuideDescription(song);
  const thumbnail = `https://img.youtube.com/vi/${song.youtubeId}/maxresdefault.jpg`;

  return {
    title,
    description,
    alternates: pageAlternates(`/slam/${song.id}`),
    // openGraph는 루트 값을 통째로 덮어쓰니 공통값(사이트 이름·locale·type)도 함께.
    openGraph: {
      title,
      description,
      url: `/slam/${song.id}`,
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

// 실제 UI는 SongPanel(slam/layout.tsx에 상주)이 라우트 세그먼트를 보고 그립니다.
// 이 페이지는 존재 여부 확인(404)과 라우트 매칭 역할만 합니다. 곡 자체는
// 있어도 슬램 태그가 없으면 404 처리.
export default async function SlamSongPage(props: PageProps<"/slam/[songId]">) {
  const { songId } = await props.params;

  if (!getSlamSong(songId)) {
    notFound();
  }

  return null;
}
