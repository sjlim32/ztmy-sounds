"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  ATTENDANCE_STORAGE_KEY,
  parseAttendance,
  safeRead,
  safeWrite,
  serializeAttendance,
} from "./storage";

/*
 * 체크 내역 저장소 — localStorage 한 키를 여러 컴포넌트(참전 기록, 연혁)와
 * 다른 탭이 같이 본다. useSyncExternalStore로 읽어서, 정적 HTML(서버 스냅샷)
 * 단계에선 "아직 모름"(ready false), 브라우저에선 저장값을 바로 쓴다.
 * localStorage에 쓸 수 없는 환경에선 이 탭 메모리에만 들고 있는다.
 */
const listeners = new Set<() => void>();
let memoryRaw: string | undefined;

function getStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getSnapshot(): string | null {
  return memoryRaw ?? safeRead(getStorage());
}

function getServerSnapshot(): undefined {
  return undefined;
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === ATTENDANCE_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(ids: Iterable<string>) {
  const raw = serializeAttendance(ids, new Date());
  memoryRaw = safeWrite(getStorage(), raw) ? undefined : raw;
  notify();
}

export function useAttendedUnits(): {
  /** false인 동안(정적 HTML·하이드레이션 전)은 체크 상태를 그리지 않는다. */
  ready: boolean;
  attended: ReadonlySet<string>;
  toggle: (id: string) => void;
  replaceAll: (ids: string[]) => void;
} {
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const attended = useMemo<ReadonlySet<string>>(
    () => new Set(raw === undefined ? [] : parseAttendance(raw).attended),
    [raw],
  );

  const toggle = useCallback((id: string) => {
    const next = new Set(parseAttendance(getSnapshot()).attended);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
  }, []);
  const replaceAll = useCallback((ids: string[]) => write(ids), []);

  return { ready: raw !== undefined, attended, toggle, replaceAll };
}
