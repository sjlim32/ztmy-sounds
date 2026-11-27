"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  dateHashes,
  dateIdFromHash,
  historyStep,
} from "@/features/zutopia/lives/date-hash";
import type { TourDateEntry } from "@/features/zutopia/lives/types";

/** pushState는 이벤트를 내지 않아, 해시를 바꾼 뒤 직접 알린다. */
const HASH_EVENT = "tour-date-hash";
/** 날짜를 연달아 골라 우리가 쌓은 기록의 깊이(history.state) — 닫을 때 얼마나 뒤로 갈지. */
const STATE_KEY = "tourDateHash";

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(HASH_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(HASH_EVENT, onChange);
  };
}

/**
 * 투어 상세에서 고른 공연일 — 주소 해시(`#2023-04-21`, date-hash.ts)가 곧 상태라 링크
 * 공유·새로고침·뒤로 가기가 그대로 동작한다. 고르면 history.pushState로 해시를 바꾸고
 * (뒤로 가기 = 이전 선택·시트 닫기), null이면 해시를 지운다 — 우리가 쌓은 기록에서 닫으면
 * 새 기록 대신 한 칸 뒤로(date-hash.ts historyStep). 정적 export라 서버·첫 렌더는
 * 해시를 몰라 null(공통 세트리스트)로 그리고, 하이드레이션 뒤 해시를 읽는다. 모르는
 * 해시·취소된 날은 null.
 */
export function useHashSelection(
  dates: TourDateEntry[],
): [string | null, (id: string | null) => void] {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const selectedId = useMemo(() => dateIdFromHash(dates, hash), [dates, hash]);
  const select = useCallback(
    (id: string | null) => {
      const value = id ? dateHashes(dates).get(id) : undefined;
      const next = value ? `#${value}` : "";
      const state = window.history.state as Record<string, unknown> | null;
      const depth = state?.[STATE_KEY];
      const step = historyStep(
        {
          hash: window.location.hash,
          depth: typeof depth === "number" ? depth : 0,
        },
        next,
      );
      if (step.kind === "none") return;
      if (step.kind === "go") {
        window.history.go(step.delta); // popstate가 상태를 맞춘다
        return;
      }
      const { pathname, search } = window.location;
      window.history.pushState(
        { [STATE_KEY]: step.depth },
        "",
        `${pathname}${search}${next}`,
      );
      window.dispatchEvent(new Event(HASH_EVENT));
    },
    [dates],
  );
  return [selectedId, select];
}
