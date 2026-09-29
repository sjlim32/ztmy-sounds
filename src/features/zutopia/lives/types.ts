import type { Database } from "@/lib/supabase/database.types";

export type Live = Database["public"]["Tables"]["lives"]["Row"];
export type Tour = Database["public"]["Tables"]["tours"]["Row"];

export interface LiveSetlistEntry {
  songId: string;
  title: string;
  titleKo: string;
  // 이 곡의 응원 가이드(/guide/[songId])가 있으면 그 경로, 없으면 null.
  guideHref: string | null;
  trackNumber: number;
  isEncore: boolean;
  // 투어 공통 세트리스트엔 없고 그 공연일에만 있는 곡("선택곡").
  isSelected: boolean;
  // 공연 일차(1: 첫째날, 2: 둘째날, ...). 공통 곡이거나 단일 공연이면 null.
  dayNumber: number | null;
  // 편곡 정보(setlists.note.arrange). 없으면 null.
  arrange: string | null;
}

export interface LiveDetail extends Live {
  setlist: LiveSetlistEntry[];
}

// 투어에 묶인 개별 공연일 — 자기 slug/상세 페이지 없이 투어 상세 안에서만
// 펼쳐 보여주므로 행 id를 키로 쓴다.
export interface TourDateEntry {
  id: string;
  // 드로어 헤더용 한글 전체 표기("2026년 2월 28일 ~ 2026년 3월 1일").
  date: string;
  // 목록 행의 컴팩트 날짜 칸용 원본 ISO 날짜("YYYY-MM-DD").
  startDate: string;
  endDate: string | null;
  country: string;
  // region "東京 (도쿄)"을 목록 행에서 한글 도시명(큰 글자) + 원어(작은
  // 글자)로 나눠 보여주기 위한 값. 괄호가 없으면 cityOriginal은 null.
  city: string;
  cityOriginal: string | null;
  region: string;
  venue: string;
  posterImageUrl: string | null;
  additionalImageUrls: string[];
  setlist: LiveSetlistEntry[];
}

export interface TourDetail extends Tour {
  // 이 투어에 묶인 개별 공연일(lives.tour_id로 연결) — 아직 없을 수 있다.
  dates: TourDateEntry[];
}
