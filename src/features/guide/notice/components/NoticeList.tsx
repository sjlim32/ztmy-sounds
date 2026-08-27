"use client";

import { useState } from "react";
import { noticeList } from "@/features/guide/notice/data";
import { NoticeAccordionItem } from "@/features/guide/notice/components/NoticeAccordionItem";
import { useNoticeDismissal } from "@/features/guide/notice/lib/dismissal";

/**
 * 안내문은 항상 최대 1개만 열려 있습니다 — 어떤 항목이 열려있는지를 여기서
 * openId 하나로 관리하고, 각 NoticeAccordionItem은 open 여부를 prop으로
 * 받는 controlled 컴포넌트입니다.
 */
export function NoticeList() {
  const alwaysOpenNotice =
    noticeList.find((notice) => notice.isAlwaysOpen) ?? null;
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
    <div data-role="notice-list" className="flex w-full flex-col gap-3">
      {noticeList.map((notice) => (
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
