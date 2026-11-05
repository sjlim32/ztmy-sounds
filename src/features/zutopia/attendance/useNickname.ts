"use client";

import { useCallback, useSyncExternalStore } from "react";

/** 참전 기록 이미지에 넣을 닉네임 — 체크 내역과 따로 브라우저에 저장한다. */
const NICKNAME_KEY = "ztmy-sounds:attendance-nickname";
export const NICKNAME_MAX_LENGTH = 16;

const listeners = new Set<() => void>();
let memory: string | undefined;

function read(): string {
  if (memory !== undefined) return memory;
  try {
    return window.localStorage.getItem(NICKNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNickname(): [string, (value: string) => void] {
  const nickname = useSyncExternalStore(subscribe, read, () => "");
  const setNickname = useCallback((value: string) => {
    const next = value.slice(0, NICKNAME_MAX_LENGTH);
    try {
      window.localStorage.setItem(NICKNAME_KEY, next);
      memory = undefined;
    } catch {
      memory = next;
    }
    for (const listener of listeners) listener();
  }, []);
  return [nickname, setNickname];
}
