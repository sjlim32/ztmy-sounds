"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { Song } from "@/features/guide/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { useGuideMode } from "@/features/guide/guide-mode-context";

export function getNeighborIds(
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

/** 이전곡 버튼 — 모바일 전용(영상 왼쪽). 태블릿 이상은 GuideDetailToolbar가 대신한다. */
export function PlayerPrevButton() {
  const segment = useSelectedLayoutSegment();
  const { songs, basePath } = useGuideMode();
  if (!segment) return null;

  const { prevId } = getNeighborIds(songs, segment);

  return prevId ? (
    <Link
      href={`${basePath}/${prevId}`}
      aria-label="이전곡"
      className={cn(navButtonClass, "tablet:hidden")}
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </Link>
  ) : (
    <button
      type="button"
      disabled
      aria-label="이전곡"
      className={cn(navButtonClass, "tablet:hidden")}
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
  );
}

/** 다음곡 버튼 — 모바일 전용(영상 오른쪽). 태블릿 이상은 GuideDetailToolbar가 대신한다. */
export function PlayerNextButton() {
  const segment = useSelectedLayoutSegment();
  const { songs, basePath } = useGuideMode();
  if (!segment) return null;

  const { nextId } = getNeighborIds(songs, segment);

  return nextId ? (
    <Link
      href={`${basePath}/${nextId}`}
      aria-label="다음곡"
      className={cn(navButtonClass, "tablet:hidden")}
    >
      <ChevronLeftIcon className="h-5 w-5 rotate-180" />
    </Link>
  ) : (
    <button
      type="button"
      disabled
      aria-label="다음곡"
      className={cn(navButtonClass, "tablet:hidden")}
    >
      <ChevronLeftIcon className="h-5 w-5 rotate-180" />
    </button>
  );
}
