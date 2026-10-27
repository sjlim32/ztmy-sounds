/**
 * 사이트 공용 버튼 스타일 — 모던·심플: 모서리가 살짝 둥근 사각형(rounded-lg),
 * 단색 면과 테두리로만 상태를 구분한다. 알약 모양·그라데이션·한쪽 면만
 * 강조하는 막대는 쓰지 않는다. 크기·위치·노출 조건은 호출부가 className으로
 * 얹는다(cn으로 합치기).
 */

export const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none";

/** 이동(뒤로가기·메인으로·가이드 곡 이동·설치·공유): 배경 위에 떠 있는 어두운 면 + 2px 테두리. */
export const NAV_BUTTON_CLASS = `inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-white/15 bg-black/50 font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white ${FOCUS_RING}`;

/**
 * 탭·필터처럼 "여러 개 중 고르기": 칸마다 따로 떨어진 버튼, 고른 칸은 흰 면으로
 * 꽉 채워 반전시킨다(막대·밑줄 없이 면 전체로 선택 상태를 보여줌).
 */
export const TAB_LIST_CLASS = "flex flex-wrap gap-2";
export const TAB_CLASS = `rounded-lg border-2 border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-sm transition-colors hover:border-white/30 hover:text-white ${FOCUS_RING}`;
export const ACTIVE_TAB_CLASS =
  "border-white bg-white text-ztmy-dark hover:border-white hover:text-ztmy-dark";

/** 링크(다른 페이지·구역으로 이동하는 글자 버튼): 투명 면 + 2px 테두리, 끝에 화살표는 호출부가. */
export const LINK_BUTTON_CLASS = `inline-flex items-center gap-1.5 rounded-lg border-2 border-white/15 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white ${FOCUS_RING}`;

/** 동작(모바일 설치 배너의 "추가"처럼 눌러서 실행): 사이트 대표색 단색 면. */
export const ACTION_BUTTON_CLASS = `bg-ztmy-magenta hover:bg-ztmy-magenta/85 inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold text-white transition-colors ${FOCUS_RING}`;

/** 닫기처럼 테두리 없는 아이콘 버튼: 평소엔 글자색만, hover 때 옅은 면. */
export const GHOST_ICON_BUTTON_CLASS = `inline-flex items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white ${FOCUS_RING}`;

/** 목록의 한 줄(가이드 곡 목록·곡 목록 드로어): 고른 줄은 한쪽 막대 대신 줄 전체를 옅게 칠한다. */
export const LIST_ITEM_CLASS = `rounded-lg transition-colors hover:bg-white/10 ${FOCUS_RING}`;
export const ACTIVE_LIST_ITEM_CLASS = "bg-white/15 hover:bg-white/15";
