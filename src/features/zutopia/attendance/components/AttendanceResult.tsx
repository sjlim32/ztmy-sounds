"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FOCUS_RING,
  SOFT_PURPLE_BUTTON_CLASS,
} from "@/components/button-styles";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { FilterChip } from "@/components/FilterChips";
import { secondaryTitle } from "@/features/zutopia/song-db/song-title";
import type {
  AttendanceSong,
  AttendanceSummary,
} from "@/features/zutopia/attendance/summarize";

type ListMode = "heard" | "unheard";

/**
 * 참전 기록 — 성불(라이브로 들은 곡, 많이 들은 순) / 성불 대기(아직 못 들은
 * 곡, 발매일 순) 목록. 태블릿 2열, PC 3열. 숫자 요약은 페이지 위 현황 막대에 있다.
 * 두 목록 고르기는 태블릿 이상은 목록 위 필터 칩, 모바일은 목록 카드 안 위쪽
 * 두 칸 토글.
 */
export function AttendanceResult({
  summary,
  ready,
  onOpenPicker,
}: {
  summary: AttendanceSummary;
  ready: boolean;
  onOpenPicker: () => void;
}) {
  const [mode, setMode] = useState<ListMode>("heard");

  if (!ready) return null;

  if (summary.attendedCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center">
        <p className={cn("text-base text-white/70", "tablet:text-lg")}>
          아직 체크한 공연이 없어요.
        </p>
        <button
          type="button"
          onClick={onOpenPicker}
          className={cn(SOFT_PURPLE_BUTTON_CLASS, "px-4 py-2 text-sm")}
        >
          공연 체크하기
        </button>
      </div>
    );
  }

  const list: (AttendanceSong & { count?: number })[] =
    mode === "heard" ? summary.heard : summary.unheard;

  const modes = [
    { key: "heard", label: "성불", count: summary.heard.length },
    { key: "unheard", label: "성불 대기", count: summary.unheard.length },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* 태블릿 이상: 목록 위 필터 칩. 모바일은 목록 카드 안 위쪽 토글(아래). */}
        <div className="tablet:flex hidden gap-2">
          {modes.map((item) => (
            <FilterChip
              key={item.key}
              active={mode === item.key}
              onClick={() => setMode(item.key)}
            >
              {item.label} {item.count}
            </FilterChip>
          ))}
        </div>
        <a
          href="/zutopia/songs?lastLive=1"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
        >
          노래별 마지막 라이브
          <ExternalLinkIcon className="size-3.5" />
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {/* 모바일: 두 칸 토글 — 고른 칸만 면이 채워진다. */}
        <div
          role="group"
          aria-label="목록 고르기"
          className="tablet:hidden m-2 mb-1 grid grid-cols-2 gap-1 rounded-lg bg-black/30 p-1"
        >
          {modes.map((item) => {
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(item.key)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
                  FOCUS_RING,
                  active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/55 hover:text-white",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    active && item.key === "heard" && "text-ztmy-magenta",
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
        <ul
          className={cn(
            "grid grid-cols-1 gap-x-6 px-3 py-1",
            "tablet:grid-cols-2 tablet:px-4",
            "pc:grid-cols-3",
          )}
        >
          {list.map((song) => (
            <SongRow key={song.id} song={song} count={song.count ?? null} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SongRow({
  song,
  count,
}: {
  song: AttendanceSong;
  count: number | null;
}) {
  return (
    <li className="flex min-w-0 items-center gap-3 border-b border-white/5 py-2">
      {song.coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={song.coverSrc}
          alt=""
          loading="lazy"
          className="size-10 shrink-0 rounded bg-black/40 object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="block size-10 shrink-0 rounded bg-white/5"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-white">
          {song.title}
        </span>
        <span className="block truncate text-sm text-white/70">
          {secondaryTitle(song)}
        </span>
      </span>
      {count !== null && (
        <span className="shrink-0 text-base font-semibold text-white/90 tabular-nums">
          ×{count}
        </span>
      )}
    </li>
  );
}
