import type { Song, SongDescription } from "@/features/guide/lib/types";

/**
 * 곡 설명이 아직 없는 곡에 임시로 보여주는 예시 문구 — 영상 아래 설명 영역의
 * 레이아웃을 잡기 위한 목데이터. 곡마다 `Song.description`을 채우면 대체된다.
 */
const MOCK_DESCRIPTION: SongDescription = {
  summary:
    "곡 소개가 들어갈 자리입니다. 어떤 분위기의 곡인지, 라이브에서 어떤 순간이 하이라이트인지 한두 문장으로 소개합니다.",
  points: [
    "가사에 배지가 붙은 줄에서 응원해요",
    "형광펜이 칠해진 단어에 맞춰 샤모지를 움직여요",
    "가사를 누르면 그 부분부터 영상이 재생돼요",
  ],
};

export function getSongDescription(song: Song): {
  description: SongDescription;
  isMock: boolean;
} {
  return song.description
    ? { description: song.description, isMock: false }
    : { description: MOCK_DESCRIPTION, isMock: true };
}
