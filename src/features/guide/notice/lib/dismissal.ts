"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ztmy-guide:notice-dismissal";

interface DismissedNoticeRecord {
  id: string;
  version: number;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRecord(): DismissedNoticeRecord | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === "string" && typeof parsed?.version === "number") {
      return parsed;
    }
  } catch {
    // 손상된 값은 무시
  }
  return null;
}

/**
 * 특정 공지(id + version)가 "다시 열지 않기"로 닫혔는지 확인/설정합니다.
 * 같은 id라도 version이 다르면(내용 개정) 다시 열리고, 다른 공지가
 * always-open으로 교체되어도(id가 다름) 마찬가지로 다시 열립니다.
 */
export function useNoticeDismissal(
  id: string,
  version: number,
): [boolean, (dismissed: boolean) => void] {
  const getSnapshot = () => {
    const record = readRecord();
    return !!record && record.id === id && record.version === version;
  };

  // 서버 스냅샷은 항상 false로 고정해서(hydration mismatch 방지), 실제 저장된
  // 값은 마운트 후 클라이언트에서만 반영됩니다.
  const getServerSnapshot = () => false;

  const isDismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setDismissed = (dismissed: boolean) => {
    if (dismissed) {
      const record: DismissedNoticeRecord = { id, version };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    for (const listener of listeners) listener();
  };

  return [isDismissed, setDismissed];
}
