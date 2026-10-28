/**
 * tablet 이상 가이드 상세에서 영상·곡 이동 버튼·응원 안내·곡 정보가 함께 쓰는
 * 세로 열의 폭. GuideMainScrollArea가 크기 컨테이너(container-type: size)라
 * cqh/cqw는 그 영역(높이 94vh-4rem) 기준이다. 영역 높이에서 영상 위·아래
 * 요소 몫(17rem)을 뺀 높이에 16:9로 맞춘 폭의 95%(×16/9×0.95 ≈ ×1.6889), 폭으로는
 * 영역의 95%까지 — 영상을 조금 작게 둬서 아래 설명·GIF 칸 자리를 남긴다.
 * (Tailwind가 클래스를 찾을 수 있도록 문자열을 통째로 둔다.)
 */
export const PLAYER_COLUMN_CLASS =
  "w-full tablet:max-w-[min(95cqw,calc((100cqh-17rem)*1.6889))]";

/**
 * 영상 아래 "동작 예시" GIF 칸(SwingGuideGifSlot) 안 정사각형의 한 변. 화면
 * 폭을 따라 최대 13rem(14vw)이되, 영상 아래 남는 높이를 넘지 않는다 — 넘으면
 * 영역에 스크롤이 생긴다. 남는 높이 = 영역 높이 − 영상 높이(위 열 폭 × 9/16 =
 * min(53.4375cqw, (100cqh−17rem)×0.95)) − 위아래 고정 몫 8.5rem(영역 여백 1rem +
 * 버튼 줄 2.25rem + 간격 1.5rem + 칸 안 라벨·여백 약 3.4rem + 여유). 최소 5rem.
 */
export const GIF_SQUARE_CLASS =
  "w-[min(13rem,14vw,max(5rem,calc(100cqh-min(53.4375cqw,calc((100cqh-17rem)*0.95))-8.5rem)))]";
