import type { Notice } from "@/features/notice/lib/types";
import type { GuideMode } from "@/features/guide/guide-mode-context";
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
  fightTheShamoji,
  slamGuide,
];

/**
 * 가이드 화면별로 보여줄 공지 — 슬램 가이드(/slam)는 isSlamVisible인 공지만,
 * 응원 가이드(/guide)는 그 외(false/미지정)만. 숨긴(visible: false) 공지는 뺀다.
 */
export function getNoticesForMode(mode: GuideMode): Notice[] {
  return noticeList.filter(
    (notice) =>
      notice.visible &&
      (mode === "slam" ? !!notice.isSlamVisible : !notice.isSlamVisible),
  );
}

// isAlwaysOpen은 화면마다 하나씩 — 응원 가이드에 하나, 슬램 가이드에 하나까지
// 둘 수 있다(NoticeList는 화면별 목록에서 첫 번째 것만 펼친다).
if (process.env.NODE_ENV !== "production") {
  const MODE_LABEL: Record<GuideMode, string> = {
    cheer: "응원 가이드",
    slam: "슬램 가이드",
  };
  for (const mode of ["cheer", "slam"] as const) {
    const alwaysOpen = getNoticesForMode(mode).filter(
      (notice) => notice.isAlwaysOpen,
    );
    if (alwaysOpen.length > 1) {
      console.warn(
        `[notice] isAlwaysOpen은 ${MODE_LABEL[mode]} 공지 중 하나에만 지정해야 합니다 (현재 ${alwaysOpen.length}개: ${alwaysOpen.map((notice) => notice.id).join(", ")}).`,
      );
    }
  }
}
