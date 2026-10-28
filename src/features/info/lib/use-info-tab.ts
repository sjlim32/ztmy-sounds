"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_INFO_TAB, INFO_TABS } from "@/features/info/info";
import type { InfoTabId } from "@/features/info/info";

function readHashTab(): InfoTabId | null {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return INFO_TABS.find((tab) => tab.id === hash)?.id ?? null;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function setActiveTab(tab: InfoTabId) {
  // location.hash에 직접 쓰면 탭을 누를 때마다 방문 기록이 쌓여 뒤로가기로
  // 페이지를 못 벗어난다 — replaceState로 주소만 바꾸고, 이 경우엔
  // hashchange가 안 생기므로 구독자에게 직접 알린다.
  window.history.replaceState(null, "", `#${tab}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/**
 * /info에서 지금 열린 탭. state가 아니라 주소의 해시(/info#popup)에 둔다 —
 * 새로고침하거나 링크를 공유해도 같은 탭이 열리고, 뒤로/앞으로 가기나
 * 주소창에서 해시를 직접 고쳐도 따라간다. 정적 빌드된 HTML은 해시를 알 수
 * 없으니 서버 스냅샷은 기본 탭이고, 하이드레이션 직후 해시의 탭으로 바뀐다.
 *
 * 저장소가 주소(해시) 하나라 Provider 없이 어디서 불러도 같은 값을 본다 —
 * 탭 바는 헤더(SiteHeader)에, 탭 내용(TabSection)은 본문에 따로 있다.
 */
export function useInfoTab() {
  const hashTab = useSyncExternalStore(subscribeHash, readHashTab, () => null);
  return { activeTab: hashTab ?? DEFAULT_INFO_TAB, setActiveTab };
}
