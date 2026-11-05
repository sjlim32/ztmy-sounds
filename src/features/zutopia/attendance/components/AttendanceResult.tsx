"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACTION_BUTTON_CLASS,
  LINK_BUTTON_CLASS,
} from "@/components/button-styles";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { FilterChip, FilterRow } from "@/components/FilterChips";
import { secondaryTitle } from "@/features/zutopia/song-db/song-title";
import type {
  AttendanceSummary,
  AttendanceSong,
} from "@/features/zutopia/attendance/summarize";
import { BackupControls } from "./BackupControls";

type ListMode = "heard" | "unheard";

/** ② 내 참전 기록 — 숫자 요약, 들은 곡/못 들은 곡 목록, 백업·복원. */
export function AttendanceResult({
  summary,
  attended,
  ready,
  onRestore,
  onGoPick,
}: {
  summary: AttendanceSummary;
  attended: ReadonlySet<string>;
  ready: boolean;
  onRestore: (ids: string[]) => void;
  onGoPick: () => void;
}) {
  const [mode, setMode] = useState<ListMode>("heard");

  if (!ready) return null;

  const stats = [
    { label: "간 공연", value: summary.attendedCount },
    { label: "들은 곡", value: summary.heard.length },
    { label: "못 들은 곡", value: summary.unheard.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-0.5">
            <dt className="text-sm text-white/60">{stat.label}</dt>
            <dd
              className={cn(
                "text-2xl font-semibold text-white tabular-nums",
                "tablet:text-3xl",
              )}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {summary.attendedCount === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center">
          <p className={cn("text-base text-white/70", "tablet:text-lg")}>
            아직 체크한 공연이 없어요.
          </p>
          <button
            type="button"
            onClick={onGoPick}
            className={cn(ACTION_BUTTON_CLASS, "px-4 py-2 text-sm")}
          >
            간 공연 고르러 가기
          </button>
        </div>
      ) : (
        <>
          <FilterRow label="목록">
            <FilterChip
              active={mode === "heard"}
              onClick={() => setMode("heard")}
            >
              들은 곡 {summary.heard.length}
            </FilterChip>
            <FilterChip
              active={mode === "unheard"}
              onClick={() => setMode("unheard")}
            >
              못 들은 곡 {summary.unheard.length}
            </FilterChip>
          </FilterRow>

          <ul className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {(mode === "heard" ? summary.heard : summary.unheard).map(
              (song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  count={"count" in song ? (song.count as number) : null}
                />
              ),
            )}
          </ul>
        </>
      )}

      <div className="flex flex-col gap-3">
        <a
          href="/zutopia/songs?lastLive=1"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(LINK_BUTTON_CLASS, "self-start")}
        >
          노래별 마지막 라이브 보러가기
          <ExternalLinkIcon className="size-4" />
        </a>
        <BackupControls attended={attended} onRestore={onRestore} />
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
    <li className="tablet:px-4 flex items-center gap-3 border-b border-white/5 px-3 py-2 last:border-0">
      {song.coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={song.coverSrc}
          alt=""
          loading="lazy"
          className="size-11 shrink-0 rounded bg-black/40 object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="block size-11 shrink-0 rounded bg-white/5"
        />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-base font-medium text-white",
            "tablet:text-lg",
          )}
        >
          {song.title}
        </span>
        <span className="block truncate text-sm text-white/70">
          {secondaryTitle(song)}
        </span>
      </span>
      {count !== null && (
        <span
          className={cn(
            "text-ztmy-magenta shrink-0 text-base font-semibold tabular-nums",
            "tablet:text-lg",
          )}
        >
          ×{count}
        </span>
      )}
    </li>
  );
}
