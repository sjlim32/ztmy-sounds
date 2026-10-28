"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Song } from "@/features/guide/lib/types";
import { usePlayer } from "@/features/guide/player-context";
import { getActiveLineIndex } from "@/features/guide/lib/lyric-sync";
import { getSongForVersion } from "@/features/guide/lib/song-version";
import { saveLastSongId } from "@/features/guide/lib/last-song";
import { SongList } from "@/features/guide/components/SongList";
import { LyricsView } from "@/features/guide/components/LyricsView";
import { usePanelEntranceVisible } from "@/lib/use-entrance-visible";

const LYRICS_ENTER_DELAY_MS = 600; // 목록 접힘 애니메이션(600ms)이 끝난 뒤 가사가 이어서 나타나도록 주는 지연

export function SongPanel() {
  const segment = useSelectedLayoutSegment(); // 레이아웃이 자식 세그먼트를 감지하여 목록 / 상세보기를 토글하기 위한 훅
  const { activeSongId, songVersion, currentTime, setActiveSongId, seekTo } =
    usePlayer();

  const song = segment ? getSongForVersion(segment, songVersion) : null;

  const [renderedSong, setRenderedSong] = useState<Song | null>(song);
  const [visibleSongId, setVisibleSongId] = useState<string | null>(null);
  const isPanelVisible = usePanelEntranceVisible();

  useEffect(() => {
    setActiveSongId(segment);
  }, [segment, setActiveSongId]);

  // 홈의 "이어서 연습하기"용. 없는 곡 id(404)는 저장하지 않는다.
  const songId = song?.id;
  useEffect(() => {
    if (songId) saveLastSongId(songId);
  }, [songId]);

  // 곡이 바뀌면(또는 음원/라이브 버전이 바뀌면) 렌더 중에 즉시(트랜지션
  // 없이) 이전 내용을 감추고 내용을 교체합니다 — 사라질 때는 애니메이션
  // 없이 바로 사라지고, 나타날 때만 아래 effect에서 지연 후 fade-in.
  // getSongForVersion()이 모듈 싱글턴 데이터를 반환하므로, 같은 id라도
  // 버전이 다르면 참조가 달라져 정상적으로 감지됩니다.
  if (song !== renderedSong) {
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
        // tablet 이상: guide/layout.tsx의 flex row에서 사이드바 역할 —
        // shrink-0으로 메인 영역(flex-1)에 폭을 뺏기지 않고, 세로 중앙
        // 정렬은 그 flex row의 items-center가 대신 맡음. pc 미만은
        // 고정폭(max-w-sm), pc 이상은 뷰포트의 36%로 확장해 가사를 넓게
        // 본다(영상 쪽이 나머지를 씀) — max-w-sm이 36vw보다 좁아서 그대로
        // 두면 잘리므로 max-w-none으로 해제.
        "pc:w-[36vw] pc:max-w-none contents",
        "tablet:flex tablet:w-full tablet:max-w-sm tablet:shrink-0 tablet:flex-col",
        "tablet:transition-[height,opacity] tablet:duration-300",
        // 목록 화면도 상세 화면과 같은 높이 — 목록 ↔ 상세를 오갈 때
        // 패널 크기가 바뀌지 않도록. (PC에선 Footer가 메인 화면에만 떠서
        // 여기선 Footer 몫을 뺄 필요가 없다. 4rem은 헤더 높이 — SiteHeader.)
        "tablet:h-[calc(94vh-4rem)]",
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
