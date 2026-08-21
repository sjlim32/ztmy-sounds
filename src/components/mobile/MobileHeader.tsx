"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ARTIST } from "@/app/(pages)/page";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";

/**
 * 모바일 전용 전역 상단 헤더. 메인(/)에서는 아티스트명을, 그 외 페이지에서는
 * 페이지 이름 + 좌측 뒤로가기(→ 메인) 버튼을 보여줍니다.
 */
export function MobileHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const title = isHome
    ? ARTIST.name.en
    : pathname.startsWith("/guide")
      ? "Call Guide"
      : pathname.startsWith("/info")
        ? "Concert Info"
        : ARTIST.name.en;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-center border-b border-white/10 bg-black/60 px-4 py-2 backdrop-blur-md tablet:hidden">
      {!isHome && (
        <Link
          href="/"
          aria-label="메인으로"
          className="absolute left-4 text-white/70"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      )}

      <Link href="/" className="text-sm font-bold tracking-tight">
        {title}
      </Link>
    </header>
  );
}
