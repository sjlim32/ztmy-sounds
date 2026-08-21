"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";

/**
 * 메인(/) 을 제외한 모든 페이지에서 화면을 어둡게, 메인으로 돌아가면 다시
 * 밝게 — opacity 트랜지션으로. 루트 레이아웃에 항상 마운트해 두고
 * pathname으로 켜고 끕니다. 각 페이지의 layout.tsx 안에 두면 라우트 전환 시
 * 그 레이아웃 자체가 언마운트돼서 나갈 때 트랜지션할 새 없이 즉시 사라지는데,
 * 여기서는 엘리먼트가 항상 DOM에 남아있어서 들어갈 때/나갈 때 둘 다
 * 자연스럽게 페이드됩니다.
 */
export function GuideDimOverlay() {
  const pathname = usePathname();
  const isDimmed = pathname !== "/";

  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none fixed inset-0 z-0 bg-black/50 transition-opacity duration-700",
        isDimmed ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
