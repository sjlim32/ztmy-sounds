"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import clsx from "clsx";
import { YouTubePlayer } from "@/components/guide/detail/YouTubePlayer";
import { PlayerControls } from "@/components/guide/detail/PlayerControls";

/**
 * 곡이 선택되지 않은 목록 화면(/guide)에서는 영상 영역을 fade-out합니다.
 * `hidden`으로 언마운트하는 대신 opacity만 토글하기 때문에 YouTubePlayer는
 * 항상 트리에 남아있고(iframe 재생성 문제 없음), fixed 포지션이라 opacity가
 * 0이어도 다른 요소의 레이아웃에 영향을 주지 않습니다
 * (재생 정지는 YouTubePlayer 쪽에서 activeSongId가 비는 걸 보고 처리).
 *
 * pr-108(27rem)은 우측 고정 SongPanel(w-full max-w-sm + right-6 offset =
 * 25.5rem) 만큼 기본 여백(1.5rem)에 더 얹은 값 — 영상이 화면 정중앙이
 * 아니라 그 패널을 뺀 나머지 영역의 가운데에 오도록 함.
 *
 * 모바일: guide/layout.tsx의 flex-col 안에서 order-2인 일반 flex 아이템.
 * 헤더 → 선택된 곡 li(order-1) → 영상(여기, order-2) → 가사(order-3) 순.
 */
export function GuidePlayerArea() {
  const segment = useSelectedLayoutSegment();
  const isSongSelected = segment !== null;

  return (
    <div
      data-role="guide-player-area"
      className={clsx(
        // 1440px 미만: 패널 고정폭(w-full max-w-sm + right-6)에 맞춘 고정 여백.
        // 1440px 이상: 패널이 뷰포트의 30%(7:3 비율)로 커지므로 그만큼 동적으로 여백도 넓힘.
        "tablet:fixed tablet:inset-0 tablet:h-auto tablet:max-h-none tablet:w-auto tablet:px-0 tablet:pr-108 tablet:pl-6 order-2 flex w-full shrink-0 flex-col items-center justify-center overflow-hidden px-2 py-2 transition-[max-height,opacity] duration-500 min-[1440px]:pr-[calc(30vw+1.5rem)]",
        // 모바일 높이는 뷰포트 vh가 아니라 콘텐츠(aspect-video 영상 + 컨트롤)
        // 크기로 정해져야 너비가 바뀌어도 영상 비율이 안 깨지고 PlayerControls가
        // 항상 영상 바로 아래에 옴 — max-height는 열림 애니메이션용 상한일 뿐,
        // 실제 높이는 h-auto(기본값)로 콘텐츠에 맡김.
        isSongSelected
          ? "tablet:bg-transparent max-h-dvh bg-black/50 opacity-100"
          : "pointer-events-none max-h-0 opacity-0",
      )}
    >
      <YouTubePlayer />
      <PlayerControls />
    </div>
  );
}
