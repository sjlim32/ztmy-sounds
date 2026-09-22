"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { INFO_SCROLL_CONTAINER_ID, INFO_TABS } from "@/features/info/info";
import type { InfoTabId } from "@/features/info/info";
import { useInfoTab } from "./InfoTabContext";

/**
 * 앵커로 점프하는 목차 대신, 카테고리별로 화면 자체를 갈아끼우는 탭 바.
 * role="tablist"/"tab"을 쓰는 만큼 ARIA 탭 패턴대로 좌우 화살표(+Home/End)로
 * 탭 사이를 이동·활성화할 수 있어야 한다 — roving tabindex로 지금 선택된
 * 탭만 Tab 키로 포커스되게 하고, 화살표는 포커스 이동과 동시에 그 탭을
 * 바로 활성화한다(탭이 4개뿐이라 별도 활성화 키 없이 바로 전환하는 쪽이
 * 자연스럽다).
 *
 * 탭을 바꾸면 새로 보이는 콘텐츠가 이전 스크롤 위치보다 짧을 수 있어(탭마다
 * 섹션 개수가 다름) 스크롤 컨테이너를 맨 위로 되돌린다 — 안 그러면 빈
 * 공간이나 Footer만 보이는 채로 남아 "고장난 것처럼" 보인다.
 */
export function InfoTabs() {
  const { activeTab, setActiveTab } = useInfoTab();
  const tabRefs = useRef<Partial<Record<InfoTabId, HTMLButtonElement>>>({});

  const activate = (id: InfoTabId) => {
    setActiveTab(id);
    document
      .getElementById(INFO_SCROLL_CONTAINER_ID)
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % INFO_TABS.length;
    else if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + INFO_TABS.length) % INFO_TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = INFO_TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = INFO_TABS[nextIndex];
    activate(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="정보 카테고리"
      className={cn("my-3 flex flex-wrap justify-center gap-2", "tablet:my-6")}
    >
      {INFO_TABS.map(({ id, label }, index) => {
        const isActive = id === activeTab;
        return (
          <button
            key={id}
            ref={(el) => {
              if (el) tabRefs.current[id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => activate(id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
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
