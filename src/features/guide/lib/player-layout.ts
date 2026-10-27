/**
 * tablet 이상 가이드 상세에서 영상·곡 이동 버튼·응원 안내·곡 정보가 함께 쓰는
 * 세로 열의 폭. 메인 영역 높이(88vh)에서 영상 아래·위 요소 몫(약 16rem)을 뺀
 * 높이에 16:9로 맞춘 폭이라, 영상이 줄어든 만큼 아래에 설명 자리가 생긴다.
 * (Tailwind가 클래스를 찾을 수 있도록 문자열을 통째로 둔다.)
 */
export const PLAYER_COLUMN_CLASS =
  "w-full tablet:max-w-[min(100%,calc((88vh-16rem)*16/9))]";
