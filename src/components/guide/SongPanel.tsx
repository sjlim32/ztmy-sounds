"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Song } from "@/lib/guide/types";
import { getSong } from "@/data/songs";
import { usePlayer } from "@/context/player-context";
import { getActiveLineIndex } from "@/lib/guide/lyric-sync";
import { SongList } from "@/components/guide/list/SongList";
import { LyricsView } from "@/components/guide/detail/LyricsView";

const LYRICS_ENTER_DELAY_MS = 600; // 목록 접힘 애니메이션(600ms)이 끝난 뒤 가사가 이어서 나타나도록 주는 지연
const LYRICS_FADE_MS = 500; // 가사 opacity 트랜지션 시간과 맞춰서, 다 사라진 뒤에야 실제로 내용을 비움
const PANEL_ENTER_DELAY_MS = 150; // GuideDimOverlay의 duration-700(화면이 어두워지는 시간)과 맞춰, 그 뒤에 패널이 나타나도록 주는 지연

export function SongPanel() {
  const segment = useSelectedLayoutSegment(); // 레이아웃이 자식 세그먼트를 감지하여 목록 / 상세보기를 토글하기 위한 훅
  const { activeSongId, currentTime, setActiveSongId, seekTo } = usePlayer();

  const song = segment ? getSong(segment) : null;

  const [renderedSong, setRenderedSong] = useState<Song | null>(song);
  const [visibleSongId, setVisibleSongId] = useState<string | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  if (song && renderedSong !== song) setRenderedSong(song);

  useEffect(() => {
    setActiveSongId(segment);
  }, [segment, setActiveSongId]);

  useEffect(() => {
    // 마운트(=/guide 진입) 시 한 번만 실행 — 화면이 다 어두워진 뒤에
    // 패널이 이어서 서서히 나타나도록 지연.
    const id = setTimeout(() => setIsPanelVisible(true), PANEL_ENTER_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (song) {
      // 노래 선택 시 목록 접힌 뒤(300ms) 가사 보이도록 지연
      const enterId = setTimeout(
        () => setVisibleSongId(song.id),
        LYRICS_ENTER_DELAY_MS,
      );
      return () => clearTimeout(enterId);
    }

    // 노래 제거 시 fade-out 트랜지션이 끝난 뒤에야 실제로 내용을 비우도록 지연
    const exitId = setTimeout(() => setRenderedSong(null), LYRICS_FADE_MS);
    return () => clearTimeout(exitId);
  }, [song]);

  const lyricsVisible = !!song && visibleSongId === song.id;
  const isActiveSong = !!song && activeSongId === song.id;
  const activeLineIndex = isActiveSong
    ? getActiveLineIndex(song.lyrics, currentTime)
    : -1;

  return (
    <div
      data-role="song-panel"
      className={clsx(
        // 모바일: 자체 박스를 없애 SongList/LyricsView가 guide/layout.tsx의
        // flex-col에 직접 노출되도록 함(각자 order-1/order-3로 위치 결정).
        // 배경/투명도/애니메이션은 이제 SongList의 ul, LyricsView가 각자
        // visible prop으로 자체 처리.
        // tablet 이상: 기존 그대로 — 1440px 미만은 고정폭(max-w-sm), 1440px
        // 이상은 뷰포트의 30%(7:3 비율)로 확장 — max-w-sm이 30vw보다 좁아서
        // 그대로 두면 잘리므로 max-w-none으로 해제.
        "contents tablet:fixed tablet:inset-x-auto tablet:top-1/2 tablet:right-6 tablet:z-20 tablet:flex tablet:w-full tablet:max-w-sm tablet:flex-col tablet:-translate-y-1/2 tablet:transition-[height,opacity] tablet:duration-300 min-[1440px]:w-[30vw] min-[1440px]:max-w-none",
        song ? "tablet:h-[88vh]" : "tablet:h-[40vh]",
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
