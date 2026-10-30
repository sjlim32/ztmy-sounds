"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BackLink } from "@/components/BackLink";
import { HomeLink } from "@/components/HomeLink";
import { ShareButton } from "@/components/ShareButton";
import { LOGO } from "@/lib/seo";
import { findSitePage } from "@/components/site-pages";
import { HEADER_TITLE_TRANSITION } from "@/components/mobile/header-title-transition";

/**
 * 모바일 전용 전역 상단 헤더. 가운데는 메인(/)에선 로고, 하위 페이지에선
 * 페이지 이름(site-pages.ts — PC 헤더와 같은 이름, 즛토피아는 ZUTOPIA).
 * 가이드·슬램 곡 상세에서만 비워 두고, 그 자리에 가이드 화면이 곡 제목
 * (MobileSongTitle)을 겹쳐 그린다(곡 데이터는 가사까지 들어 있어 이 전역
 * 헤더에서 불러오지 않는다). 메인(/)에서는 우측 공유만, 그 외 페이지에서는
 * 좌측 뒤로가기(브라우저 히스토리 back) + 우측 메인 바로가기 버튼을 보여줍니다.
 * 곡 상세(가이드·슬램)에선 그 곡 주소를 공유할 수 있게 우측에 공유를 더합니다.
 */
export function MobileHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSongDetail = /^\/(guide|slam)\/[^/]+/.test(pathname);
  const pageLabel = isHome ? null : findSitePage(pathname)?.label;

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

        {/* 페이지 제목(h1)은 각 페이지 본문이 갖고 있어서 여기 로고·이름은 장식용. */}
        {pageLabel ? (
          // 곡 상세에선 지우지 않고 투명하게만 둬서, 그 자리에 뜨는 곡 제목
          // (MobileSongTitle)과 서로 엇갈려 사라지고 나타난다. key로 이름이
          // 바뀔 때마다 새로 그려 살짝 올라오며 나타나게(@starting-style).
          <div
            key={pageLabel}
            aria-hidden={isSongDetail || undefined}
            className={cn(
              "truncate px-24 text-lg font-bold tracking-tight",
              HEADER_TITLE_TRANSITION,
              isSongDetail && "opacity-0",
            )}
          >
            {pageLabel}
          </div>
        ) : (
          <Image
            src={LOGO.src}
            alt=""
            aria-hidden
            width={LOGO.width}
            height={LOGO.height}
            className="h-10 w-auto [filter:drop-shadow(1px_0_0_#fff)_drop-shadow(-1px_0_0_#fff)_drop-shadow(0_1px_0_#fff)_drop-shadow(0_-1px_0_#fff)]"
          />
        )}

        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5">
          {(isHome || isSongDetail) && (
            <ShareButton tooltipClassName="top-full bottom-auto mt-2 mb-0" />
          )}
          {!isHome && <HomeLink label="메인으로" showLabel={false} />}
        </div>
      </header>
    </>
  );
}
