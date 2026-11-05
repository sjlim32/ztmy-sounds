"use client";

import { useSyncExternalStore } from "react";
import { koreaDate } from "@/lib/korea-date";

const subscribeNever = () => () => {};
const clientToday = () => koreaDate();

/**
 * 브라우저에서 본 한국 날짜. 정적 HTML(빌드 시점)과 첫 렌더가 어긋나지 않도록
 * 서버 스냅샷은 null — null인 동안은 날짜에 기대는 표시를 미룬다.
 */
export function useKoreaToday(): string | null {
  return useSyncExternalStore(subscribeNever, clientToday, () => null);
}
