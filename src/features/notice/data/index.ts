import type { Notice } from "@/features/notice/lib/types";
import fanPageDisclaimer from "./fan-page-disclaimer";
import fightTheShamoji from "./fight-the-shamoji";
import festival from "./festival";
import slamGuide from "./slam-guide";

/**
 * 공지 하나 = 파일 하나 (곡 데이터와 동일한 컨벤션). 이 모듈이 모아서
 * noticeList를 제공합니다.
 */
export const noticeList: Notice[] = [
  festival,
  fanPageDisclaimer,
  slamGuide,
  fightTheShamoji,
];

if (process.env.NODE_ENV !== "production") {
  const alwaysOpenCount = noticeList.filter(
    (notice) => notice.isAlwaysOpen,
  ).length;
  if (alwaysOpenCount > 1) {
    console.warn(
      `[notice] isAlwaysOpen은 공지 하나에만 지정해야 합니다 (현재 ${alwaysOpenCount}개).`,
    );
  }
}
