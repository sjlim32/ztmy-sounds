export type CallTag = "chant" | "clap";

export type CallIconName = "wave" | "clap" | "mic";

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
  background?: LyricText;
}

export interface Song {
  id: string;
  title: string;
  youtubeId: string;
  lyrics: LyricLine[];
}
