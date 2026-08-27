import type { Notice } from "@/features/guide/notice/lib/types";
import fanPageDisclaimer from "./01_fan-page-disclaimer";
import fightTheShamoji from "./02_fight-the-shamoji";

/**
 * 공지 하나 = 파일 하나 (곡 데이터와 동일한 컨벤션). 이 모듈이 모아서
 * noticeList를 제공합니다.
 */
export const noticeList: Notice[] = [fanPageDisclaimer, fightTheShamoji];

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
