import type { ReactNode } from "react";
import { SiteLink } from "@/components/SiteLink";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";

const songLinkClass =
  "text-indigo-100 mt-0 no-underline transition-colors hover:text-white";

/**
 * SiteLink는 외부 링크 아이콘을 텍스트 뒤 inline 요소로 붙이는데, 세트리스트
 * 처럼 좁은 폭에 여러 줄이 촘촘히 나열되는 곳에서는 이 아이콘이 텍스트와
 * 떨어져 다음 줄로 밀려납니다. inline-flex로 텍스트와 아이콘을 하나의 행으로
 * 직접 묶어서 항상 같은 줄에 붙어있도록 합니다.
 */
export function SongLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <span className="tablet:p-0.5 flex items-center justify-center gap-1">
      <SiteLink href={href} noIcon className={songLinkClass}>
        {children}
      </SiteLink>
      <ExternalLinkIcon className="h-3 w-3 shrink-0" />
    </span>
  );
}
