"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { NoticeList } from "@/features/notice/components/NoticeList";
import { usePanelEntranceVisible } from "@/features/guide/components/list-entrance";

/**
 * SongPanel 좌측의 빈 공간에 뜨는 안내문 패널. 곡이 선택되면(=상세보기)
 * 사라집니다.
 *
 * 모바일: 자체 박스를 없애 NoticeList가 guide/layout.tsx의 flex-col에
 * 직접 노출되도록 함(SongList보다 위에 오도록 order-0은 NoticeList
 * 쪽에서 지정). tablet 이상: 기존 그대로 — GuidePlayerArea와 동일한
 * 우측 여백(pr-108 / pc:pr-[30vw+1.5rem])을 써서 SongPanel을 피한 "남은
 * 영역"을 계산하고, 그 영역 안에서 내용을 가로·세로 모두 중앙 정렬합니다.
 */
export function NoticePanel() {
  const segment = useSelectedLayoutSegment();
  const isPanelVisible = usePanelEntranceVisible();
  if (segment !== null) return null;

  return (
    <aside
      data-role="notice-panel"
      className={cn(
        "contents",
        "tablet:fixed tablet:inset-0 tablet:z-10 tablet:flex tablet:items-center tablet:justify-center tablet:overflow-y-auto tablet:py-16 tablet:pr-108 tablet:pl-6",
        "pc:pr-[calc(30vw+1.5rem)]",
      )}
    >
      <div className={cn("contents", "tablet:w-full tablet:max-w-2xl")}>
        <NoticeList visible={isPanelVisible} />
      </div>
    </aside>
  );
}
