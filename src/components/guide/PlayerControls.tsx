"use client";

import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { songs } from "@/data/songs";

function getNeighborIds(songId: string): { prevId: string | null; nextId: string | null } {
  const index = songs.findIndex((song) => song.id === songId);
  if (index === -1) return { prevId: null, nextId: null };

  return {
    prevId: index > 0 ? songs[index - 1].id : null,
    nextId: index < songs.length - 1 ? songs[index + 1].id : null,
  };
}

/** 뒤로가기/이전곡/다음곡 — 곡이 선택돼 있을 때만, 영상 바로 아래 작게 표시. */
export function PlayerControls() {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();

  if (!segment) return null;

  const { prevId, nextId } = getNeighborIds(segment);

  return (
    <nav data-role="player-controls" className="mt-2 flex items-center gap-4 text-xs">
      <button type="button" onClick={() => router.push("/guide")}>
        뒤로가기
      </button>
      <button
        type="button"
        disabled={!prevId}
        onClick={() => prevId && router.push(`/guide/${prevId}`)}
      >
        이전곡
      </button>
      <button
        type="button"
        disabled={!nextId}
        onClick={() => nextId && router.push(`/guide/${nextId}`)}
      >
        다음곡
      </button>
    </nav>
  );
}
