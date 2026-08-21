"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { songList } from "@/data/songs";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";

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

const navButtonClass =
  "flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:text-white/20";

/** 뒤로가기/이전곡/다음곡 — 곡이 선택돼 있을 때만, 영상 바로 아래 작게 표시. */
export function PlayerControls() {
  const segment = useSelectedLayoutSegment();

  if (!segment) return null;

  const { prevId, nextId } = getNeighborIds(segment);

  return (
    <nav data-role="player-controls" className="mt-2 flex items-center gap-3">
      {prevId ? (
        <Link
          href={`/guide/${prevId}`}
          aria-label="이전곡"
          className={navButtonClass}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="이전곡"
          className={navButtonClass}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}

      <Link
        href="/guide"
        className="hover:border-ztmy-pink/60 rounded-full border border-white/15 bg-black/40 px-4 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        노래 목록
      </Link>

      {nextId ? (
        <Link
          href={`/guide/${nextId}`}
          aria-label="다음곡"
          className={navButtonClass}
        >
          <ChevronLeftIcon className="h-5 w-5 rotate-180" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="다음곡"
          className={navButtonClass}
        >
          <ChevronLeftIcon className="h-5 w-5 rotate-180" />
        </button>
      )}
    </nav>
  );
}
