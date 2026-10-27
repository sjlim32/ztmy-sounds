"use client";

import { cn } from "@/lib/utils";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { NAV_BUTTON_CLASS } from "@/components/button-styles";
import { DownloadIcon } from "@/components/icons/DownloadIcon";

/**
 * 앱 설치 아이콘 버튼 — 브라우저가 beforeinstallprompt를 쏴줄 때만(=실제로
 * 설치 가능할 때만) 나타난다. 이미 설치돼 실행 중이거나 지원하지 않는
 * 브라우저(Safari 등)에서는 렌더링하지 않는다.
 */
export function InstallButton({ className }: { className?: string }) {
  const { canInstall, promptInstall } = useInstallPrompt();
  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={promptInstall}
      aria-label="앱 설치"
      title="앱 설치"
      className={cn(NAV_BUTTON_CLASS, "h-9 w-9", className)}
    >
      <DownloadIcon className="h-4 w-4" />
    </button>
  );
}
