export const CALL_TAGS = ["swing", "clap", "call"] as const;
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
  interlude?: boolean;
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
  tag: CallTag[];
  lyrics: LyricLine[];
}
