"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { SongLink } from "@/features/zutopia/lives/SongLink";
import { LIVE_SURFACE_CLASS } from "@/features/zutopia/lives/surface";
import type { LiveSetlistEntry } from "@/features/zutopia/lives/types";

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
  songs: { title: string; places: string[] }[];
}

type SetlistRow =
  | { kind: "song"; entry: LiveSetlistEntry }
  | { kind: "slot"; slot: SetlistSlot };

/**
 * 공연 상세·투어 공통 세트리스트·투어 공연일 펼침이 함께 쓰는 세트리스트 카드.
 * - title: 제목 줄 문구(기본 "세트리스트").
 * - collapsible: 제목 줄을 눌러 목록을 접고 펼 수 있다(처음엔 펼침).
 * - slots: 공통 세트리스트의 선택곡 자리 — 곡 사이 번호 순서대로 끼워 넣는다.
 */
export function Setlist({
  entries,
  title = "SETLIST",
  collapsible = false,
  slots = [],
}: {
  entries: LiveSetlistEntry[];
  title?: string;
  collapsible?: boolean;
  slots?: SetlistSlot[];
}) {
  const [isOpen, setOpen] = useState(true);
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
  const songCount = entries.length + slots.length;

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
    "flex w-full items-baseline justify-between px-4 py-3 text-left",
    isOpen && "border-b border-white/10",
  );

  return (
    <section className={cn(LIVE_SURFACE_CLASS, "w-full rounded-lg")}>
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
      {isOpen && (
        <ul className="flex flex-col divide-y divide-white/10">
          {rows.map((row) =>
            row.kind === "song" ? (
              <li
                key={`${row.entry.trackNumber}-${row.entry.dayNumber ?? "all"}-${row.entry.songId}`}
              >
                <SongLink
                  href={row.entry.guideHref}
                  index={row.entry.trackNumber}
                  dayNumber={row.entry.dayNumber}
                  arrange={row.entry.arrange}
                  encore={row.entry.isEncore}
                  selected={row.entry.isSelected}
                >
                  {row.entry.title} ({row.entry.titleKo})
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
                  wrapTitle
                >
                  <span className="flex flex-col gap-1 py-0.5">
                    {row.slot.songs.map((song) => (
                      <span key={song.title} className="flex flex-col">
                        <span>{song.title}</span>
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
