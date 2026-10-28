"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { HEADER_TITLE_TRANSITION } from "@/components/mobile/header-title-transition";
import { useGuideMode } from "@/features/guide/guide-mode-context";

/**
 * 모바일 가이드·슬램 곡 상세: 상단 바(MobileHeader) 가운데에 곡 제목을 겹쳐
 * 그린다 — 상단 바는 곡 상세에서 로고를 비워 두고, 본문의 선택된 곡 줄은
 * 모바일에서 숨긴다(SongList). 전역 헤더가 곡 데이터를 불러오지 않도록 제목은
 * 가이드 화면(guide/slam layout)이 직접 그린다. 정적 HTML에도 들어가서
 * 처음 열 때 로고 → 제목으로 바뀌는 깜빡임이 없다.
 *
 * 위치·높이는 MobileHeader(fixed top-0, h-12, z-30)에 맞춘다. 좌우는 양쪽
 * 버튼 자리(왼쪽 뒤로가기, 오른쪽 공유·메인)를 피해 같은 폭만큼 비워 가운데를 맞춘다.
 */
export function MobileSongTitle() {
  const segment = useSelectedLayoutSegment();
  const { songs } = useGuideMode();
  const song = segment ? songs.find((item) => item.id === segment) : null;
  if (!song) return null;

  return (
    // key로 곡이 바뀔 때마다 새로 그려, 상단 바의 페이지 이름처럼 살짝
    // 올라오며 나타난다(HEADER_TITLE_TRANSITION).
    <div
      key={song.id}
      className={cn(
        "tablet:hidden pointer-events-none fixed inset-x-24 top-0 z-40 flex h-12 flex-col items-center justify-center leading-tight",
        HEADER_TITLE_TRANSITION,
      )}
    >
      <h1 className="font-mkpop max-w-full truncate text-base text-white">
        {song.title.jp}
      </h1>
      <p className="max-w-full truncate text-xs text-white/60">
        {song.title.kr}
      </p>
    </div>
  );
}
