import { RocknRoll_One } from "next/font/google";

// 공연 상세 제목에만 쓰는 글꼴 — 루트 레이아웃에서 불러오면 모든 페이지의 첫 CSS에
// @font-face 120여 개(일본어 조각)가 실리고 라틴 조각까지 미리 받는다. 쓰는 곳에서만
// 불러와 그 페이지의 CSS에만 들어가게 한다.
export const rocknrollOne = RocknRoll_One({
  weight: "400",
  subsets: ["latin"],
});
