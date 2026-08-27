"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { NoticeList } from "@/features/notice/components/NoticeList";

/**
 * SongPanel 좌측의 빈 공간에 뜨는 안내문 패널. 곡이 선택되면(=상세보기)
 * 사라지고, tablet(800px) 미만에서는 아예 렌더되지 않습니다.
 *
 * GuidePlayerArea와 동일한 우측 여백(pr-108 / pc:pr-[30vw+1.5rem])을 써서
 * SongPanel을 피한 "남은 영역"을 계산하고, 그 영역 안에서 내용을 가로·세로
 * 모두 중앙 정렬합니다.
 */
export function NoticePanel() {
  const segment = useSelectedLayoutSegment();
  if (segment !== null) return null;

  return (
    <aside
      data-role="notice-panel"
      className={cn(
        "hidden",
        "tablet:fixed tablet:inset-0 tablet:z-10 tablet:flex tablet:items-center tablet:justify-center tablet:overflow-y-auto tablet:py-16 tablet:pr-108 tablet:pl-6",
        "pc:pr-[calc(30vw+1.5rem)]",
      )}
    >
      <div className="pc:max-w-2xl w-full">
        <NoticeList />
      </div>
    </aside>
  );
}
