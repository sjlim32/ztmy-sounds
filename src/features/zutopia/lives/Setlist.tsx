"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { SongLink, songRowTint } from "@/features/zutopia/lives/SongLink";
import { setlistSongCount } from "@/features/zutopia/lives/medley";
import type { SetlistChangeNote } from "@/features/zutopia/lives/setlist-diff";
import { secondaryTitle } from "@/features/zutopia/song-db/song-title";
import {
  LIVE_SURFACE_CLASS,
  LIVE_TAG_CLASS,
  LIVE_TAG_TONE,
} from "@/features/zutopia/lives/surface";
import type {
  LiveMedleySong,
  LiveSetlistEntry,
} from "@/features/zutopia/lives/types";

/**
 * 투어 공통 세트리스트의 "선택곡" 자리 — 공연일마다 다른 곡이 들어가는 번호.
 * songs는 그 자리에 실제로 들어간 곡들과, 곡마다 불린 곳(도시, 일차가 있으면
 * "서울 DAY 1"처럼)을 공연일 전체에서 모은 것.
 */
export interface SetlistSlot {
  /** 정렬용 위치 — 공통 곡 사이의 빈 번호, 빈 번호가 없으면 15.1처럼 소수. */
  trackNumber: number;
  /** 번호 칸 표시("14", "15-1"). */
  label: string;
  isEncore: boolean;
  songs: {
    title: string;
    places: string[];
    unreleased: boolean;
    /** 곡 커버(없으면 null — 화면에서 물음표 그림) */
    cover: string | null;
  }[];
}

type SetlistRow =
  | { kind: "song"; entry: LiveSetlistEntry }
  | { kind: "slot"; slot: SetlistSlot };

/**
 * 공연 상세·투어 공통 세트리스트·투어 공연일 펼침이 함께 쓰는 세트리스트 카드.
 * - title: 제목 줄 문구(기본 "세트리스트").
 * - collapsible: 제목 줄을 눌러 목록을 접고 펼 수 있다(처음 상태는 defaultOpen, 기본 펼침).
 * - slots: 공통 세트리스트의 선택곡 자리 — 곡 사이 번호 순서대로 끼워 넣는다.
 * - toolbar: 펼쳤을 때 제목 줄과 목록 사이에 두는 것(투어 세트리스트 판 고르기 등).
 * - plain: 카드 면·테두리 없이 목록만(이미 어두운 면 안에 놓일 때 — 공연일 펼침).
 * - changes: 다른 판과 달라진 곡 — 그 곡 제목 아래 변동 줄로 보여 준다.
 */
export function Setlist({
  entries,
  title = "SETLIST",
  collapsible = false,
  defaultOpen = true,
  slots = [],
  toolbar = null,
  plain = false,
  changes = [],
}: {
  entries: LiveSetlistEntry[];
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  slots?: SetlistSlot[];
  toolbar?: ReactNode;
  plain?: boolean;
  changes?: SetlistChangeNote[];
}) {
  const [isOpen, setOpen] = useState(defaultOpen);
  const rows: SetlistRow[] = [
    ...entries.map((entry) => ({ kind: "song" as const, entry })),
    ...slots.map((slot) => ({ kind: "slot" as const, slot })),
  ].sort((a, b) => {
    const ka = a.kind === "song" ? a.entry : a.slot;
    const kb = b.kind === "song" ? b.entry : b.slot;
    return (
      Number(ka.isEncore) - Number(kb.isEncore) ||
      ka.trackNumber - kb.trackNumber
    );
  });
  const songCount = setlistSongCount(entries) + slots.length;
  const changeFor = (entry: LiveSetlistEntry) =>
    changes.find(
      (item) =>
        item.songId === entry.songId && item.isEncore === entry.isEncore,
    ) ?? null;

  const heading = (
    <>
      <span
        className={cn(
          "flex items-center gap-1.5 text-base font-semibold text-white",
          "tablet:text-lg",
        )}
      >
        {title}
        {collapsible && (
          <ChevronLeftIcon
            className={cn(
              "h-3.5 w-3.5 text-white/60 transition-transform group-hover:text-white",
              isOpen ? "rotate-90" : "-rotate-90",
            )}
          />
        )}
      </span>
      <span className={cn("font-mono text-xs text-white/60", "tablet:text-sm")}>
        {songCount} songs
      </span>
    </>
  );
  const headingClass = cn(
    "flex w-full items-baseline justify-between text-left",
    plain ? "py-2" : "px-4 py-3",
    isOpen && "border-b border-white/10",
  );

  return (
    <section
      className={cn("w-full", !plain && cn(LIVE_SURFACE_CLASS, "rounded-lg"))}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((open) => !open)}
          aria-expanded={isOpen}
          className={cn(headingClass, "group")}
        >
          {heading}
        </button>
      ) : (
        <div className={headingClass}>{heading}</div>
      )}
      {isOpen && toolbar}
      {isOpen && (
        <ul className="flex flex-col divide-y divide-white/10">
          {rows.map((row) =>
            row.kind === "song" && row.entry.medley ? (
              <li
                key={`medley-${row.entry.trackNumber}-${row.entry.dayNumber ?? "all"}-${row.entry.showNumber ?? "all"}`}
              >
                <MedleyRows
                  entry={row.entry}
                  songs={row.entry.medley}
                  change={changeFor(row.entry)}
                />
              </li>
            ) : row.kind === "song" ? (
              <li
                key={`${row.entry.trackNumber}-${row.entry.dayNumber ?? "all"}-${row.entry.showNumber ?? "all"}-${row.entry.songId}`}
              >
                <SongLink
                  href={row.entry.guideHref}
                  change={changeFor(row.entry)}
                  index={row.entry.trackNumber}
                  dayNumber={row.entry.dayNumber}
                  showLabel={row.entry.showLabel}
                  arrange={row.entry.arrange}
                  info={row.entry.info}
                  variation={row.entry.variation}
                  unreleased={row.entry.unreleased}
                  cover={row.entry.isCover}
                  artwork={row.entry.cover}
                  // 커버곡은 제목 하나뿐이라 둘째 줄에 원곡 아티스트를.
                  subtitle={
                    row.entry.isCover
                      ? row.entry.coverArtist
                        ? `원곡 ${row.entry.coverArtist}`
                        : null
                      : secondaryTitle(row.entry)
                  }
                  encore={row.entry.isEncore}
                  selected={row.entry.isSelected}
                >
                  {row.entry.title}
                  {/* 커버곡은 한글 제목이 아래 줄이 아니라 제목 오른쪽 괄호에 */}
                  {row.entry.isCover &&
                    row.entry.titleKo !== row.entry.title && (
                      <span className="ml-1.5 font-normal text-white/70">
                        ({row.entry.titleKo})
                      </span>
                    )}
                </SongLink>
              </li>
            ) : (
              <li key={`slot-${row.slot.label}`}>
                {/* 공연일마다 다른 곡이 들어가는 자리 — 그 자리에 들어간 곡마다
                불린 곳(도시)을 함께 보여준다. */}
                <SongLink
                  index={row.slot.trackNumber}
                  indexLabel={row.slot.label}
                  encore={row.slot.isEncore}
                  selected
                  // 그 자리에 들어간 곡들의 커버를 겹쳐서
                  artwork={row.slot.songs.map((song) => song.cover)}
                  // 곡이 하나뿐인 자리면 "미공개"도 오른쪽 태그 자리에(선택곡과 나란히).
                  unreleased={
                    row.slot.songs.length === 1 && row.slot.songs[0].unreleased
                  }
                  wrapTitle
                >
                  <span className="flex flex-col gap-1 py-0.5">
                    {row.slot.songs.map((song) => (
                      <span key={song.title} className="flex flex-col">
                        <span className="flex flex-wrap items-center gap-1.5">
                          {song.title}
                          {/* 여러 곡이 들어간 자리는 곡마다 이름 옆에 */}
                          {song.unreleased && row.slot.songs.length > 1 && (
                            <span
                              className={cn(
                                LIVE_TAG_CLASS,
                                LIVE_TAG_TONE.unreleased,
                              )}
                            >
                              미공개
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-normal text-white/60",
                            "tablet:text-sm",
                          )}
                        >
                          {song.places.join(" · ")}
                        </span>
                      </span>
                    ))}
                  </span>
                </SongLink>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

/**
 * 메들리 한 번호 — 머리 줄(번호·"메들리"·곡 수·태그) 아래에 이어 부른 곡을 순서대로.
 * 곡마다 커버와 응원 가이드가 있고, 앙코르·선택곡 바탕은 묶음 전체에 한 번만 칠한다.
 */
function MedleyRows({
  entry,
  songs,
  change,
}: {
  entry: LiveSetlistEntry;
  songs: LiveMedleySong[];
  change: SetlistChangeNote | null;
}) {
  return (
    <div
      className={cn("pb-1.5", songRowTint(entry.isEncore, entry.isSelected))}
    >
      <SongLink
        index={entry.trackNumber}
        dayNumber={entry.dayNumber}
        showLabel={entry.showLabel}
        arrange={entry.arrange}
        info={entry.info}
        variation={entry.variation}
        encore={entry.isEncore}
        selected={entry.isSelected}
        medleyPart="head"
        change={change}
      >
        <span className="font-semibold">메들리</span>
        <span className="ml-1.5 text-sm text-white/55">{songs.length}곡</span>
      </SongLink>
      <ol>
        {songs.map((song, index) => (
          <li key={`${song.songId}-${index}`}>
            <SongLink
              href={song.guideHref}
              index={entry.trackNumber}
              indexLabel=""
              artwork={song.cover}
              subtitle={secondaryTitle(song)}
              unreleased={song.unreleased}
              encore={entry.isEncore}
              selected={entry.isSelected}
              medleyPart="song"
            >
              {song.title}
            </SongLink>
          </li>
        ))}
      </ol>
    </div>
  );
}
