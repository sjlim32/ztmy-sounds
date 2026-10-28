"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import {
  ACTIVE_HEADER_TAB_CLASS,
  HEADER_TAB_CLASS,
} from "@/components/button-styles";
import {
  INFO_SCROLL_CONTAINER_ID,
  INFO_TAB_ANCHOR_ID,
  INFO_TABS,
} from "@/features/info/info";
import type { InfoTabId } from "@/features/info/info";
import { useInfoTab } from "@/features/info/lib/use-info-tab";

// 탭 내용 시작점을 컨테이너 최상단에 딱 붙이지 않고 살짝 띄우는 여백(px).
const CONTENT_SCROLL_GAP = 16;

/**
 * 앵커로 점프하는 목차 대신, 카테고리별로 화면 자체를 갈아끼우는 탭 바.
 * role="tablist"/"tab"을 쓰는 만큼 ARIA 탭 패턴대로 좌우 화살표(+Home/End)로
 * 탭 사이를 이동·활성화할 수 있어야 한다 — roving tabindex로 지금 선택된
 * 탭만 Tab 키로 포커스되게 하고, 화살표는 포커스 이동과 동시에 그 탭을
 * 바로 활성화한다(탭이 4개뿐이라 별도 활성화 키 없이 바로 전환하는 쪽이
 * 자연스럽다).
 *
 * 탭을 바꾸면 새로 보이는 콘텐츠가 이전 스크롤 위치보다 짧을 수 있어(탭마다
 * 섹션 개수가 다름) 스크롤을 되돌린다 — 안 그러면 빈 공간이나 Footer만
 * 보이는 채로 남아 "고장난 것처럼" 보인다. 다만 페이지 맨 위(0)가 아니라
 * 탭 내용 시작점(INFO_TAB_ANCHOR_ID)이 컨테이너 최상단에 오는 위치로 맞춘다 —
 * 그 위에 공연 개요·일정 카드가 있어서 맨 위로 가면 방금 연 탭 내용이 화면
 * 밖으로 밀려난다.
 *
 * 탭 바는 본문이 아니라 헤더(SiteHeader)에 있다 — 태블릿 이상은 로고 오른쪽,
 * 모바일은 상단 바 아래 한 줄. 자리·크기는 호출부가 className으로 정한다.
 */
export function InfoTabs({ className }: { className?: string }) {
  const { activeTab, setActiveTab } = useInfoTab();
  const tabRefs = useRef<Partial<Record<InfoTabId, HTMLButtonElement>>>({});

  const activate = (id: InfoTabId) => {
    setActiveTab(id);
    // 새 탭 콘텐츠가 커밋된 뒤(스크롤 가능한 높이가 바뀐 뒤) 위치를 잡는다.
    requestAnimationFrame(() => {
      const container = document.getElementById(INFO_SCROLL_CONTAINER_ID);
      const anchor = document.getElementById(INFO_TAB_ANCHOR_ID);
      if (!container || !anchor) return;
      const top =
        anchor.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        CONTENT_SCROLL_GAP;
      container.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    });
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
      className={cn("flex h-full items-stretch gap-6", className)}
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
              HEADER_TAB_CLASS,
              isActive && ACTIVE_HEADER_TAB_CLASS,
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
