export type CallTag = "chant" | "clap";

export type CallIconName = "wave" | "clap" | "mic";

export interface LyricSegment {
  text: string;
  tag?: CallTag;
}

export type LyricText = string | LyricSegment[];

/** "mm:ss" or "mm:ss.s" (sub-second precision optional), e.g. "1:05" or "1:05.5". */
export type Timestamp = `${number}:${number}`;

export interface LyricLine {
  /** When this line starts in the YouTube video. */
  time: Timestamp;
  original: string;
  pronunciation: LyricText;
  translation: string;
  /** Background/chorus call that layers behind the main line. */
  background?: LyricText;
}

export interface Song {
  id: string;
  title: string;
  youtubeId: string;
  lyrics: LyricLine[];
}
