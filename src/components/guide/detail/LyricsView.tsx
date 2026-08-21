"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Song } from "@/lib/guide/types";
import { parseTimestamp } from "@/lib/guide/timestamp";
import { LyricLine } from "@/components/guide/detail/LyricLine";
import { AutoScrollToggle } from "@/components/guide/detail/AutoScrollToggle";
import { useAutoScrollPreference } from "@/lib/guide/auto-scroll";

export function LyricsView({
  song,
  visible,
  activeLineIndex,
  seekTo,
}: {
  song: Song | null;
  visible: boolean;
  activeLineIndex: number;
  seekTo: (seconds: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const bottomSentinelRef = useRef<HTMLLIElement>(null);
  // 목록 맨 아래 sentinel이 아직 안 보이면(교차 안 함) 더 스크롤할 게 남은 것.
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [autoScroll] = useAutoScrollPreference();

  useEffect(() => {
    const list = listRef.current;
    const sentinel = bottomSentinelRef.current;
    if (!list || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCanScrollDown(!entry.isIntersecting),
      { root: list },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // song이 바뀌면 가사 줄 수/높이가 달라지므로 다시 관찰합니다.
  }, [song]);

  useEffect(() => {
    if (!autoScroll) return;

    const list = listRef.current;
    const activeEl = list?.children[activeLineIndex] as HTMLElement | undefined;
    if (!list || !activeEl) return;

    // 목록 중앙에 오도록 스크롤. 위쪽에 콘텐츠가 부족해 중앙에 못 맞추는
    // 경우(target이 음수) scrollTo가 자연히 0으로 clamp하므로 별도 분기 불필요.
    const target =
      activeEl.offsetTop - list.clientHeight / 2 + activeEl.clientHeight / 2;
    list.scrollTo({ top: target, behavior: "smooth" });
  }, [song, activeLineIndex, autoScroll]);

  if (!song) return null;

  return (
    <div className="relative mt-2 min-h-0 flex-1">
      <ol
        ref={listRef}
        data-role="lyric-list"
        className={clsx(
          // bottom-12 = 스크롤 화살표 영역 확보
          "absolute inset-x-0 top-0 bottom-12 scrollbar-none overflow-y-auto transition-opacity duration-500 [&::-webkit-scrollbar]:hidden",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {song.lyrics.map((line, index) => (
          <LyricLine
            key={line.time}
            line={line}
            isActive={index === activeLineIndex}
            lineClick={() => seekTo(parseTimestamp(line.time))}
          />
        ))}

        <li ref={bottomSentinelRef} aria-hidden className="h-px" />
      </ol>

      {visible && canScrollDown && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 animate-bounce items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}

      {visible && <AutoScrollToggle />}
    </div>
  );
}
