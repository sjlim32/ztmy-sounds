"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ThumbImage } from "@/components/ThumbImage";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FOCUS_RING,
  SOFT_BUTTON_CLASS,
  SOFT_PURPLE_BUTTON_CLASS,
} from "@/components/button-styles";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { Popover } from "@/components/Popover";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import { formatDateWithWeekday } from "./date-format";
import { formatDayShow } from "@/features/zutopia/lives/shows";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import { secondaryTitle } from "@/features/zutopia/song-db/song-title";
import type {
  AttendanceSong,
  AttendanceSummary,
} from "@/features/zutopia/attendance/summarize";

type ListMode = "heard" | "unheard";

/**
 * 참전 기록 — 성불(라이브로 들은 곡, 많이 들은 순) / 성불 대기(아직 못 들은
 * 곡, 발매일 순) 목록. 태블릿 2열, PC 3열. 숫자 요약은 페이지 위 현황 막대에 있다.
 * 두 목록 고르기는 목록 카드 머리의 두 칸 탭(이름 + 큰 숫자) — 필터라기보다
 * 목록 자체를 바꾸는 것이라 필터 카드 대신 카드 머리에 붙였다. 옆에 지금 목록의
 * 정렬 기준 한 줄과 "노래별 마지막 라이브" 바로가기 버튼. 성불한 곡을 누르면 그
 * 곡을 들은 공연일 목록을 행 밑 팝오버로 띄운다(목록 배치는 그대로, 한 번에 하나).
 */
export function AttendanceResult({
  summary,
  units,
  liveCounts,
  ready,
  onOpenPicker,
}: {
  units: LiveUnit[];
  /** 곡 id → 전체 라이브 횟수(성불 대기 곡이 라이브에서 불린 적 있는지 보여 주기) */
  liveCounts: Readonly<Record<string, number>>;
  summary: AttendanceSummary;
  ready: boolean;
  onOpenPicker: () => void;
}) {
  const [mode, setMode] = useState<ListMode>("heard");
  // 들은 공연일 팝오버가 열린 곡(한 번에 하나만)
  const [openSongId, setOpenSongId] = useState<string | null>(null);
  const closeSong = useCallback(() => setOpenSongId(null), []);

  if (!ready) return null;

  if (summary.attendedCount === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 px-4 py-8 text-center",
          ZUTOPIA_SURFACE_CLASS,
        )}
      >
        <p className={cn("text-base text-white/70", "tablet:text-lg")}>
          아직 체크한 공연이 없어요. 다녀온 공연일을 체크하면 라이브로 들은
          곡(성불)과 아직 못 들은 곡(성불 대기)을 모아 보여 줘요.
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

  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const list: (AttendanceSong & { count?: number; unitIds?: string[] })[] =
    mode === "heard" ? summary.heard : summary.unheard;

  const modes = [
    {
      key: "heard",
      label: "성불",
      count: summary.heard.length,
      note: "라이브로 들은 곡 · 많이 들은 순",
    },
    {
      key: "unheard",
      label: "성불 대기",
      count: summary.unheard.length,
      note: "아직 못 들은 곡 · 발매일 순",
    },
  ] as const;
  const current = modes.find((item) => item.key === mode)!;

  return (
    // 팝오버가 카드 밖으로 나갈 수 있게 overflow는 두지 않는다.
    <div className={ZUTOPIA_SURFACE_CLASS}>
      {/* 카드 머리 — 두 칸 탭(이름 + 큰 숫자), 옆에 지금 목록 설명과 바로가기.
          태블릿 이상은 한 줄, 모바일은 탭이 폭을 채우고 그 아래 한 줄. */}
      <div className="tablet:flex-row tablet:items-center tablet:gap-4 tablet:px-4 flex flex-col gap-2 border-b border-white/10 px-3 py-3">
        <div
          role="group"
          aria-label="목록 고르기"
          className="tablet:inline-grid tablet:w-auto grid w-full grid-cols-2 gap-1 rounded-lg bg-white/5 p-1"
        >
          {modes.map((item) => {
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setMode(item.key);
                  setOpenSongId(null);
                }}
                className={cn(
                  "tablet:px-4 flex h-11 items-center justify-center gap-2 rounded-md px-3 transition-colors",
                  FOCUS_RING,
                  active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="text-base font-semibold whitespace-nowrap">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    active && item.key === "heard"
                      ? "text-ztmy-magenta"
                      : active
                        ? "text-white"
                        : "text-white/45",
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
        {/* 모바일은 설명이 잘리지 않게 버튼을 다음 줄로 넘긴다. */}
        <div className="tablet:flex-1 tablet:flex-nowrap flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="tablet:truncate min-w-0 text-sm break-keep text-white/60">
            {current.note}
          </p>
          <a
            href="/zutopia/songs?lastLive=1"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(SOFT_BUTTON_CLASS, "h-9 shrink-0 py-0")}
          >
            노래별 마지막 라이브
            <ExternalLinkIcon className="size-3.5 text-white/60" />
          </a>
        </div>
      </div>

      <div key={mode} className="animate-content-in">
        <ul
          className={cn(
            // 많이 들은 순·발매일 순이 위→아래로 이어지게 columns(가로 Z자 아님).
            // 곡을 펼쳐도 그 칸만 길어진다.
            "gap-x-6 px-3 py-1",
            "tablet:columns-2 tablet:px-4",
            "pc:columns-3",
          )}
        >
          {list.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              count={song.count ?? null}
              liveCount={liveCounts[song.id] ?? 0}
              open={openSongId === song.id}
              onToggle={() =>
                setOpenSongId((current) =>
                  current === song.id ? null : song.id,
                )
              }
              onClose={closeSong}
              heardIn={(song.unitIds ?? []).flatMap((id) => {
                const unit = unitsById.get(id);
                return unit ? [unit] : [];
              })}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SongRow({
  song,
  count,
  liveCount,
  heardIn,
  open,
  onToggle,
  onClose,
}: {
  song: AttendanceSong;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  count: number | null;
  /** 전체 라이브 횟수 — 성불 대기 곡 오른쪽에 "라이브 N회"/"라이브 기록 없음" */
  liveCount: number;
  /** 이 곡을 들은 공연일(최신 먼저). 성불 대기 곡은 빈 목록. */
  heardIn: LiveUnit[];
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  // PC에서 창이 글자 길이만큼 넓어지면 오른쪽 칸에선 화면 밖으로 나갈 수 있다 —
  // 넘치면 행의 오른쪽 끝에 맞춘다(창은 닫히면 사라지므로 열 때마다 새로 잰다).
  useLayoutEffect(() => {
    if (!open) return;
    const popover =
      rowRef.current?.querySelector<HTMLElement>('[role="dialog"]');
    if (!popover) return;
    if (popover.getBoundingClientRect().right > window.innerWidth - 16) {
      popover.style.left = "auto";
      popover.style.right = "0";
    }
  }, [open]);
  const body = (
    <>
      {song.coverSrc ? (
        <ThumbImage
          src={song.coverSrc}
          displayWidth={40}
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
      {count === null && (
        <span className="shrink-0 text-sm text-white/55">
          {liveCount > 0 ? `전체 라이브 ${liveCount}회` : "라이브 기록 없음"}
        </span>
      )}
      {count !== null && (
        <span className="flex shrink-0 items-center gap-1 text-base font-semibold text-white/90 tabular-nums">
          ×{count}
          <ChevronDownIcon
            className={cn(
              "size-4 text-white/50 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      )}
    </>
  );

  // 성불 대기 곡 — 누르면 곡 상세(라이브 기록 표)로.
  if (heardIn.length === 0)
    return (
      <li className="min-w-0 break-inside-avoid border-b border-white/5">
        <Link
          href={`/zutopia/songs?song=${song.slug}`}
          className={cn(
            "flex min-w-0 items-center gap-3 rounded-md py-2 transition-colors hover:bg-white/5",
            FOCUS_RING,
          )}
        >
          {body}
        </Link>
      </li>
    );

  // 성불한 곡 — 누르면 들은 공연일 목록(최신 먼저)을 행 바로 밑 팝오버로 띄운다.
  // 목록 안에서 펼치지 않아 다른 행·칸 배치가 그대로다.
  return (
    <li
      ref={rowRef}
      className="relative min-w-0 break-inside-avoid border-b border-white/5"
    >
      <button
        type="button"
        data-popover-trigger
        aria-expanded={open}
        onClick={onToggle}
        className={cn(
          "flex w-full min-w-0 items-center gap-3 rounded-md py-2 text-left transition-colors hover:bg-white/5",
          open && "bg-white/10",
          FOCUS_RING,
        )}
      >
        {body}
      </button>
      <Popover
        open={open}
        onClose={onClose}
        label={`${song.title} 들은 공연`}
        // 모바일은 행 폭에 맞춰 줄바꿈, PC는 글자 길이만큼 넓혀 한 줄로 전부.
        className="pc:w-max pc:min-w-full pc:max-w-[min(40rem,calc(100vw-2rem))] left-0 mt-1 w-full p-2"
      >
        <p className="px-2 pt-1 pb-2 text-sm text-white/60">
          들은 공연 {heardIn.length}회 · 최신 순
        </p>
        <ol className="flex flex-col">
          {heardIn.map((unit) => {
            const content = (
              <>
                <span className="block font-mono text-sm text-white/60">
                  {formatDateWithWeekday(unit.date)}
                </span>
                <span className="pc:whitespace-nowrap block text-sm break-keep text-white/90">
                  {unit.titleKo ?? unit.title}
                  {(unit.city || unit.dayNumber || unit.showLabel) && (
                    <span className="text-white/50">
                      {" · "}
                      {[
                        unit.city,
                        formatDayShow(unit.dayNumber, unit.showLabel),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={unit.id} className="min-w-0">
                {unit.href ? (
                  <Link
                    href={unit.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 transition-colors hover:bg-white/10",
                      FOCUS_RING,
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="px-2 py-1.5">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </Popover>
    </li>
  );
}
