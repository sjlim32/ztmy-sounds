"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { Song } from "@/features/guide/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { useGuideMode } from "@/features/guide/guide-mode-context";

function getNeighborIds(
  songs: Song[],
  songId: string,
): {
  prevId: string | null;
  nextId: string | null;
} {
  const index = songs.findIndex((song) => song.id === songId);
  if (index === -1) return { prevId: null, nextId: null };

  return {
    prevId: index > 0 ? songs[index - 1].id : null,
    nextId: index < songs.length - 1 ? songs[index + 1].id : null,
  };
}

const navButtonClass =
  "flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:text-white/20";

/** 이전곡 버튼 — 모바일에선 영상 왼쪽, 태블릿/PC에선 영상 아래 표시. */
export function PlayerPrevButton() {
  const segment = useSelectedLayoutSegment();
  const { songs, basePath } = useGuideMode();
  if (!segment) return null;

  const { prevId } = getNeighborIds(songs, segment);

  return prevId ? (
    <Link
      href={`${basePath}/${prevId}`}
      aria-label="이전곡"
      className={cn(navButtonClass, "tablet:order-2")}
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </Link>
  ) : (
    <button
      type="button"
      disabled
      aria-label="이전곡"
      className={cn(navButtonClass, "tablet:order-2")}
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
  );
}

/** 다음곡 버튼 — 모바일에선 영상 오른쪽, 태블릿/PC에선 영상 아래 표시. */
export function PlayerNextButton() {
  const segment = useSelectedLayoutSegment();
  const { songs, basePath } = useGuideMode();
  if (!segment) return null;

  const { nextId } = getNeighborIds(songs, segment);

  return nextId ? (
    <Link
      href={`${basePath}/${nextId}`}
      aria-label="다음곡"
      className={cn(navButtonClass, "tablet:order-4")}
    >
      <ChevronLeftIcon className="h-5 w-5 rotate-180" />
    </Link>
  ) : (
    <button
      type="button"
      disabled
      aria-label="다음곡"
      className={cn(navButtonClass, "tablet:order-4")}
    >
      <ChevronLeftIcon className="h-5 w-5 rotate-180" />
    </button>
  );
}

/** 노래 목록으로 돌아가는 링크 — 태블릿/PC에서만, 영상 바로 아래 이전/다음곡 버튼 사이에 표시. */
export function PlayerSongListLink() {
  const segment = useSelectedLayoutSegment();
  const { basePath } = useGuideMode();
  if (!segment) return null;

  return (
    <Link
      href={basePath}
      className="hover:border-ztmy-magenta/60 tablet:order-3 tablet:inline-block hidden rounded-full border border-white/15 bg-black/40 px-4 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      노래 목록
    </Link>
  );
}
