import type { Song, SongDescription } from "@/features/guide/lib/types";

/**
 * 곡 설명이 아직 없는 곡에 임시로 보여주는 예시 문구 — 영상 아래 설명 영역의
 * 레이아웃을 잡기 위한 목데이터. 곡마다 `Song.description`을 채우면 대체된다.
 */
const MOCK_DESCRIPTION: SongDescription = {
  summary: "",
  points: [""],
};

export function getSongDescription(song: Song): SongDescription {
  return song.description ?? MOCK_DESCRIPTION;
}
