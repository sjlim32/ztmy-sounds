/**
 * 공연·투어 상세의 카드 면 — 배경 그림이 화려해서 반투명만으로는 글자가 묻힌다.
 * 어두운 면(black/55) + 흐림으로 뒤를 가라앉혀 읽기 쉽게 한다. 티켓(LiveTicket),
 * 세트리스트(Setlist), 투어 공연일 행(TourDateList)이 같이 쓴다.
 */
export const LIVE_SURFACE_CLASS =
  "border border-white/10 bg-black/55 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.4)]";

/** 카드 밖 섹션 제목(공연 일정 등) — 배경 위에서도 읽히게 글자 그림자. */
export const LIVE_SECTION_TITLE_SHADOW =
  "drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]";
