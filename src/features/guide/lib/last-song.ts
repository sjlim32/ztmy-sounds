import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ztmy-guide:last-song";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 사생활 보호 모드 등에선 localStorage 접근 자체가 throw할 수 있다.
function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

/** 마지막으로 연 가이드 곡 id. 빌드된 HTML에선 항상 null(hydration mismatch 방지). */
export function useLastSongId(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function saveLastSongId(songId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, songId);
  } catch {
    return;
  }
  for (const listener of listeners) listener();
}
