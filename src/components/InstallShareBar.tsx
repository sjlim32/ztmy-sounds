"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { NAV_BUTTON_CLASS } from "@/components/button-styles";

// 아이콘만 있는 정사각형 검은 반투명 버튼
const ICON_BUTTON_CLASS = cn(NAV_BUTTON_CLASS, "h-9 w-9");

/**
 * PC 전용, 화면 왼쪽 아래 구석에 떠 있는 "앱 설치"/"공유" 버튼 묶음.
 * 푸터가 보이는 화면(PC는 메인 화면)에서는 푸터 바로 위에 뜨도록, Footer가
 * 자기 높이를 --footer-height CSS 변수로 알려주면 그만큼 위로 올라간다.
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
    <div
      className={cn(
        "fixed bottom-[calc(var(--footer-height,0px)+1rem)] left-4 z-20 hidden items-center gap-2",
        "pc:flex",
      )}
    >
      {canInstall && (
        <button
          type="button"
          onClick={promptInstall}
          aria-label="앱 설치"
          title="앱 설치"
          className={ICON_BUTTON_CLASS}
        >
          <DownloadIcon className="h-5 w-5" />
        </button>
      )}

      <button
        type="button"
        onClick={handleShare}
        aria-label="공유하기"
        title="공유하기"
        className={cn(ICON_BUTTON_CLASS, "relative")}
      >
        <ShareIcon className="h-5 w-5" />
        {copied && (
          <span className="absolute -top-9 left-0 rounded-lg bg-black/85 px-3 py-1 text-sm whitespace-nowrap text-white">
            링크가 복사되었습니다
          </span>
        )}
      </button>
    </div>
  );
}
