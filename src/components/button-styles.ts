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

/**
 * 테두리·면 없는 글자 버튼(가이드 상세 영상 위 버튼 줄처럼 콘텐츠 옆에서
 * 눈에 덜 띄어야 하는 곳): 평소엔 흐린 글자, 마우스를 올리면 옅은 면.
 */
export const GHOST_BUTTON_CLASS = `inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35 ${FOCUS_RING}`;
/** 닫기처럼 테두리 없는 아이콘 버튼: 평소엔 글자색만, hover 때 옅은 면. */
export const GHOST_ICON_BUTTON_CLASS = `inline-flex items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white ${FOCUS_RING}`;

/**
 * 그림 위에 떠 있는 아이콘 버튼(곡·앨범 드로어 닫기처럼 커버 그림 위에 겹치는 곳):
 * 테두리 없는 아이콘 버튼에 어두운 면을 깔아 밝은 그림 위에서도 보이게 한다.
 */
export const OVERLAY_ICON_BUTTON_CLASS = `inline-flex items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 ${FOCUS_RING}`;

/** 목록의 한 줄(가이드 곡 목록·곡 목록 드로어): 고른 줄은 한쪽 막대 대신 줄 전체를 옅게 칠한다. */
export const LIST_ITEM_CLASS = `rounded-lg transition-colors hover:bg-white/10 ${FOCUS_RING}`;
export const ACTIVE_LIST_ITEM_CLASS = "bg-white/15 hover:bg-white/15";

/**
 * 차분한 채움 버튼(참전 기록의 작업 버튼들): 투명 면 대신 옅은 흰 면 + 얇은
 * 테두리로 배경 위에서 버튼임이 보이되 튀지 않게. 주 동작은 마젠타를 옅게
 * 섞은 면(SOFT_PRIMARY) — 원색 단색 면보다 눈이 편하다. 보라(SOFT_PURPLE)는
 * 주 동작과 나란히 놓이는 또 하나의 중요한 동작(공연 체크)에 — 마젠타와 색으로
 * 구분된다. 보라가 어두운 색이라 면을 조금 더 진하게 섞는다.
 */
export const SOFT_BUTTON_CLASS = `inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium whitespace-nowrap text-white/90 transition-colors hover:border-white/20 hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`;
export const SOFT_PRIMARY_BUTTON_CLASS = `inline-flex items-center justify-center gap-1.5 rounded-lg border border-ztmy-magenta/35 bg-ztmy-magenta/20 px-3 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:border-ztmy-magenta/50 hover:bg-ztmy-magenta/30 disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`;
export const SOFT_PURPLE_BUTTON_CLASS = `inline-flex items-center justify-center gap-1.5 rounded-lg border border-ztmy-purple/50 bg-ztmy-purple/30 px-3 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:border-ztmy-purple/70 hover:bg-ztmy-purple/40 disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`;
