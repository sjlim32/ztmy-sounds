import type { Metadata } from "next";
import { ARTIST } from "@/data/artist";

export const metadata: Metadata = {
  title: `${ARTIST.name.kr} 곡 목록`,
  description:
    "노래를 선택해서 샤모지 응원법과 떼창을 미리 공부할 수 있습니다.",
};

// 실제 UI는 SongPanel(guide/layout.tsx에 상주)이 라우트 세그먼트를 보고 그립니다.
// 이 페이지는 라우트 매칭 역할만 합니다.
export default function GuidePage() {
  return null;
}
