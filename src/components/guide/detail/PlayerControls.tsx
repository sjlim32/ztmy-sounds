"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { songList } from "@/data/songs";

function getNeighborIds(songId: string): {
  prevId: string | null;
  nextId: string | null;
} {
  const index = songList.findIndex((song) => song.id === songId);
  if (index === -1) return { prevId: null, nextId: null };

  return {
    prevId: index > 0 ? songList[index - 1].id : null,
    nextId: index < songList.length - 1 ? songList[index + 1].id : null,
  };
}

/** 뒤로가기/이전곡/다음곡 — 곡이 선택돼 있을 때만, 영상 바로 아래 작게 표시. */
export function PlayerControls() {
  const segment = useSelectedLayoutSegment();

  if (!segment) return null;

  const { prevId, nextId } = getNeighborIds(segment);

  return (
    <nav
      data-role="player-controls"
      className="mt-2 flex items-center gap-4 text-xs"
    >
      <Link href="/guide">노래 목록</Link>
      {prevId ? (
        <Link href={`/guide/${prevId}`}>이전곡</Link>
      ) : (
        <span aria-disabled="true" className="opacity-40">
          이전곡
        </span>
      )}
      {nextId ? (
        <Link href={`/guide/${nextId}`}>다음곡</Link>
      ) : (
        <span aria-disabled="true" className="opacity-40">
          다음곡
        </span>
      )}
    </nav>
  );
}
