"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { ShareIcon } from "@/components/icons/ShareIcon";

const PILL_CLASS =
  "flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 p-2.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm transition-colors hover:border-ztmy-magenta/60 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none";

/**
 * PC 전용, 화면 좌측 하단에 고정된 "앱 설치"/"공유" 버튼 묶음.
 *
 * 설치 버튼은 브라우저가 beforeinstallprompt를 쏴줄 때만(=실제로 설치
 * 가능할 때만) 나타난다 — 이미 설치돼 실행 중(standalone)이거나 지원하지
 * 않는 브라우저(Safari 등)에서는 아예 렌더링하지 않는다. 공유 버튼은
 * Web Share API가 있으면 OS 공유창을, 없으면 클립보드 복사 + 잠깐의
 * 텍스트 피드백으로 대체한다.
 */
export function InstallShareBar() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: SITE_NAME,
      text: SITE_DESCRIPTION,
      url: SITE_URL,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // 사용자가 공유창을 취소한 것도 AbortError로 온다 — 에러 취급 안 함.
        if (error instanceof Error && error.name !== "AbortError") {
          console.error(error);
        }
      }
      return;
    }

    await navigator.clipboard.writeText(SITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pc:flex fixed bottom-4 left-4 z-20 hidden items-center gap-2">
      {canInstall && (
        <button type="button" onClick={promptInstall} className={PILL_CLASS}>
          <DownloadIcon className="h-5 w-5" />
        </button>
      )}

      <button
        type="button"
        onClick={handleShare}
        className={cn(PILL_CLASS, "relative")}
      >
        <ShareIcon className="h-5 w-5" />
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-[11px] whitespace-nowrap text-white">
            링크가 복사되었습니다
          </span>
        )}
      </button>
    </div>
  );
}
