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
    // 루트 레이아웃에서 body/상위 컨테이너가 전부 스크롤되지 않는 구조라
    // (docs/RULES.md 참고) 이 헤더는 sticky여도 실제로 붙을 스크롤 컨테이너가
    // 없어 항상 relative처럼 보였습니다. 그런데도 sticky를 쓰면 모바일
    // 크롬에서 탭을 오래 비활성화했다 돌아올 때 sticky 포지션 컴포지팅 레이어가
    // 깨져 헤더가 사라지고 레이아웃이 위로 붙는 버그가 있어(예전엔 transform으로
    // GPU 레이어 강제 승격시켜 우회했으나 오래 비활성화하면 재발), 애초에 필요
    // 없는 sticky를 relative로 바꿔 버그 원인 자체를 제거합니다. relative는
    // 아래 뒤로가기/홈 버튼의 absolute 기준점 역할을 위해 유지합니다.
    <header className="tablet:hidden relative z-30 flex h-12 items-center justify-center border-b border-white/10 bg-black/60 px-4 backdrop-blur-md">
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
