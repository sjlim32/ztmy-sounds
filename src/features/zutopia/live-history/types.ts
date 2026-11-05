import type { Database } from "@/lib/supabase/database.types";

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
  /** `/zutopia/lives/<투어 slug 또는 live slug>`, slug가 없으면 null */
  href: string | null;
  /** 이날 불린 곡(원곡 id, 중복 없음) */
  songIds: string[];
  /** 이 공연일의 그림 — 공연일 아이콘 → 공연 포스터 → 투어 포스터 */
  imageUrl: string | null;
  /** 묶음(투어·공연) 대표 그림 — 투어면 투어 포스터, 아니면 imageUrl */
  groupImageUrl: string | null;
}

export interface SongLiveStat {
  count: number;
  lastUnitId: string;
  firstUnitId: string;
}

export interface LiveHistory {
  /** 날짜 내림차순(최신 먼저), 같은 날짜면 dayNumber 오름차순 */
  units: LiveUnit[];
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
}
