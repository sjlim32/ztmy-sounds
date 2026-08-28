"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { NoticeList } from "@/features/notice/components/NoticeList";
import { usePanelEntranceVisible } from "@/features/guide/components/list-entrance";

/**
 * SongPanel 옆 메인 영역에 뜨는 안내문 패널. 곡이 선택되면(=상세보기)
 * 사라집니다.
 *
 * 자체 박스가 없는 순수 콘텐츠 컴포넌트 — 모바일에서는 NoticeList가
 * guide/layout.tsx의 flex-col에 직접 노출되고(SongList보다 위에 오도록
 * order-0은 NoticeList 쪽에서 지정), tablet 이상에서는 guide/layout.tsx의
 * 메인 영역 래퍼가 중앙 정렬·스크롤·여백을 전담합니다.
 */
export function NoticePanel() {
  const segment = useSelectedLayoutSegment();
  const isPanelVisible = usePanelEntranceVisible();
  if (segment !== null) return null;

  return (
    <aside data-role="notice-panel" className="contents">
      <div className={cn("contents", "tablet:w-full tablet:max-w-2xl")}>
        <NoticeList visible={isPanelVisible} />
      </div>
    </aside>
  );
}
