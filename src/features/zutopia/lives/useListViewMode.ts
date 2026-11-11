"use client";

import { useCallback, useSyncExternalStore } from "react";

/** 공연 목록 보기 방식 — 포스터 카드 격자 / 한 줄씩 리스트. */
export type ListViewMode = "card" | "list";

const VIEW_MODE_KEY = "ztmy-sounds:lives-view-mode";

const listeners = new Set<() => void>();
// 저장소를 못 쓰는 환경(시크릿 모드 등)에서도 이번 방문 동안은 유지한다.
let memory: ListViewMode | undefined;

function read(): ListViewMode {
  if (memory !== undefined) return memory;
  try {
    return window.localStorage.getItem(VIEW_MODE_KEY) === "list"
      ? "list"
      : "card";
  } catch {
    return "card";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 보기 방식은 필터와 달리 취향이라 브라우저에 저장해 다음 방문에도 유지한다.
 * 정적 HTML은 항상 카드 보기로 만들어지고(서버 스냅샷), 저장값은 hydration
 * 뒤에 반영된다.
 */
export function useListViewMode(): [
  ListViewMode,
  (mode: ListViewMode) => void,
] {
  const mode = useSyncExternalStore(subscribe, read, () => "card" as const);
  const setMode = useCallback((next: ListViewMode) => {
    try {
      window.localStorage.setItem(VIEW_MODE_KEY, next);
      memory = undefined;
    } catch {
      memory = next;
    }
    for (const listener of listeners) listener();
  }, []);
  return [mode, setMode];
}
