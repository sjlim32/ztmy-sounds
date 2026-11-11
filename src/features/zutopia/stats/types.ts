/**
 * 통계 페이지(/zutopia/stats)의 기록 — 빌드 때 서버(data.ts)가 compute.ts로
 * 다 계산해서, 화면(StatsView)에는 글자로 정리된 줄만 내려준다.
 */

/** 순위표 한 줄. cells는 기록의 columns와 같은 순서(첫 칸이 대표 값). */
export interface StatRow {
  key: string;
  /** 동점이면 같은 순위 — 정렬된 순서대로 앞줄과 score가 같으면 같은 순위. */
  rank: number;
  name: string;
  /** 이름 아래 작은 줄(한글 제목, 날짜·도시 등) */
  sub?: string | null;
  image?: string | null;
  href?: string | null;
  cells: string[];
  /** 카드 1위 자리에서 대표 값 아래 덧붙이는 설명 */
  note?: string | null;
}

export interface StatRecord {
  id: string;
  title: string;
  /** 어떻게 셌는지 — 카드와 전체 표 위에 작게 */
  description: string;
  /** 순위·이름 다음 칸들의 이름(첫 칸이 대표 값) */
  columns: string[];
  rows: StatRow[];
}

export interface StatSection {
  id: "songs" | "albums" | "lives" | "places";
  title: string;
  records: StatRecord[];
}

/** 통계에 쓰는 곡 — 원곡·발매곡만(페이지에서 거른다). */
export interface StatSong {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  /** "YYYY-MM-DD" */
  releaseDate: string;
  cover: string | null;
}

export interface StatAlbum {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  cover: string | null;
  /** 수록곡(원곡 id, StatSong에 있는 곡만, 중복 없음) */
  songIds: string[];
}

export interface StatTour {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  startDate: string;
  endDate: string | null;
  poster: string | null;
}
