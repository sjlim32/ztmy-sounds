"use client";

import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { EntranceFade } from "@/components/EntranceFade";
import { PageScrollBody } from "@/components/PageScrollBody";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { cn } from "@/lib/utils";
import { useScrollFadeMask } from "@/lib/use-scroll-fade-mask";

/**
 * /zutopia 최상위 스크롤 컨테이너. layout.tsx는 metadata를 export해야 해서
 * 서버 컴포넌트로 남겨두고, ref를 붙여야 하는 실제 스크롤 박스만 이
 * 클라이언트 컴포넌트로 분리했습니다 — /info, /guide와 동일한 스크롤
 * 페이드 처리.
 */
// 아래 <main>의 id이자 ScrollToTopButton이 스크롤을 지켜볼 대상.
const ZUTOPIA_SCROLL_CONTAINER_ID = "zutopia-scroll-container";

/**
 * 공연 목록 ↔ 공연 상세 이동인지 — 그 사이엔 포스터가 목록 칸에서 상세 자리로
 * 이어지며 커지는 효과(View Transition, LiveListView·DefaultLiveContent·
 * DefaultTourContent의 share="morph")가 있어, 내용을 다시 숨기면 포스터가 자리
 * 잡은 뒤 사라졌다 다시 나타난다. 상세 → 다른 상세는 해당 없음(페이드).
 */
function isPosterHop(from: string, to: string): boolean {
  const LIST = "/zutopia/lives";
  return (
    (from === LIST && to.startsWith(`${LIST}/`)) ||
    (to === LIST && from.startsWith(`${LIST}/`))
  );
}

export function ZutopiaScrollArea({ children }: { children: ReactNode }) {
  const scrollRef = useScrollFadeMask<HTMLElement>();
  const pathname = usePathname();

  // 하위 페이지로 옮길 때마다 내용이 다시 서서히 나타난다(다른 페이지와 같은 전환,
  // EntranceFade). 공연 목록 ↔ 상세만 키를 그대로 둬서 건너뛴다(isPosterHop).
  const [fade, setFade] = useState({ path: pathname, key: pathname });
  if (fade.path !== pathname) {
    setFade({
      path: pathname,
      key: isPosterHop(fade.path, pathname) ? fade.key : pathname,
    });
  }

  // 이 스크롤 박스는 ZUTOPIA 안의 모든 페이지(첫 화면·곡·앨범·공연·상세)가
  // 같이 써서, 페이지를 옮겨도 이전 스크롤 위치가 남는다 — 경로가 바뀔 때마다
  // 맨 위로 되돌린다(주소의 ?song= 같은 쿼리만 바뀌는 드로어 열고 닫기는 제외).
  // 예외: 공연 목록은 상세에서 돌아오면 보던 위치로 복원한다 — LiveListView가
  // 이 layout effect 뒤(passive effect)에 다시 스크롤한다.
  // <main>의 scroll-smooth 때문에 instant를 명시한다.
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, scrollRef]);

  return (
    <>
      {/* <main> 안에 두면 안 된다 — 스크롤 페이드용 mask가 걸린 요소는 자손의
          position:fixed 기준이 되어(SongDbDrawer 주석 참고), 버튼이 화면이
          아니라 스크롤 내용에 붙어 같이 올라가 버린다. */}
      <ScrollToTopButton containerId={ZUTOPIA_SCROLL_CONTAINER_ID} />

      <main
        id={ZUTOPIA_SCROLL_CONTAINER_ID}
        ref={scrollRef}
        className={cn(
          "min-h-0 w-full flex-1 overflow-y-auto scroll-smooth",
          "scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
        )}
      >
        <PageScrollBody
          innerClassName={cn(
            "mx-auto w-full px-3 pt-6 pb-10",
            "tablet:max-w-4xl tablet:px-6 tablet:pt-10 tablet:pb-16",
            // PC는 즛토피아 전체를 최대 1440px까지 넓게 — 목록은 열을 늘리고,
            // 줄글 위주 상세(공연 상세 등)는 각자 좁은 폭으로 가운데 둔다.
            "pc:max-w-[90rem] pc:px-10",
          )}
        >
          <EntranceFade replayKey={fade.key}>{children}</EntranceFade>
        </PageScrollBody>
      </main>
    </>
  );
}
