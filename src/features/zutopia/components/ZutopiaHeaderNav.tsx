"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ACTIVE_HEADER_TAB_CLASS,
  HEADER_TAB_CLASS,
} from "@/components/button-styles";
import { ZUTOPIA_NAV_ITEMS } from "@/features/zutopia/nav";

/**
 * 헤더(SiteHeader)에 들어가는 즛토피아 구역 이동 — 곡 · 앨범 · 공연.
 * 즛토피아 첫 화면(/zutopia)에선 카드로 고르므로 헤더에 두지 않고, 구역
 * 안으로 들어갔을 때만 보인다(SiteHeader가 판단).
 */
export function ZutopiaHeaderNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="즛토피아"
      className={cn("flex h-full items-stretch gap-6", className)}
    >
      {ZUTOPIA_NAV_ITEMS.map((item) => {
        const isActive = item.paths.some((path) => pathname.startsWith(path));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              HEADER_TAB_CLASS,
              isActive && ACTIVE_HEADER_TAB_CLASS,
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
