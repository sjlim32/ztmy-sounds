"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { noticeList } from "@/features/notice/data";
import { NoticeAccordionItem } from "@/features/notice/components/NoticeAccordionItem";
import { useNoticeDismissal } from "@/features/notice/lib/dismissal";
import { useGuideMode } from "@/features/guide/guide-mode-context";

interface NoticeListProps {
  // true가 되는 순간 fade-in — SongList와 동일한 진입 애니메이션(SongPanel/
  // NoticePanel이 usePanelEntranceVisible로 같은 타이밍에 내려줌).
  visible: boolean;
}

/**
 * 안내문은 항상 최대 1개만 열려 있습니다 — 어떤 항목이 열려있는지를 여기서
 * openId 하나로 관리하고, 각 NoticeAccordionItem은 open 여부를 prop으로
 * 받는 controlled 컴포넌트입니다.
 */
export function NoticeList({ visible }: NoticeListProps) {
  const { mode } = useGuideMode();
  // 슬램 가이드(/slam)에서는 isSlamVisible인 공지만, 응원 가이드(/guide)에서는
  // 그 외(false/미지정) 공지만 보여줍니다.
  const filteredNotice = noticeList.filter(
    (notice) =>
      notice.visible &&
      (mode === "slam" ? !!notice.isSlamVisible : !notice.isSlamVisible),
  );
  const alwaysOpenNotice =
    filteredNotice.find((notice) => notice.isAlwaysOpen) ?? null;
  const [isDismissed, setDismissed] = useNoticeDismissal(
    alwaysOpenNotice?.id ?? "",
    alwaysOpenNotice?.version ?? 0,
  );
  const defaultOpenId =
    alwaysOpenNotice && !isDismissed ? alwaysOpenNotice.id : null;

  // undefined면 사용자가 아직 직접 연 적 없음 → defaultOpenId를 그대로 씀.
  const [manualOpenId, setManualOpenId] = useState<string | null | undefined>(
    undefined,
  );
  const openId = manualOpenId === undefined ? defaultOpenId : manualOpenId;

  return (
    <div
      data-role="notice-list"
      className={cn(
        // 모바일: SongList 위(order-1)에 오도록 order-0, 카드 간격 대신
        // divide-y로 구분(각 항목은 NoticeAccordionItem에서 모바일 전용
        // flat 스타일로 렌더링됨).
        "order-0 flex w-full flex-col divide-white/10 transition-opacity duration-1000",
        // tablet 이상: 기존 카드 목록 — 구분선 대신 카드 사이 간격.
        "tablet:gap-3",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {filteredNotice.map((notice) => (
        <NoticeAccordionItem
          key={notice.id}
          notice={notice}
          isOpen={openId === notice.id}
          onToggle={() =>
            setManualOpenId(openId === notice.id ? null : notice.id)
          }
          isDismissed={alwaysOpenNotice?.id === notice.id ? isDismissed : false}
          onDismissChange={
            alwaysOpenNotice?.id === notice.id
              ? (dismissed: boolean) => {
                  setDismissed(dismissed);
                  setManualOpenId(dismissed ? null : undefined);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
