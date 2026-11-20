/**
 * 세트리스트 줄의 곡 커버 — 커버가 아예 없는 곡(남의 곡을 부른 커버곡 등)은 미공개곡이
 * 쓰는 우니구리 물음표 그림으로 채운다(빈 칸 대신).
 */
export const UNKNOWN_COVER_SRC =
  "https://assets.ztmy-sounds.fans/images/uniguri_question.png";

/** 겹쳐 보여 줄 최대 장수(선택곡 자리) */
export const MAX_STACKED_COVERS = 3;

/**
 * 선택곡 자리에 겹칠 커버 — 같은 그림은 한 장, 커버 없는 곡은 물음표 그림, 앞에서부터
 * 최대 MAX_STACKED_COVERS장.
 */
export function stackedCovers(covers: (string | null)[]): string[] {
  return [...new Set(covers.map((cover) => cover ?? UNKNOWN_COVER_SRC))].slice(
    0,
    MAX_STACKED_COVERS,
  );
}
