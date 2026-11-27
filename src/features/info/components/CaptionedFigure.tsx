import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 공연 정보의 지도·포스터 그림 — 액자 카드 없이 그림 + 아래 캡션 한 줄(왼쪽 이름, 오른쪽
 * 출처 링크 등). 그림이 그 자체로 면이라 테두리를 두 겹으로 두지 않는다. 배경 그림 위에서도
 * 읽히게 캡션에 글자 그림자.
 */
export function CaptionedFigure({
  id,
  caption,
  aside = null,
  className,
  children,
}: {
  id?: string;
  caption: string;
  /** 캡션 오른쪽(출처 링크, "공식 안내문" 같은 흐린 글자) */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure
      id={id}
      className={cn("flex scroll-mt-4 flex-col gap-2", className)}
    >
      <div className="flex justify-center">{children}</div>
      <figcaption className="drop-shadow-legible-sm flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-white/85">{caption}</span>
        {aside && (
          <span className="shrink-0 text-xs text-white/55">{aside}</span>
        )}
      </figcaption>
    </figure>
  );
}
