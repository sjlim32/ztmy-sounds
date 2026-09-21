"use client";

import { cn } from "@/lib/utils";
import { INFO_TABS } from "@/features/info/info";
import { useInfoTab } from "./InfoTabContext";

/** 앵커로 점프하는 목차 대신, 카테고리별로 화면 자체를 갈아끼우는 탭 바. */
export function InfoTabs() {
  const { activeTab, setActiveTab } = useInfoTab();

  return (
    <div
      role="tablist"
      aria-label="정보 카테고리"
      className="tablet:my-6 my-3 flex flex-wrap justify-center gap-2"
    >
      {INFO_TABS.map(({ id, label }) => {
        const isActive = id === activeTab;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(id)}
            className={cn(
              "hover:border-ztmy-magenta/60 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white",
              isActive && "border-ztmy-magenta/60 text-white",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
