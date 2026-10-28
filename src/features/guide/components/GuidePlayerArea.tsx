"use client";

import { useCallback, useState } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { YouTubePlayer } from "@/features/guide/components/YouTubePlayer";
import {
  PlayerPrevButton,
  PlayerNextButton,
} from "@/features/guide/components/PlayerControls";
import { GuideDetailToolbar } from "@/features/guide/components/GuideDetailToolbar";
import { SongListDrawer } from "@/features/guide/components/SongListDrawer";
import { CallLegend } from "@/features/guide/components/CallLegend";
import { SongReportLink } from "@/features/guide/components/SongReportLink";
import { SongDescriptionPanel } from "@/features/guide/components/SongDescriptionPanel";
import { getSong } from "@/features/guide/data/songs";
import { PLAYER_COLUMN_CLASS } from "@/features/guide/lib/player-layout";

const playerAreaStyles = cva(
  [
    "order-2 flex w-full shrink-0 flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 overflow-hidden px-2 py-2 transition-[max-height,opacity] duration-500",
    // 모바일은 첫 줄 [◀ 영상 ▶], 둘째 줄(basis-full) 응원 표시 안내 + 오류 제보.
    // 모바일은 열고 닫을 때 애니메이션 없이 바로 — 목록 ↔ 곡 상세가 다른
    // 화면처럼 바로 바뀐다(곡 제목이 상단 바로 옮겨 가서 "목록이 고른 곡으로
    // 줄어드는" 흐름이 더는 보이지 않음). 태블릿 이상은 그대로 펼침 애니메이션.
    "max-tablet:transition-none",
    // content-center를 명시하지 않으면 브라우저마다(특히 Safari) 줄바꿈된 두
    // 줄(영상/컨트롤) 사이 여백을 다르게 계산해 영상과 컨트롤 사이가 크게
    // 벌어질 수 있어 명시적으로 고정. center로 둬서 영상+컨트롤 묶음 전체가
    // 화면 세로 중앙에 오도록 함.
    // tablet 이상은 세로 스택: 곡 이동 버튼 줄(order-0) → 영상(1) → 응원
    // 안내·곡 설명(3). 스윙 GIF는 가사 영역(LyricsView)에 뜬다. 모바일 전용
    // ◀▶/목록 버튼은 tablet:hidden.
    "tablet:flex-wrap tablet:content-center tablet:gap-y-3",
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
        // tablet 이상은 상한을 넉넉히(200dvh) 둔다 — max-h-dvh면 낮은 화면에서
        // 내용이 화면보다 길 때 이 박스가 잘리고(content-center라 위아래가 같이
        // 잘림) 위쪽 곡 이동 버튼 줄이 보이지도, 스크롤로 닿지도 않는다. 넘치는
        // 만큼은 바깥 GuideMainScrollArea가 스크롤한다.
        open: "tablet:bg-transparent tablet:max-h-[200dvh] max-h-dvh bg-black/50 opacity-100",
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
  const song = segment ? getSong(segment) : null;
  // 곡 목록 드로어는 "어느 곡 화면에서 열었는지"로 기억한다 — 뒤로가기 등으로
  // 곡(또는 목록 화면)이 바뀌면 따로 닫지 않아도 자연히 닫힌 상태가 된다.
  const [listOpenedAt, setListOpenedAt] = useState<string | null>(null);
  // 곡이 바뀌면 열림 기록 자체를 지운다(앞으로가기로 돌아와도 다시 안 열리게).
  const [lastSegment, setLastSegment] = useState(segment);
  if (segment !== lastSegment) {
    setLastSegment(segment);
    setListOpenedAt(null);
  }
  const isListOpen = segment !== null && listOpenedAt === segment;
  const openList = useCallback(() => setListOpenedAt(segment), [segment]);
  const closeList = useCallback(() => setListOpenedAt(null), []);

  return (
    <div
      data-role="guide-player-area"
      className={playerAreaStyles({
        state: isSongSelected ? "open" : "closed",
      })}
    >
      <GuideDetailToolbar onOpenList={openList} />
      <PlayerPrevButton />
      <div className="tablet:order-1 tablet:basis-full flex w-2/3 justify-center">
        <div className={cn(PLAYER_COLUMN_CLASS, "flex justify-center")}>
          <YouTubePlayer />
        </div>
      </div>
      <PlayerNextButton />
      {/* 모바일: 영상 바로 아래 한 줄 — 왼쪽 응원 표시 안내(작게), 오른쪽 곡별
      오류 제보. 태블릿 이상은 응원 안내가 영상 아래 카드, 오류 제보는 가사
      영역 왼쪽 아래(LyricsView). */}
      {song && (
        <div className="tablet:hidden flex basis-full items-center justify-between gap-2 px-1">
          <CallLegend variant="compact" />
          <SongReportLink song={song} variant="inline" className="shrink-0" />
        </div>
      )}
      {song && (
        <div className="tablet:order-3 tablet:flex tablet:basis-full hidden justify-center">
          <div className={cn(PLAYER_COLUMN_CLASS, "flex flex-col gap-3")}>
            {/* 자동 스크롤·오류 제보는 가사를 다루는 기능이라 가사 영역(LyricsView)에 있다. */}
            <CallLegend />
            <SongDescriptionPanel song={song} />
          </div>
        </div>
      )}
      <SongListDrawer
        open={isListOpen}
        onClose={closeList}
        currentSongId={segment}
      />
    </div>
  );
}
