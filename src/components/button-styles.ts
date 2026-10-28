/**
 * 사이트 공용 버튼 스타일 — 모던·심플: 모서리가 살짝 둥근 사각형(rounded-lg),
 * 단색 면과 테두리로만 상태를 구분한다. 알약 모양·그라데이션·한쪽 면만
 * 강조하는 막대는 쓰지 않는다. 크기·위치·노출 조건은 호출부가 className으로
 * 얹는다(cn으로 합치기).
 */

export const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none";

/** 이동(뒤로가기·메인으로·설치·공유): 배경 위에 떠 있는 어두운 면 + 2px 테두리. */
export const NAV_BUTTON_CLASS = `inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-white/15 bg-black/50 font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white ${FOCUS_RING}`;

/**
 * 필터 칩(가이드 곡 목록의 중요도·응원법): 작은 칸 + 1px 테두리, 고른 칸은
 * 사이트 대표색(마젠타)으로 옅게 칠하고 테두리를 마젠타로. 이동 버튼(2px
 * 테두리)·헤더 탭(밑줄)과 한눈에 구분되게 필터만의 모양을 쓴다.
 */
export const FILTER_CHIP_CLASS = `inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2.5 text-sm font-medium whitespace-nowrap text-white/70 transition-colors hover:border-white/35 hover:text-white ${FOCUS_RING}`;
export const ACTIVE_FILTER_CHIP_CLASS =
  "border-ztmy-magenta/80 bg-ztmy-magenta/20 text-white hover:border-ztmy-magenta";

/**
 * 헤더 탭(SiteHeader 안의 공연 정보 탭·즛토피아 구역 이동): 버튼 면 없이 글자
 * 색 + 아래 밑줄로 고른 칸을 표시한다. 탭이 헤더 높이를 꽉 채워서(h-full)
 * 밑줄이 헤더 아래 경계선에 붙는다 — 감싸는 줄도 h-full이어야 한다.
 */
export const HEADER_TAB_CLASS = `inline-flex h-full shrink-0 items-center border-b-2 border-transparent px-1 text-sm font-medium whitespace-nowrap text-white/55 transition-colors hover:text-white ${FOCUS_RING}`;
export const ACTIVE_HEADER_TAB_CLASS =
  "border-ztmy-magenta font-semibold text-white";

/** 링크(다른 페이지·구역으로 이동하는 글자 버튼): 투명 면 + 2px 테두리, 끝에 화살표는 호출부가. */
export const LINK_BUTTON_CLASS = `inline-flex items-center gap-1.5 rounded-lg border-2 border-white/15 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white ${FOCUS_RING}`;

/** 동작(모바일 설치 배너의 "추가"처럼 눌러서 실행): 사이트 대표색 단색 면. */
export const ACTION_BUTTON_CLASS = `bg-ztmy-magenta hover:bg-ztmy-magenta/85 inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold text-white transition-colors ${FOCUS_RING}`;

/** 닫기처럼 테두리 없는 아이콘 버튼: 평소엔 글자색만, hover 때 옅은 면. */
/**
 * 테두리·면 없는 글자 버튼(가이드 상세 영상 위 버튼 줄처럼 콘텐츠 옆에서
 * 눈에 덜 띄어야 하는 곳): 평소엔 흐린 글자, 마우스를 올리면 옅은 면.
 */
export const GHOST_BUTTON_CLASS = `inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35 ${FOCUS_RING}`;
export const GHOST_ICON_BUTTON_CLASS = `inline-flex items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white ${FOCUS_RING}`;

/** 목록의 한 줄(가이드 곡 목록·곡 목록 드로어): 고른 줄은 한쪽 막대 대신 줄 전체를 옅게 칠한다. */
export const LIST_ITEM_CLASS = `rounded-lg transition-colors hover:bg-white/10 ${FOCUS_RING}`;
export const ACTIVE_LIST_ITEM_CLASS = "bg-white/15 hover:bg-white/15";
