"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Song } from "@/features/guide/lib/types";
import { getSong } from "@/features/guide/data/songs";
import { usePlayer } from "@/features/guide/player-context";
import { getActiveLineIndex } from "@/features/guide/lib/lyric-sync";
import { SongList } from "@/components/guide/list/SongList";
import { LyricsView } from "@/components/guide/detail/LyricsView";

const LYRICS_ENTER_DELAY_MS = 600; // 목록 접힘 애니메이션(600ms)이 끝난 뒤 가사가 이어서 나타나도록 주는 지연
const PANEL_ENTER_DELAY_MS = 150; // GuideDimOverlay의 duration-700(화면이 어두워지는 시간)과 맞춰, 그 뒤에 패널이 나타나도록 주는 지연

export function SongPanel() {
  const segment = useSelectedLayoutSegment(); // 레이아웃이 자식 세그먼트를 감지하여 목록 / 상세보기를 토글하기 위한 훅
  const { activeSongId, currentTime, setActiveSongId, seekTo } = usePlayer();

  const song = segment ? getSong(segment) : null;

  const [renderedSong, setRenderedSong] = useState<Song | null>(song);
  const [visibleSongId, setVisibleSongId] = useState<string | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  useEffect(() => {
    setActiveSongId(segment);
  }, [segment, setActiveSongId]);

  useEffect(() => {
    // 마운트(=/guide 진입) 시 한 번만 실행 — 화면이 다 어두워진 뒤에
    // 패널이 이어서 서서히 나타나도록 지연.
    const id = setTimeout(() => setIsPanelVisible(true), PANEL_ENTER_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  // 곡이 바뀌면 렌더 중에 즉시(트랜지션 없이) 이전 내용을 감추고 내용을
  // 교체합니다 — 사라질 때는 애니메이션 없이 바로 사라지고, 나타날 때만
  // 아래 effect에서 지연 후 fade-in.
  if (song?.id !== renderedSong?.id) {
    setRenderedSong(song);
    if (visibleSongId !== null) setVisibleSongId(null);
  }

  useEffect(() => {
    if (!song) return;

    // 노래 선택 시 목록 접힘 애니메이션(600ms) 끝난 뒤 가사가 이어서 fade-in.
    const showId = setTimeout(
      () => setVisibleSongId(song.id),
      LYRICS_ENTER_DELAY_MS,
    );
    return () => clearTimeout(showId);
  }, [song]);

  const lyricsVisible = !!song && visibleSongId === song.id;
  const isActiveSong = !!song && activeSongId === song.id;
  const activeLineIndex = isActiveSong
    ? getActiveLineIndex(song.lyrics, currentTime)
    : -1;

  return (
    <div
      data-role="song-panel"
      className={cn(
        // 모바일: 자체 박스를 없애 SongList/LyricsView가 guide/layout.tsx의
        // flex-col에 직접 노출되도록 함(각자 order-1/order-3로 위치 결정).
        // 배경/투명도/애니메이션은 이제 SongList의 ul, LyricsView가 각자
        // visible prop으로 자체 처리.
        // tablet 이상: 기존 그대로 — 1440px 미만은 고정폭(max-w-sm), 1440px
        // 이상은 뷰포트의 30%(7:3 비율)로 확장 — max-w-sm이 30vw보다 좁아서
        // 그대로 두면 잘리므로 max-w-none으로 해제.
        "pc:w-[30vw] pc:max-w-none contents",
        "tablet:fixed tablet:inset-x-auto tablet:top-1/2 tablet:right-6 tablet:z-20 tablet:flex tablet:w-full tablet:max-w-sm tablet:flex-col",
        "tablet:-translate-y-1/2 tablet:transition-[height,opacity] tablet:duration-300",
        "wide:right-16",
        song
          ? "tablet:h-[88vh]"
          : // 목록 화면(/guide)에는 하단에 Footer가 같이 떠 있어서, 패널이
            // top-1/2로 중앙 정렬된 채 40vh를 그대로 쓰면 화면이 짧을 때
            // 아래쪽이 Footer 위로 겹칩니다. Footer 높이(~약 5rem)만큼을
            // 위아래로 두 번 뺀 값(10rem)과 40vh 중 더 작은 쪽을 사용.
            "tablet:h-[min(46vh,calc(140dvh-10rem))]",
        isPanelVisible ? "tablet:opacity-100" : "tablet:opacity-0",
      )}
    >
      <SongList selectedSongId={song?.id ?? null} visible={isPanelVisible} />

      <LyricsView
        song={renderedSong}
        visible={lyricsVisible}
        activeLineIndex={activeLineIndex}
        seekTo={seekTo}
      />
    </div>
  );
}
