"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState } from "react";
import type { Song } from "@/lib/guide/types";
import { getSong, songs } from "@/data/songs";
import { usePlayer } from "@/context/player-context";
import { getActiveLineIndex } from "@/lib/guide/lyric-sync";
import { parseTimestamp } from "@/lib/guide/timestamp";
import { LyricLine } from "@/components/guide/LyricLine";

// 목록 접힘 애니메이션이 끝난 뒤 가사가 이어서 나타나도록 주는 지연
const LYRICS_ENTER_DELAY_MS = 300;
// 가사 opacity 트랜지션 시간과 맞춰서, 다 사라진 뒤에야 실제로 내용을 비움
const LYRICS_FADE_MS = 500;

/**
 * 목록과 곡 상세를 하나의 패널로 통합. 라우트가 바뀌어도 이 컴포넌트 자체는
 * `guide/layout.tsx`에 계속 마운트돼 있고, 곡 목록은 항상 같은 위치/너비를
 * 유지합니다. 곡을 선택하면 선택되지 않은 항목들만 접혀서(max-height 트랜지션)
 * 사라지고, 선택된 항목(같은 엘리먼트)이 자연스럽게 맨 위로 올라가 제목처럼
 * 보이게 됩니다 — 별도로 위치를 옮기는 게 아니라 형제 요소들이 접히면서
 * 문서 흐름상 위로 밀려 올라가는(내려가는) 방식이라 X좌표는 그대로, Y좌표만
 * 서서히 바뀝니다. 가사는 opacity로 fade-in/out하되, 사라지는 동안에도
 * 마지막으로 보여준 곡(renderedSong)을 계속 렌더링해서 실제로 "사라지는"
 * 애니메이션이 보이도록 하고, 트랜지션이 끝난 뒤에야 내용을 비웁니다.
 */
export function SongPanel() {
  const segment = useSelectedLayoutSegment();
  const song = segment ? (getSong(segment) ?? null) : null;
  const { activeSongId, currentTime, setActiveSongId, seekTo } = usePlayer();

  // song이 선택되는 순간 즉시 따라가야 해서(딜레이 없이) 렌더 중에 갱신합니다
  // (effect 안에서 동기적으로 setState하는 것보다 React가 권장하는 방식).
  const [renderedSong, setRenderedSong] = useState<Song | null>(song);
  if (song && renderedSong !== song) {
    setRenderedSong(song);
  }

  // 가사가 "보여야 하는" 곡 id. song이 null이 되면 별도 reset 없이
  // 아래 lyricsVisible 계산에서 자연히 false가 됩니다.
  const [visibleSongId, setVisibleSongId] = useState<string | null>(null);

  useEffect(() => {
    setActiveSongId(segment);
  }, [segment, setActiveSongId]);

  useEffect(() => {
    if (!song) return;
    // 목록 항목이 접히는 애니메이션(약 300ms)이 끝난 뒤에 가사가 이어서
    // 나타나도록 살짝 지연 — 하나의 흐름처럼 보이게 하기 위함.
    const enterId = setTimeout(() => setVisibleSongId(song.id), LYRICS_ENTER_DELAY_MS);
    return () => clearTimeout(enterId);
  }, [song]);

  useEffect(() => {
    if (song) return;
    // fade-out 트랜지션이 끝난 뒤에야 실제로 내용을 비웁니다.
    const exitId = setTimeout(() => setRenderedSong(null), LYRICS_FADE_MS);
    return () => clearTimeout(exitId);
  }, [song]);

  const lyricsVisible = !!song && visibleSongId === song.id;

  const isActiveSong = !!song && activeSongId === song.id;
  const activeLineIndex = isActiveSong ? getActiveLineIndex(song.lyrics, currentTime) : -1;

  return (
    <div
      data-role="song-panel"
      className={`fixed right-6 top-1/2 z-20 flex w-full max-w-sm -translate-y-1/2 flex-col transition-[height] duration-300 ${
        song ? "h-[88vh]" : "h-[40vh]"
      }`}
    >
      {/* 곡을 선택하면 패널이 66vh -> 80vh로 커지고, top-1/2 -translate-y-1/2라
          어느 쪽이든 항상 세로 중앙에 위치합니다. */}
      <ul data-role="song-panel-list" className="flex max-h-[66vh] flex-col divide-y divide-white/15 overflow-y-auto">
        {songs.map((item) => {
          const isSelected = song?.id === item.id;
          const isCollapsed = !!song && !isSelected;

          return (
            <li
              key={item.id}
              className={`overflow-hidden transition-all duration-300 ${
                isCollapsed ? "max-h-0 opacity-0" : "max-h-16 opacity-100"
              }`}
            >
              <Link
                href={`/guide/${item.id}`}
                className={
                  isSelected
                    ? "block px-4 py-3 text-lg font-bold"
                    : "block px-4 py-3 transition-colors hover:bg-white/10"
                }
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>

      {renderedSong ? (
        <ol
          data-role="lyric-list"
          className={`mt-2 flex-1 overflow-y-auto transition-opacity duration-500 ${
            lyricsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {renderedSong.lyrics.map((line, index) => (
            <LyricLine
              key={line.time}
              line={line}
              isActive={index === activeLineIndex}
              onSelect={() => seekTo(parseTimestamp(line.time))}
            />
          ))}
        </ol>
      ) : null}
    </div>
  );
}
