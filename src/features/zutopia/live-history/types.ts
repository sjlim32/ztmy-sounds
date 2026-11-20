import type { Database, Json } from "@/lib/supabase/database.types";

export type LiveUnitType = Database["public"]["Tables"]["lives"]["Row"]["type"];

/**
 * 공연 단위 — 실제로 열린 하루하루의 공연. 참전 기록의 체크 단위이고,
 * 곡별 라이브 횟수·마지막 라이브도 이 단위로 센다.
 */
export interface LiveUnit {
  /** `${liveId}:${date}` — 로컬 저장 키라 바꾸면 사용자의 체크가 어긋난다. */
  id: string;
  liveId: string;
  /** "YYYY-MM-DD" */
  date: string;
  type: LiveUnitType;
  /** 투어 공연일이면 투어 제목, 아니면 lives.title */
  title: string;
  titleKo: string | null;
  /** region에서 뽑은 한글 도시명 */
  city: string;
  tourId: string | null;
  /** 이틀 이상 공연일 때 1부터, 하루 공연·페스티벌이면 null */
  dayNumber: number | null;
  /** 같은 날 여러 회차 공연(lives.metadata.shows)이면 몇 번째(1부터) — 그 밖엔 없음 */
  showNumber?: number;
  /** 회차 이름("昼の部") — showNumber가 있을 때만 */
  showLabel?: string;
  /** 온라인 공연(region·live_venue가 "online") — 참전 기록·통계에선 뺀다 */
  online?: boolean;
  /** `/zutopia/lives/<투어 slug 또는 live slug>`, slug가 없으면 null */
  href: string | null;
  /** 이날 불린 곡(원곡 id, 중복 없음) */
  songIds: string[];
  /** 이 공연일의 그림 — 공연일 아이콘 → 공연 포스터 → 투어 포스터 */
  imageUrl: string | null;
  /** 묶음(투어·공연) 대표 그림 — 투어면 투어 포스터, 아니면 imageUrl */
  groupImageUrl: string | null;
  /** lives.live_venue(통계용 — 원시 데이터에 있을 때만) */
  venue?: string;
  /** lives.country(통계용) */
  country?: string;
  /** 이날 첫 곡(앵콜 아닌 곡 중 track_number가 가장 작은 곡, 원곡 id) */
  openingSongId?: string | null;
  /** 이날 앵콜로 부른 곡(원곡 id, 중복 없음) */
  encoreSongIds?: string[];
  /** 본편 곡 순서(원곡 id, 처음 나온 자리만) — 세트리스트 위치·이어 부른 곡 통계 */
  mainOrder?: string[];
  /** 앵콜 곡 순서(원곡 id, 처음 나온 자리만) */
  encoreOrder?: string[];
  /** 다른 버전으로 부른 곡(note.variation — "short", "acoustic" …) */
  variations?: { songId: string; name: string }[];
  /**
   * 투어 공통 세트리스트만 있고 그날의 행이 없는 공연일 — 공통 곡은 songIds에 있지만
   * 그날 선택곡을 몰라서, 통계는 세트리스트를 모르는 날로 친다.
   */
  commonOnly?: true;
  /** 곡이 연결되지 않은 커버곡(note.title, 한글 제목 note.title_kr, 원곡 가수 note.original_artist) */
  covers?: { title: string; titleKo: string | null; artist: string | null }[];
}

/** 통계에만 쓰는 공연일 필드 — 클라이언트로 넘길 땐 toClientUnit으로 뺀다. */
export type StatOnlyUnitField =
  | "venue"
  | "country"
  | "openingSongId"
  | "encoreSongIds"
  | "mainOrder"
  | "encoreOrder"
  | "variations"
  | "covers"
  | "commonOnly";

export interface SongLiveStat {
  count: number;
  lastUnitId: string;
  firstUnitId: string;
}

export interface LiveHistory {
  /** 날짜 내림차순(최신 먼저), 같은 날짜면 dayNumber 오름차순 */
  units: LiveUnit[];
  /** 예정 공연일 — 날짜 오름차순. 집계(units·통계)엔 들어가지 않는다. */
  upcoming: LiveUnit[];
  /** 원곡 id → 통계. 라이브 기록 없는 곡은 키 없음. */
  statsBySongId: Record<string, SongLiveStat>;
}

export interface RawLive {
  id: string;
  slug: string | null;
  tour_id: string | null;
  title: string;
  title_ko: string | null;
  type: LiveUnitType;
  start_date: string;
  end_date: string | null;
  live_date: string | null;
  region: string;
  icon_image_url: string | null;
  poster_image_url: string | null;
  live_venue?: string;
  country?: string;
  /** 하루 회차 이름(metadata.shows)을 읽으려고 — 없으면 하루 1회 */
  metadata?: Json | null;
  /** 날짜로 안 정해지는 공연일만 직접 지정한 투어 세트리스트 판 */
  setlist_version_id?: string | null;
}

/** 투어 세트리스트 판(tour_setlist_versions) */
export interface RawTourVersion {
  id: string;
  tour_id: string;
  starts_on: string;
  label: string | null;
  fixed: boolean;
}

export interface RawTour {
  id: string;
  slug: string;
  title: string;
  title_ko: string;
  poster_image_url: string | null;
}

export interface RawSetlistRow {
  live_id: string | null;
  tour_id: string | null;
  song_id: string;
  day_number: number | null;
  track_number?: number;
  is_encore?: boolean;
  /** 같은 날 몇 번째 회차(1부터), 비면 그날 모든 회차 */
  show_number?: number | null;
  /** 세트리스트 메모(variation 등, 통계용) */
  note?: Json | null;
  /** 투어 공통 행의 판 */
  version_id?: string | null;
  /** 공연일 행에서만 — 판의 이 곡을 그날 세트리스트에서 뺀다 */
  omitted?: boolean;
}

/** 곡이 연결되지 않은 커버곡 행(통계용) — 나누는 규칙은 RawSetlistRow와 같다. */
export interface RawCoverRow {
  live_id: string | null;
  tour_id: string | null;
  day_number: number | null;
  show_number?: number | null;
  title: string;
  titleKo: string | null;
  artist: string | null;
  track_number?: number;
  is_encore?: boolean;
  version_id?: string | null;
  omitted?: boolean;
}
