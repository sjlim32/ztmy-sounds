"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { InfoTabId } from "@/features/info/info";

const InfoTabContext = createContext<{
  activeTab: InfoTabId;
  setActiveTab: (tab: InfoTabId) => void;
} | null>(null);

export function InfoTabProvider({
  defaultTab,
  children,
}: {
  defaultTab: InfoTabId;
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<InfoTabId>(defaultTab);

  return (
    <InfoTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </InfoTabContext.Provider>
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
