/**
 * 통계 페이지(/zutopia/stats)의 기록 — 빌드 때 서버(data.ts)가 compute.ts로
 * 다 계산해서, 화면(StatsView)에는 글자로 정리된 줄만 내려준다.
 */

/**
 * 순위표 한 칸 — 글자 그대로, 또는 공연 칸(날짜 + 공연 이름: 화면에선 날짜를 위
 * 작은 줄에, 이름을 아래 줄에 나눠 둔다. href가 있으면 이름이 공연 상세 링크).
 */
export type StatCell =
  string | { date: string; label: string; href?: string | null };

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
  cells: StatCell[];
  /** 카드 1위 자리에서 대표 값 아래 덧붙이는 설명 */
  note?: string | null;
}

/** 1위 카드의 연도별 미니 막대 — 1위 하나에만 붙인다(빌드 때 계산). */
export interface StatTrend {
  /** 그래프 이름("해마다 라이브 횟수") */
  label: string;
  /** 값 뒤에 붙는 단위("회") */
  unit: string;
  points: { label: string; value: number }[];
  /** 강조할 막대(공연이 가장 많았던 해의 1위 연도 등) */
  highlight?: string;
}

export interface StatRecord {
  id: string;
  title: string;
  /** 어떻게 셌는지 — 카드와 전체 표 위에 작게 */
  description: string;
  /** 순위·이름 다음 칸들의 이름(첫 칸이 대표 값) */
  columns: string[];
  rows: StatRow[];
  /** 전체 줄 수 — 페이지엔 앞 몇 줄만 싣고(previewSections) 전체는 stats.json에서 받는다. */
  total: number;
  /** 공동 1위 수(1이면 단독) — 미리보기 줄만으로는 셀 수 없어 따로 둔다. */
  leaderCount: number;
  /** 1위의 연도별 흐름(있는 기록만) */
  trend?: StatTrend | null;
}

export interface StatSection {
  id: "songs" | "albums" | "lives" | "places";
  title: string;
  records: StatRecord[];
}

/** 통계 맨 위 요약 줄의 타일 하나 */
export interface StatSummaryItem {
  label: string;
  value: string;
  /** 값 아래 작은 줄 */
  note: string | null;
  /** 0~1 — 있으면 타일 아래 얇은 막대로(세트리스트 확보율) */
  ratio?: number;
}

/** 세트리스트가 아직 없는 공연 목록의 기록 id — stats.json에도 이 키로 싣는다. */
export const MISSING_SETLIST_RECORD_ID = "data-missing-setlist";

/** 통계 맨 위 요약 — 타일들과, 세트리스트가 아직 없는 공연 목록(옆 창으로 연다). */
export interface StatSummary {
  items: StatSummaryItem[];
  missing: StatRecord;
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
