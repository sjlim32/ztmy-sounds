"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePanelEntranceVisible } from "@/lib/use-entrance-visible";

/**
 * 페이지에 들어올 때 내용을 서서히 나타나게 한다 — 메인에서 넘어오면 배경이
 * 어두워지는데(GuideDimOverlay), 그 사이 내용이 먼저 툭 튀어나오지 않도록
 * /guide의 곡 목록과 같은 타이밍으로 맞춘다. 레이아웃에 두면(예: /zutopia)
 * 그 안에서 하위 페이지를 오갈 땐 다시 재생되지 않는다.
 */
export function EntranceFade({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const visible = usePanelEntranceVisible();

  return (
    <div
      className={cn(
        "transition-opacity duration-1000",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
