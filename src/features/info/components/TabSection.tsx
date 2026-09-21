"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { INFO_TAB_SECTIONS } from "@/features/info/info";
import { useInfoTab } from "./InfoTabContext";

/**
 * ImageLabel + 그 아래 콘텐츠 한 덩어리를 감싼다. INFO_TAB_SECTIONS에서
 * 지금 활성 탭이 이 id를 갖고 있지 않으면 hidden으로 숨긴다 — 언마운트가
 * 아니라 display:none이라, 탭을 오가도 이미지가 다시 로드되지 않는다.
 */
export function TabSection({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { activeTab } = useInfoTab();
  const isVisible = INFO_TAB_SECTIONS[activeTab].includes(id);

  return (
    <div className={cn("flex flex-col gap-3", !isVisible && "hidden")}>
      {children}
    </div>
  );
}
