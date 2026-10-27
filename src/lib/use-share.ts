"use client";

import { useState } from "react";

/**
 * 지금 보고 있는 페이지 주소를 공유한다 — Web Share API가 있으면 OS
 * 공유창을, 없으면 클립보드 복사 후 copied를 2초간 true로.
 */
export function useShare() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
      } catch (error) {
        // 사용자가 공유창을 취소한 것도 AbortError로 온다 — 에러 취급 안 함.
        if (error instanceof Error && error.name !== "AbortError") {
          console.error(error);
        }
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { share, copied };
}
