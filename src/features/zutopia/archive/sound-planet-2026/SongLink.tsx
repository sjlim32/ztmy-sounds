import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";

const songLinkClass = cn(
  "group flex w-full items-center gap-3 px-4 py-2.5 no-underline transition-colors",
  "text-sm text-white/80 hover:bg-white/5 hover:text-white",
  "tablet:text-base",
);

/**
 * 세트리스트 트랙 한 줄 — 번호 + 제목 + (SiteLink가 자동으로 붙이는) 외부
 * 링크 아이콘을 하나의 행으로 배치합니다. 제목 span에만 flex-1을 줘서 번호는
 * 고정폭으로 왼쪽에, 아이콘은 SiteLink가 붙이는 순서 그대로 맨 오른쪽에
 * 자연스럽게 밀려납니다.
 */
export function SongLink({
  href,
  index,
  children,
}: {
  href: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <SiteLink href={href} className={songLinkClass}>
      <span className="w-6 shrink-0 font-mono text-xs text-white/30 tabular-nums group-hover:text-white/50">
        {String(index).padStart(2, "0")}
      </span>
      <span className="flex-1">{children}</span>
    </SiteLink>
  );
}
