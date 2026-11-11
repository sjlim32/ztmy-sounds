/**
 * 즛토피아 카드 면 — 배경 그림이 화려해서 옅은 흰 면으로는 글자·칩이 묻혀,
 * 어두운 면 + 그림자 + 흐림을 쓴다. 필터 카드(FilterPanel), 참전 기록 현황
 * 막대·목록 카드, 통계 기록 카드가 같이 쓴다. 공연 상세 티켓의 면은
 * lives/surface.ts의 LIVE_SURFACE_CLASS(살짝 옅은 55%)로 따로 둔다.
 *
 * "use client" 파일이 아닌 순수 모듈이라 서버 컴포넌트에서 가져와도 문자열 그대로다.
 */
export const ZUTOPIA_SURFACE_CLASS =
  "rounded-lg border border-white/10 bg-black/60 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md";
