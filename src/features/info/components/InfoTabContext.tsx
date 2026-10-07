"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { INFO_TABS } from "@/features/info/info";
import type { InfoTabId } from "@/features/info/info";

const InfoTabContext = createContext<{
  activeTab: InfoTabId;
  setActiveTab: (tab: InfoTabId) => void;
} | null>(null);

function readHashTab(): InfoTabId | null {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return INFO_TABS.find((tab) => tab.id === hash)?.id ?? null;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * 지금 열린 탭을 state가 아니라 주소의 해시(/info#popup)에 둔다 — 새로고침
 * 하거나 링크를 공유해도 같은 탭이 열리고, 뒤로/앞으로 가기나 주소창에서
 * 해시를 직접 고쳐도 따라간다. 정적 빌드된 HTML은 해시를 알 수 없으니
 * 서버 스냅샷은 null(= defaultTab)이고, 하이드레이션 직후 해시의 탭으로
 * 바뀐다.
 */
export function InfoTabProvider({
  defaultTab,
  children,
}: {
  defaultTab: InfoTabId;
  children: ReactNode;
}) {
  const hashTab = useSyncExternalStore(subscribeHash, readHashTab, () => null);
  const activeTab = hashTab ?? defaultTab;

  const setActiveTab = useCallback((tab: InfoTabId) => {
    // location.hash에 직접 쓰면 탭을 누를 때마다 방문 기록이 쌓여 뒤로가기로
    // 페이지를 못 벗어난다 — replaceState로 주소만 바꾸고, 이 경우엔
    // hashchange가 안 생기므로 구독자에게 직접 알린다.
    window.history.replaceState(null, "", `#${tab}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);

  const value = useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab],
  );

  return (
    <InfoTabContext.Provider value={value}>{children}</InfoTabContext.Provider>
  );
}

/** InfoTabProvider 밖에서 쓰면 바로 에러 — 실수로 감싸는 걸 빠뜨려도 조용히 넘어가지 않도록. */
export function useInfoTab() {
  const context = useContext(InfoTabContext);
  if (!context) {
    throw new Error("useInfoTab은 InfoTabProvider 안에서만 쓸 수 있습니다.");
  }
  return context;
}
