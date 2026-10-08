"use client";

import { usePathname } from "next/navigation";
import { ARTIST } from "@/data/artist";
import { BackLink } from "@/components/BackLink";
import { HomeLink } from "@/components/HomeLink";
import { MOBILE_HEADER_ROUTES } from "@/components/mobile/mobile-header.constants";

/**
 * 모바일 전용 전역 상단 헤더. 메인(/)에서는 아티스트명을, 그 외 페이지에서는
 * 페이지 이름 + 좌측 뒤로가기(브라우저 히스토리 back) + 우측 메인 바로가기
 * 버튼을 보여줍니다.
 */
export function MobileHeader() {
  const pathname = usePathname();
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
    // 없는 sticky를 뺐습니다.
    //
    // 지금은 fixed입니다 — iOS 26 인앱 브라우저는 화면 위쪽 가장자리의 페이지
    // 내용에 자체 흐림 효과를 덧씌우는데(헤더 글자가 뿌옇게 가려짐), 맨 위에
    // 화면 고정(fixed) 요소가 있으면 그걸 막대로 보고 흐리지 않는 것으로
    // 알려져 있어서입니다. 일반 흐름에서 빠지므로 같은 높이의 빈 칸을 함께 둡니다.
    <>
      <div aria-hidden className="tablet:hidden h-12 shrink-0" />
      <header className="tablet:hidden fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-center border-b border-white/10 bg-black/60 px-4 backdrop-blur-md">
        {!isHome && (
          <BackLink
            label="뒤로가기"
            showLabel={false}
            className="absolute top-1/2 left-2 -translate-y-1/2"
            iconClassName="h-5 w-5"
          />
        )}

        <div className="text-lg font-bold tracking-tight">{title}</div>

        {!isHome && (
          <HomeLink
            label="메인으로"
            showLabel={false}
            className="absolute top-1/2 right-2 -translate-y-1/2"
          />
        )}
      </header>
    </>
  );
}
