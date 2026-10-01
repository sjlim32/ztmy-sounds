export const CALL_TAGS = ["swing", "clap", "call", "slam"] as const;
export type CallTag = (typeof CALL_TAGS)[number];

export interface LyricSegment {
  text: string;
  tag?: CallTag;
}

export type LyricText = string | LyricSegment[];
export type Timestamp = `${number}:${number}`; // "mm:ss" 또는 "mm:ss.s"

export interface LyricLine {
  time: Timestamp;
  original: string;
  pronunciation: LyricText;
  translation: string;
  cheer?: string | LyricSegment;
  slam?: string;
  interlude?: boolean;
  /** 모바일에서 이 줄이 재생 중일 때 곡의 swingGif를 띄움 */
  swingGif?: boolean;
}

export interface SongTitle {
  jp: string;
  kr: string;
  en: string;
}

export interface Song {
  id: string;
  title: SongTitle;
  youtubeId: string;
  /** 스윙 동작 예시 애니메이션 경로 (`/assets/guide/<song-id>.webp`, 원본 크기로 표시) */
  swingGif?: string;
  /** 지정하면 swingGif를 이 크기(px)의 정사각형에 맞춰 가운데만 보이게 표시 (파일은 그대로) */
  swingGifSize?: number;
  lyrics: LyricLine[];
}
