"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Song } from "@/lib/guide/types";
import { songs } from "@/data/songs";
import { usePlayer } from "@/context/player-context";
import { getActiveLineIndex } from "@/lib/guide/lyric-sync";
import { LyricLine } from "@/components/guide/LyricLine";

function getNeighborIds(songId: string): { prevId: string | null; nextId: string | null } {
  const index = songs.findIndex((song) => song.id === songId);
  if (index === -1) return { prevId: null, nextId: null };

  return {
    prevId: index > 0 ? songs[index - 1].id : null,
    nextId: index < songs.length - 1 ? songs[index + 1].id : null,
  };
}

export function SongView({ song }: { song: Song }) {
  const router = useRouter();
  const { activeSongId, currentTime, setActiveSongId } = usePlayer();
  const { prevId, nextId } = getNeighborIds(song.id);

  useEffect(() => {
    setActiveSongId(song.id);
  }, [song.id, setActiveSongId]);

  const isActiveSong = activeSongId === song.id;
  const activeLineIndex = isActiveSong ? getActiveLineIndex(song.lyrics, currentTime) : -1;

  return (
    <div data-role="song-view">
      <button type="button" onClick={() => router.push("/guide")}>
        ← 목록으로
      </button>

      <h1>{song.title}</h1>

      <nav data-role="song-nav">
        <button type="button" disabled={!prevId} onClick={() => prevId && router.push(`/guide/${prevId}`)}>
          이전 곡
        </button>
        <button type="button" disabled={!nextId} onClick={() => nextId && router.push(`/guide/${nextId}`)}>
          다음 곡
        </button>
      </nav>

      <ol data-role="lyric-list">
        {song.lyrics.map((line, index) => (
          <LyricLine key={line.time} line={line} isActive={index === activeLineIndex} />
        ))}
      </ol>
    </div>
  );
}
