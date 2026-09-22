"use client";

import { useEffect, useState } from "react";

// 표준 lib.dom.d.ts에 아직 없는 PWA 설치 프롬프트 이벤트.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isStandaloneDisplay(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari 전용 레거시 플래그. display-mode 미디어쿼리보다 먼저부터
    // 있었고 iOS에서 지금도 더 확실하게 잡혀서 함께 확인한다.
    nav.standalone === true
  );
}

/**
 * beforeinstallprompt/appinstalled 구독 + 실제 설치 트리거를 한 곳에 모은다
 * — PC 코너 바(InstallShareBar)와 모바일 배너(InstallPromptBanner)가 UI는
 * 완전히 다르지만 이 브라우저 이벤트 배관 자체는 동일해서 중복을 없앴다.
 * 이미 standalone으로 실행 중이면 애초에 구독하지 않는다(설치할 이유가
 * 없음) — 두 호출부 모두 이 훅과 별개로 standalone 여부에 따라 자기
 * 컴포넌트를 통째로 숨길지는 각자 판단한다.
 */
export function useInstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    // 프롬프트는 한 번 쓰면 재사용 불가 — 수락/거절 결과와 무관하게 비워서
    // 다음 beforeinstallprompt를 기다리게 한다.
    setInstallEvent(null);
  };

  return { canInstall: installEvent !== null, promptInstall };
}
