"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { songList } from "@/features/guide/data/songs";
import { cn } from "@/lib/utils";
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

/** 이전곡 버튼 — 모바일에선 영상 왼쪽, 태블릿/PC에선 영상 아래 표시. */
export function PlayerPrevButton() {
  const segment = useSelectedLayoutSegment();
  if (!segment) return null;

  const { prevId } = getNeighborIds(segment);

  return prevId ? (
    <Link
      href={`/guide/${prevId}`}
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
  if (!segment) return null;

  const { nextId } = getNeighborIds(segment);

  return nextId ? (
    <Link
      href={`/guide/${nextId}`}
      aria-label="다음곡"
      className={cn(navButtonClass, "tablet:order-3")}
    >
      <ChevronLeftIcon className="h-5 w-5 rotate-180" />
    </Link>
  ) : (
    <button
      type="button"
      disabled
      aria-label="다음곡"
      className={cn(navButtonClass, "tablet:order-3")}
    >
      <ChevronLeftIcon className="h-5 w-5 rotate-180" />
    </button>
  );
}
