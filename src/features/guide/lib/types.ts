export const CALL_TAGS = ["swing", "clap", "call", "dance", "slam"] as const;
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
  /**
   * 박수 타이밍 — 이 줄의 time으로부터 몇 초 뒤인지. pronunciation 안의 ✋를 앞에서부터
   * 순서대로 하나씩 대응합니다(개수가 모자라면 남는 ✋는 애니메이션 없이 표시).
   */
  claps?: number[];
  /** 이 줄이 재생 중일 때 곡의 swingGif를 띄움(모바일 화면 우측, 태블릿 이상 가사 영역 우측) */
  swingGif?: boolean;
}

export interface SongTitle {
  /** 곡 목록에 851MkPOP으로 표시 — 폰트 서브셋이 `jp: "…"` 문자열에서 글자를 모으므로 문자열 하나로 적기 */
  jp: string;
  kr: string;
  en: string;
}

export interface Song {
  id: string;
  title: SongTitle;
  youtubeId: string;
  /** 곡 목록 중요도 필터용 — "essential"(필수 숙지) / "recommended"(예습 중요) */
  importance?: SongImportance;
  /** 스윙 동작 예시 애니메이션 경로 (`/assets/guide/<song-id>.webp`, 원본 크기로 표시) */
  /** 여러 개면 하나가 한 바퀴 끝날 때마다 다음 것으로 번갈아 재생한다 */
  swingGif?: string | readonly string[];
  /** 지정하면 swingGif를 이 크기(px)의 정사각형에 맞춰 가운데만 보이게 표시 (파일은 그대로) */
  swingGifSize?: number;
  /**
   * 정사각형으로 자르지 않고 원본 비율 그대로 보일 GIF의 모바일 표시 폭(px).
   * 태블릿 이상 "동작 예시" 칸은 칸 폭에 맞춘다. swingGifSize와 같이 쓰지 않는다.
   */
  swingGifWidth?: number;
  /** 태블릿 이상 영상 아래 곡 설명. 없으면 임시 예시 문구를 보여준다. */
  description?: SongDescription;
  lyrics: LyricLine[];
}

export const SONG_IMPORTANCES = ["essential", "recommended"] as const;
export type SongImportance = (typeof SONG_IMPORTANCES)[number];

export interface SongDescription {
  /** 곡 소개 한두 문장 */
  summary: string;
  /** 처음 온 사람이 알아두면 좋은 응원 포인트 */
  points?: string[];
}
