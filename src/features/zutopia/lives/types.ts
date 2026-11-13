import type { Database } from "@/lib/supabase/database.types";

export type Live = Database["public"]["Tables"]["lives"]["Row"];
export type Tour = Database["public"]["Tables"]["tours"]["Row"];

export interface LiveSetlistEntry {
  songId: string;
  title: string;
  titleKo: string;
  // 영어 제목(songs.title_en) — 세트리스트에서 제목 아래 작은 줄로 보여준다.
  titleEn: string;
  // 이 곡의 응원 가이드(/guide/[songId])가 있으면 그 경로, 없으면 null.
  guideHref: string | null;
  trackNumber: number;
  isEncore: boolean;
  // 투어 공통 세트리스트엔 없고 그 공연일에만 있는 곡("선택곡").
  isSelected: boolean;
  // 공연 일차(1: 첫째날, 2: 둘째날, ...). 공통 곡이거나 단일 공연이면 null.
  dayNumber: number | null;
  // 같은 날 몇 번째 회차(setlists.show_number). 비면 그날 모든 회차.
  showNumber: number | null;
  // 회차 이름("昼の部") — 상세 화면에서 회차별로 나눌 때(live-days.ts)만 채운다.
  showLabel: string | null;
  // 편곡 정보(setlists.note.arrange). 없으면 null.
  arrange: string | null;
  // 덧붙임 정보(setlists.note.info — "Short ver.", "Live debut" 등). 없으면 null.
  info: string | null;
  // 공연 속 코너 이름(setlists.note.variation — 여러 곡이 한 코너로 이어진다). 없으면 null.
  variation: string | null;
  // 미공개곡(songs.metadata.unrelease) — 세트리스트에 "미공개" 태그.
  unreleased: boolean;
  // 커버곡(note.info "cover" — 곡 행 없이 note.title로 들어간 남의 곡). 제목 앞 [커버송].
  isCover: boolean;
  // 커버곡의 원곡 아티스트(note.original_artist) — 제목 아래 줄에.
  coverArtist: string | null;
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
  // 목록 행 썸네일(없으면 포스터로 대신) + 펼침 영역 작은 이미지 목록 맨 앞.
  iconImageUrl: string | null;
  posterImageUrl: string | null;
  additionalImageUrls: string[];
  setlist: LiveSetlistEntry[];
  /** 취소된 공연일(lives.status = 'CANCELED') — 일정에 회색·취소선, 펼칠 수 없다. */
  canceled?: boolean;
  /** 이틀 이상 단독 공연을 날마다 나눴을 때의 일차(1, 2…) — 투어 공연일이면 없음. */
  dayNumber?: number;
  /** 같은 날 여러 회차 공연을 나눴을 때의 회차 이름(lives.metadata.shows) */
  showLabel?: string;
  /** 그 회차의 개장·개연 시각 "HH:MM"(lives.metadata.shows의 open·start) */
  openTime?: string;
  startTime?: string;
}

export interface TourDetail extends Tour {
  // 투어 공통 세트리스트(setlists.tour_id) — 공연일마다 바뀌는 선택곡은 빠진다.
  setlist: LiveSetlistEntry[];
  // 이 투어에 묶인 개별 공연일(lives.tour_id로 연결) — 아직 없을 수 있다.
  dates: TourDateEntry[];
}
