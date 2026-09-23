import type { Database } from "@/lib/supabase/database.types";

export type Live = Database["public"]["Tables"]["lives"]["Row"];
export type Tour = Database["public"]["Tables"]["tours"]["Row"];

export interface LiveSetlistEntry {
  songId: string;
  title: string;
  titleKo: string;
  // 이 곡의 응원 가이드(/guide/[songId])가 있으면 그 경로, 없으면 null.
  guideHref: string | null;
}

export interface LiveDetail extends Live {
  setlist: LiveSetlistEntry[];
}

export interface TourDateEntry {
  slug: string;
  title: string;
  titleKo: string;
  date: string;
  venue: string;
}

export interface TourDetail extends Tour {
  // 이 투어에 묶인 개별 공연일(lives.tour_id로 연결) — 아직 없을 수 있다.
  dates: TourDateEntry[];
}
