"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  isStandaloneDisplay,
  useInstallPrompt,
} from "@/lib/use-install-prompt";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { IosShareIcon } from "@/components/icons/IosShareIcon";
import { SITE_NAME } from "@/lib/seo";

// 값은 "이 시각까지는 다시 보여주지 않는다"는 타임스탬프(ms) — 매번 켜자마자
// 뜨면 거슬려서, 닫으면 다음날 자정까지는 다시 노출하지 않는다(24시간 뒤가
// 아니라 날짜가 바뀌는 시점 기준).
const DISMISSED_UNTIL_KEY = "ztmy-install-banner-dismissed-until";

/** 지금으로부터 다음날 00:00(로컬 자정)의 타임스탬프(ms). */
function getNextMidnight(): number {
  const next = new Date();
  // setHours(24, ...)는 Date가 자동으로 다음날 0시로 넘겨준다.
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+는 데스크톱 Safari와 동일한 UA를 보내서 위 정규식에 안 걸린다 —
  // 대신 "터치 지원되는 Mac"이라는 조합으로만 구분할 수 있다.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * 모바일 전용 "홈 화면에 추가" 배너 — MobileHeader 바로 아래 일반 흐름으로
 * 붙는다(플랫폼별 설치 방법이 근본적으로 달라서 안드로이드/iOS를 나눈다).
 *
 * - 안드로이드 계열(beforeinstallprompt 지원): PC의 InstallShareBar와 같은
 *   네이티브 설치 프롬프트를 그대로 띄우는 버튼을 보여준다.
 * - iOS Safari: beforeinstallprompt 자체가 없어 프로그래밍적으로 설치를
 *   띄울 방법이 없다 — "공유 버튼 → 홈 화면에 추가"를 안내하는 텍스트만
 *   보여준다.
 * - 이미 설치되어 standalone으로 실행 중이거나, 닫기 버튼을 누른 뒤 아직
 *   다음날 자정이 안 지났으면(localStorage) 렌더링하지 않는다.
 * - /guide/[songId](노래 가사 페이지)에서는 Footer.tsx와 동일한 이유로
 *   렌더링하지 않는다 — 화면을 전부 가사/영상에 써야 해서 배너가 그 좁은
 *   화면을 잠식하면 안 된다.
 */
export function InstallPromptBanner() {
  const pathname = usePathname();
  const { canInstall, promptInstall } = useInstallPrompt();
  // 기본값 true — 마운트 후 조건(standalone/dismissed) 확인이 끝나기 전까지는
  // 항상 숨겨서, 조건이 안 맞는 경우 잠깐이라도 배너가 번쩍이지 않게 한다.
  const [isDismissed, setIsDismissed] = useState(true);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    let dismissedUntil = 0;
    try {
      dismissedUntil = Number(localStorage.getItem(DISMISSED_UNTIL_KEY)) || 0;
    } catch {
      // 프라이빗 모드 등에서 localStorage 접근 자체가 막힐 수 있다 — 그때는
      // 그냥 매번 보여주는 쪽(과다 노출)이 아예 숨기는 것보다 낫다.
    }
    const stillDismissed = Date.now() < dismissedUntil;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navigator/localStorage 기반이라 렌더 중 계산이 불가능(마운트 후 한 번만 보정, page.tsx의 getInitialTabletOpenAccent와 동일한 사유)
    setIsDismissed(stillDismissed);
    if (!stillDismissed && isIos()) {
      setIsIosDevice(true);
    }
  }, []);

  const dismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISSED_UNTIL_KEY, String(getNextMidnight()));
    } catch {
      // 저장 실패해도 이번 세션에서 닫히는 동작 자체는 이미 반영됐으니 무시.
    }
  };

  const handleInstall = async () => {
    await promptInstall();
    dismiss();
  };

  const platform: "android" | "ios" | null = isIosDevice
    ? "ios"
    : canInstall
      ? "android"
      : null;
  if (pathname.startsWith("/guide/") || isDismissed || !platform) return null;

  return (
    <div
      className={cn(
        "tablet:hidden relative z-20 flex items-center gap-3 border-b border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-sm",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-192.webp"
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl"
      />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white">홈 화면에 추가하기</p>
        {platform === "ios" ? (
          <p className="flex flex-wrap items-center gap-0 text-[10px] text-white/60">
            Safari 하단의
            <IosShareIcon className="h-3.5 w-3.5 shrink-0 text-white/80" />
            공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택하세요
          </p>
        ) : (
          <p className="text-[11px] text-white/60">
            {SITE_NAME}을 앱처럼 빠르게 열어볼 수 있어요
          </p>
        )}
      </div>

      {platform === "android" && (
        <button
          type="button"
          onClick={handleInstall}
          className="from-ztmy-purple to-ztmy-magenta shrink-0 rounded-full bg-linear-to-br px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:brightness-110"
        >
          추가
        </button>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="닫기"
        className="shrink-0 text-white/50 transition-colors hover:text-white"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
