import type { Song } from "@/lib/guide/types";

const song: Song = {
  id: "sample-song-two",
  title: "Sample Song Two",
  youtubeId: "dQw4w9WgXcQ",
  lyrics: [
    {
      time: "0:00",
      original: "[clap]Another sample line",
      pronunciation: [{ text: "어나더 샘플 라인", tag: "clap" }],
      translation: "Another sample line",
    },
    {
      time: "0:12",
      original: "[wave]Second verse chant",
      pronunciation: [{ text: "세컨드 벌스 챈트", tag: "chant" }],
      translation: "Second verse chant",
    },
  ],
};

export default song;
