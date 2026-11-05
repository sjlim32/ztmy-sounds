"use client";

import { useSyncExternalStore } from "react";
import { detectInAppBrowser } from "@/lib/in-app-browser";

const subscribeNever = () => () => {};
const clientValue = () => detectInAppBrowser(navigator.userAgent);

/** 앱 안 브라우저 이름(카카오톡 등) — 정적 HTML 단계에선 null. */
export function useInAppBrowser(): string | null {
  return useSyncExternalStore(subscribeNever, clientValue, () => null);
}
