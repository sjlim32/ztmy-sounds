/**
 * 모바일 상단 바 가운데 글자(페이지 이름 ↔ 곡 제목)가 바뀔 때의 전환 —
 * 새 글자는 살짝 아래에서 올라오며 나타나고(@starting-style, key로 새로 그릴 때),
 * 숨는 글자는 서서히 사라진다(opacity). MobileHeader와 MobileSongTitle이 같이 쓴다.
 * 움직임 줄이기 설정이면 전환 없이 바로 바꾼다.
 */
export const HEADER_TITLE_TRANSITION =
  "transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none";
