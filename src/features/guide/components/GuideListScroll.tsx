"use client";

import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollFadeMask } from "@/lib/use-scroll-fade-mask";

/**
 * 모바일 전용 리스트 화면(/guide) 스크롤 컨테이너. NoticePanel과
 * SongPanel은 각자 독립된 형제 컴포넌트지만(NoticePanel을 SongPanel 안에
 * 중첩하면 SongPanel의 tablet:-translate-y-1/2(transform)가 NoticePanel의
 * fixed 전체화면 오버레이 기준점을 가로채 버림) 둘 다 모바일에서
 * display:contents로 풀려 있어서, 이 컴포넌트가 만드는 하나의 실제 박스
 * 안에서 NoticeList 행과 SongList 행이 order 값(0/1)만으로 자연스럽게 한
 * 리스트처럼 스크롤됩니다.
 *
 * 곡이 선택된 상세보기 화면(segment !== null)에서는 원래대로
 * overflow-hidden으로 되돌립니다 — 이 상태에선 NoticePanel이 렌더되지
 * 않고 SongList도 선택된 한 줄로 접혀 있어서 스크롤이 필요 없고, 영상은
 * shrink-0로 고정된 채 LyricsView가 자체 overflow-y-auto로 따로
 * 스크롤하는 기존 동작을 그대로 보존해야 하기 때문입니다(영상이 항상
 * 보여야 콜/가사를 따라가기 쉬움).
 *
 * tablet 이상에서는 SongPanel/NoticePanel이 각자 독립적인 tablet:fixed
 * 박스로 존재하므로 이 컴포넌트는 contents로 사라져 관여하지 않습니다.
 */
export function GuideListScroll({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const isListMode = segment === null;
  const scrollRef = useScrollFadeMask<HTMLDivElement>();
  // 모바일 목록 화면에서 마지막으로 보던 스크롤 위치. 곡 상세로 가면 목록이
  // 숨으면서(곡 줄이 전부 접힘) 이 박스의 스크롤이 0으로 밀리므로, 목록으로
  // 돌아오면 저장해 둔 위치로 바로 되돌린다(전환 애니메이션이 없어서 바로 보인다).
  const listScrollTopRef = useRef(0);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !isListMode) return;
    el.scrollTop = listScrollTopRef.current;
  }, [isListMode, scrollRef]);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        if (isListMode)
          listScrollTopRef.current = event.currentTarget.scrollTop;
      }}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isListMode ? "overflow-y-auto" : "overflow-hidden",
        "tablet:contents",
      )}
    >
      {children}
    </div>
  );
}
