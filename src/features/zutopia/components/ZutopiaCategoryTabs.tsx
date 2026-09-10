"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ZutopiaCategory } from "@/features/zutopia/registry";
import { ACTIVE_TAB_CLASS, TAB_CLASS } from "./tab-styles";

/**
 * [category]/layout.tsx의 탭 nav. 현재 어느 탭에 있는지(전체 목록 vs 특정
 * 항목) 시각적으로/aria-current로 표시하려면 현재 경로가 필요한데,
 * [category]/layout.tsx는 metadata를 export하는 서버 컴포넌트라
 * usePathname을 쓸 수 없어서 이 부분만 클라이언트 컴포넌트로 분리했습니다.
 */
export function ZutopiaCategoryTabs({
  category,
}: {
  category: ZutopiaCategory;
}) {
  const pathname = usePathname();
  const allHref = `/zutopia/${category.slug}`;
  const isAllActive = pathname === allHref;

  return (
    <nav
      aria-label={category.label}
      className="mt-3 flex flex-wrap gap-2 border-b border-white/10 pb-4"
    >
      <Link
        href={allHref}
        aria-current={isAllActive ? "page" : undefined}
        className={cn(TAB_CLASS, isAllActive && ACTIVE_TAB_CLASS)}
      >
        전체
      </Link>
      {category.entries.map((entry) => {
        const href = `/zutopia/${category.slug}/${entry.slug}`;
        const isActive = pathname === href;
        return (
          <Link
            key={entry.slug}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(TAB_CLASS, isActive && ACTIVE_TAB_CLASS)}
          >
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}
