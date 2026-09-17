import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";

const indexBadgeClass = cn(
  "w-6 shrink-0 font-mono text-xs tabular-nums",
  "text-white/30",
);

const songLinkClass = cn(
  "group flex w-full items-center gap-3 px-4 py-2.5 no-underline transition-colors",
  "text-sm text-white/80 hover:bg-white/5 hover:text-white",
  "tablet:text-base",
);

const songTextClass = cn(
  "flex w-full items-center gap-3 px-4 py-2.5",
  "text-sm text-white/60",
  "tablet:text-base",
);

/**
 * 세트리스트 트랙 한 줄 — 번호 + 제목. 응원 가이드(guideHref)가 있는 곡만
 * 링크로 만들고, 없는 곡은 링크 없는 일반 텍스트 행으로 보여준다(Supabase
 * setlists 스키마에 곡별 영상 링크가 없어서, 가이드 링크가 유일한 후보다).
 * guideHref는 항상 내부 경로(/guide/...)라 SiteLink의 외부 링크 아이콘은
 * 여기서는 붙지 않는다.
 */
export function SongLink({
  href,
  index,
  children,
}: {
  href?: string | null;
  index: number;
  children: ReactNode;
}) {
  const number = String(index).padStart(2, "0");

  if (!href) {
    return (
      <span className={songTextClass}>
        <span className={indexBadgeClass}>{number}</span>
        <span className="flex-1">{children}</span>
      </span>
    );
  }

  return (
    <SiteLink href={href} className={songLinkClass}>
      <span className={cn(indexBadgeClass, "group-hover:text-white/50")}>
        {number}
      </span>
      <span className="flex-1">{children}</span>
    </SiteLink>
  );
}
