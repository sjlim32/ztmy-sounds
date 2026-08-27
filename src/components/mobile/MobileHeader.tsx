"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ARTIST } from "@/data/artist";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { MOBILE_HEADER_ROUTES } from "@/components/mobile/mobile-header.constants";

/**
 * 모바일 전용 전역 상단 헤더. 메인(/)에서는 아티스트명을, 그 외 페이지에서는
 * 페이지 이름 + 좌측 뒤로가기(브라우저 히스토리 back) + 우측 메인 바로가기
 * 버튼을 보여줍니다.
 */
export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const matchedRoute = MOBILE_HEADER_ROUTES.find((route) =>
    pathname.startsWith(route.path),
  );
  const title = isHome
    ? ARTIST.name.en
    : (matchedRoute?.title ?? ARTIST.name.en);

  return (
    // 모바일 크롬에서 탭을 전환했다 돌아오면 sticky 헤더가 지워진 채로
    // 남는(새로고침해야 다시 보이는) 컴포지팅 버그가 있어, transform으로
    // 별도 GPU 레이어로 강제 승격시켜 우회합니다.
    <header className="tablet:hidden sticky top-0 z-30 flex h-12 transform-[translateZ(0)] items-center justify-center border-b border-white/10 bg-black/60 px-4 backdrop-blur-md">
      {!isHome && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="absolute left-2 flex h-full w-10 items-center text-white/70"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}

      <div className="text-lg font-bold tracking-tight">{title}</div>

      {!isHome && (
        <Link
          href="/"
          aria-label="메인으로"
          className="absolute right-2 flex h-full w-10 items-center justify-end text-white/70"
        >
          <HomeIcon className="h-5 w-5" />
        </Link>
      )}
    </header>
  );
}
