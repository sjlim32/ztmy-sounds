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

/**
 * 공연·투어 상세의 작은 태그(선택곡·DAY 1·DAY 2·ENCORE·내한) — 가이드 곡 목록의
 * 중요도 배지와 같은 모양: 알약·테두리 없이 모서리 살짝 둥근 옅은 면 + 같은
 * 계열 글자. 높이를 20px로 고정해 줄마다 같은 크기로 선다.
 */
export const LIVE_TAG_CLASS =
  "inline-flex h-5 shrink-0 items-center rounded px-1.5 text-xs leading-none font-bold whitespace-nowrap";

export const LIVE_TAG_TONE = {
  /** 선택곡 — 선택곡 줄은 행도 옅은 하늘색이라 면을 조금 더 진하게. */
  selected: "bg-ztmy-sky/25 text-ztmy-sky",
  /** 일차 — 날마다 다른 색(1일차 분홍, 2일차 보라, 이후 반복). */
  day: ["bg-ztmy-pink/30 text-ztmy-pink", "bg-ztmy-purple/45 text-white"],
  encore: "bg-ztmy-sun/15 text-ztmy-sun",
  /**
   * 내한 — 눈에 띄어야 해서 꽉 찬 면. 홈 화면의 내한(NEXT VISIT) 색과 같은
   * 마젠타(원정은 하늘색). 노랑은 ENCORE에만 쓴다.
   */
  visit: "bg-ztmy-magenta text-white",
} as const;
