"use client";

import { useSyncExternalStore } from "react";

// 통합 검색 창의 열림 상태 — 헤더의 버튼 여럿(태블릿 헤더·모바일 줄)과 창 하나가
// 같이 본다. 버튼은 이 작은 모듈만 가져오고, 창(ZutopiaSearchDialog)은 즛토피아
// 하위 페이지에서만 따로 불러온다(SiteHeader의 dynamic).
let open = false;
const listeners = new Set<() => void>();

function setOpen(next: boolean) {
  open = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const openSearchDialog = () => setOpen(true);
export const closeSearchDialog = () => setOpen(false);

export function useSearchDialogOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
