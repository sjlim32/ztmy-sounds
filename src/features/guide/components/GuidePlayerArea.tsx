"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cva } from "class-variance-authority";
import { YouTubePlayer } from "@/features/guide/components/YouTubePlayer";
import {
  PlayerPrevButton,
  PlayerNextButton,
  PlayerSongListLink,
} from "@/features/guide/components/PlayerControls";

const playerAreaStyles = cva(
  [
    "order-2 flex w-full shrink-0 flex-row flex-nowrap items-center justify-center gap-2 overflow-hidden px-2 py-2 transition-[max-height,opacity] duration-500",
    // content-center를 명시하지 않으면 브라우저마다(특히 Safari) 줄바꿈된 두
    // 줄(영상/컨트롤) 사이 여백을 다르게 계산해 영상과 컨트롤 사이가 크게
    // 벌어질 수 있어 명시적으로 고정. center로 둬서 영상+컨트롤 묶음 전체가
    // 화면 세로 중앙에 오도록 함.
    "tablet:flex-wrap tablet:content-center",
    // tablet 이상에서도 w-full 유지 — YouTubePlayer 내부의 퍼센트 기반 폭
    // (min(90%, ...))이 이 요소를 기준으로 계산되므로, 여기서 폭을
    // content-fit(w-auto)으로 줄이면 그 퍼센트 계산 기준이 사라져 영상이
    // 의도보다 작게 렌더링됨. 대신 justify-center로 영상+컨트롤 묶음을 이
    // 요소 자신의 전체 폭 안에서 가운데 정렬.
    "tablet:px-0",
  ],
  {
    variants: {
      state: {
        // 모바일 높이는 뷰포트 vh가 아니라 콘텐츠(aspect-video 영상 + 컨트롤)
        // 크기로 정해져야 너비가 바뀌어도 영상 비율이 안 깨지고 PlayerControls가
        // 항상 영상 바로 아래에 옴 — max-height는 열림 애니메이션용 상한일 뿐,
        // 실제 높이는 h-auto(기본값)로 콘텐츠에 맡김. closed일 때 max-h-0으로
        // 완전히 0 높이가 되어야(display:none이 아니라) 같은 메인 영역을
        // 공유하는 NoticePanel의 중앙 정렬을 밀어내지 않음 — 이 max-height
        // 트릭 자체가 YouTube iframe을 언마운트하지 않고 유지하기 위한 것이라
        // tablet 이상에서도 그대로 적용.
        open: "tablet:bg-transparent max-h-dvh bg-black/50 opacity-100",
        closed: "pointer-events-none max-h-0 opacity-0",
      },
    },
  },
);

/**
 * 곡이 선택되지 않은 목록 화면(/guide)에서는 영상 영역을 fade-out합니다.
 * `hidden`으로 언마운트하는 대신 opacity/max-height만 토글하기 때문에
 * YouTubePlayer는 항상 트리에 남아있습니다(iframe 재생성 문제 없음).
 *
 * 모바일: guide/layout.tsx의 flex-col 안에서 order-2인 일반 flex 아이템.
 * 헤더 → 선택된 곡 li(order-1) → 영상(여기, order-2) → 가사(order-3) 순.
 *
 * tablet 이상: guide/layout.tsx의 메인 영역(flex-1) 안에서 NoticePanel과
 * 자리를 공유하는 일반 flex 아이템 — closed 상태의 max-h-0이 실제로 높이를
 * 0으로 만들어야 같은 영역의 NoticePanel 중앙 정렬을 밀어내지 않으므로,
 * 이 max-height 트릭은 tablet 이상에서도 그대로 적용됩니다. 화면 안에서의
 * 좌우 위치(SongPanel을 피한 나머지 영역의 가운데)는 이제 이 컴포넌트가
 * 아니라 guide/layout.tsx의 flex row가 결정합니다.
 */
export function GuidePlayerArea() {
  const segment = useSelectedLayoutSegment();
  const isSongSelected = segment !== null;

  return (
    <div
      data-role="guide-player-area"
      className={playerAreaStyles({
        state: isSongSelected ? "open" : "closed",
      })}
    >
      <PlayerPrevButton />
      <div className="tablet:order-1 tablet:basis-full flex w-2/3 justify-center">
        <YouTubePlayer />
      </div>
      <PlayerSongListLink />
      <PlayerNextButton />
    </div>
  );
}
