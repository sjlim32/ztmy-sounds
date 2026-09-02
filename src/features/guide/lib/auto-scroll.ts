import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ztmy-guide:auto-scroll";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== "false";
}

function getServerSnapshot() {
  return true;
}

/**
 * 자동 스크롤 on/off 값을 localStorage에 영속화합니다. 서버 스냅샷은 항상
 * true로 고정해서(hydration mismatch 방지), 실제 저장된 값은 마운트 후
 * 클라이언트에서만 반영됩니다.
 */
export function useAutoScrollPreference(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = (next: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(next));
    for (const listener of listeners) listener();
  };

  return [value, setValue];
}
