"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { Setlist, type SetlistSlot } from "@/features/zutopia/lives/Setlist";
import {
  LIVE_SURFACE_CLASS,
  LIVE_TAG_CLASS,
  LIVE_TAG_TONE,
} from "@/features/zutopia/lives/surface";
import { formatDayNumber } from "@/features/zutopia/lives/SongLink";
import type {
  LiveSetlistEntry,
  TourDateEntry,
} from "@/features/zutopia/lives/types";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function parseIsoDate(iso: string): {
  year: string;
  month: string;
  day: string;
  md: string;
  weekday: string;
} {
  const [year, month, day] = iso.split("T")[0].split("-");
  // 시간대 영향 없이 요일만 구하려고 UTC로 만든다.
  const weekday =
    WEEKDAYS[new Date(Date.UTC(+year, +month - 1, +day)).getUTCDay()];
  return { year, month, day, md: `${month}.${day}`, weekday };
}

function formatTourDateLabel(
  start: { month: string; day: string; md: string },
  end: { month: string; day: string; md: string } | null,
): string {
  if (!end) return start.md;
  if (start.month === end.month) {
    return `${start.md}–${end.day}`;
  }
  return `${start.md}–${end.md}`;
}

/**
 * 투어 상세의 공연 일정 — 공연일은 자기 상세 페이지가 없어서, 행을 누르면 그
 * 행 바로 아래에 그날의 세트리스트·포스터를 펼친다(아코디언, 한 번에 하나만).
 * 펼치지 않아도 행 안에 그날만의 선택곡이 보여서 날짜별 차이를 한눈에 비교할
 * 수 있다(공통 곡은 위 TourCommonSetlist에 한 번만). 펼친 내용은 들여쓰고 옅은
 * 면으로 감싸 일정 행과 다른 모양으로 둔다 — 같은 모양이면 일정 행과 세트리스트
 * 행이 이어져 구분이 안 된다.
 */
export function TourDateList({ dates }: { dates: TourDateEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  // 해를 넘기는 투어일 때만 날짜 칸에 연도를 붙인다 — 대부분은 위 티켓의
  // 투어 기간으로 연도가 이미 보인다.
  const showYear =
    new Set(dates.map((date) => date.startDate.slice(0, 4))).size > 1;

  const toggle = (id: string) => {
    const willOpen = openId !== id;
    setOpenId(willOpen ? id : null);
    if (!willOpen) return;
    // 위쪽에 열려 있던 항목이 닫히면 방금 연 행이 화면 밖으로 밀려날 수 있어,
    // 다 그린 뒤 그 행이 보이게 맞춘다.
    requestAnimationFrame(() =>
      itemRefs.current[id]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      }),
    );
  };

  return (
    <ul
      className={cn("flex flex-col gap-1.5 pt-3", "tablet:gap-2 tablet:pt-4")}
    >
      {dates.map((date) => {
        const isOpen = openId === date.id;
        const panelId = `tour-date-${date.id}`;
        return (
          <li
            key={date.id}
            ref={(el) => {
              itemRefs.current[date.id] = el;
            }}
            className="scroll-mt-4"
          >
            <TourDateRow
              date={date}
              showYear={showYear}
              isOpen={isOpen}
              panelId={panelId}
              onClick={() => toggle(date.id)}
            />
            {isOpen && <TourDatePanel id={panelId} date={date} />}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 투어 공통 세트리스트 — 투어 상세에 한 번만, 처음엔 펼쳐 두고 제목 줄을 눌러
 * 접을 수 있다. 공연일마다 다른 곡이 들어가는 번호엔 "선택곡" 줄을 끼워, 그
 * 자리에 실제로 들어간 곡들(공연일 전체에서 모음)을 보여준다. 공통 곡이 없는
 * 투어(공연일마다 전부 다른 구성이거나 아직 데이터가 없음)면 그리지 않는다.
 */
export function TourCommonSetlist({
  entries,
  dates,
}: {
  entries: LiveSetlistEntry[];
  dates: TourDateEntry[];
}) {
  if (entries.length === 0) return null;
  return (
    <Setlist
      title="SETLIST"
      entries={entries}
      slots={collectSelectedSlots(entries, dates)}
      collapsible
    />
  );
}

// 공연일들의 선택곡을 투어 공통 세트리스트의 "선택곡 자리"별로 모은다. 곡마다
// 불린 곳(도시 + 일차)을 함께 모으고, 같은 곡·같은 곳은 한 번만, 처음 나온
// 순서대로.
//
// 자리는 공연일 번호가 아니라 "그날 어느 공통 곡 바로 뒤에 불렸는지"로 정한다 —
// 공통 곡이 공연일마다 다른 번호로 불리면(예: INTENSE 홍콩에선 잔기가 14번)
// 번호만으로는 앞뒤가 틀어진다. 신베이의 저혈볼트는 미러튠(13) 뒤라 14번 자리,
// 홍콩의 거짓이 아니야는 잔기(15) 뒤라 15번 다음 자리가 된다.
// 표시 번호: 그 공통 곡과 다음 공통 곡 사이에 빈 번호가 있으면 그 번호, 없으면
// "15-1"처럼 앞 공통 곡 번호에 순번을 붙인다.
function collectSelectedSlots(
  common: LiveSetlistEntry[],
  dates: TourDateEntry[],
): SetlistSlot[] {
  const commonNumberBySong = new Map(
    common.map((entry) => [entry.songId, entry.trackNumber]),
  );
  const commonNumbers = [...new Set(common.map((e) => e.trackNumber))].sort(
    (a, b) => a - b,
  );
  // anchor(앞 공통 곡 번호, 맨 앞이면 0) 뒤 자리의 정렬 위치·표시 번호.
  // 그 곡의 공연일 번호가 anchor와 다음 공통 곡 사이의 빈 번호이고 아직 안
  // 쓰였으면 그 번호(서울 둘째날 Ham 9번 → 9번), 아니면 남은 빈 번호 중 첫 번째,
  // 빈 번호가 다 차면 "15-1"처럼 anchor에 순번을 붙인다.
  const positionOf = (anchor: number, own: number, used: Set<number>) => {
    const next = commonNumbers.find((n) => n > anchor) ?? Infinity;
    const gaps: number[] = [];
    for (let n = anchor + 1; n < next && n <= anchor + 50; n++) gaps.push(n);
    const free = gaps.filter((n) => !used.has(n));
    const number = free.includes(own) ? own : free[0];
    if (number != null) {
      used.add(number);
      return { trackNumber: number, label: String(number).padStart(2, "0") };
    }
    let extra = 1;
    while (used.has(anchor + extra / 100)) extra += 1;
    used.add(anchor + extra / 100);
    return {
      trackNumber: anchor + extra / 100,
      label: `${String(anchor).padStart(2, "0")}-${extra}`,
    };
  };

  const slots = new Map<string, SetlistSlot>();
  for (const date of dates) {
    // 일차(첫째날·둘째날)마다 따로 — 같은 자리에 날마다 다른 곡이 들어간다.
    const days = new Set(date.setlist.map((e) => String(e.dayNumber ?? "all")));
    for (const day of days) {
      const ordered = date.setlist
        .filter((e) => e.dayNumber == null || String(e.dayNumber) === day)
        .sort(
          (a, b) =>
            Number(a.isEncore) - Number(b.isEncore) ||
            a.trackNumber - b.trackNumber,
        );
      let anchor = 0;
      const used = new Set<number>();
      for (const entry of ordered) {
        const commonNumber = commonNumberBySong.get(entry.songId);
        if (!entry.isSelected && commonNumber != null) {
          anchor = commonNumber;
          continue;
        }
        if (!entry.isSelected) continue;
        // 날마다 같은 선택곡(일차 없음)은 "all"에서 한 번만, 날짜별 선택곡은 그날에서.
        if (day === "all" ? entry.dayNumber != null : entry.dayNumber == null)
          continue;
        const { trackNumber, label } = positionOf(
          anchor,
          entry.trackNumber,
          used,
        );
        const slot = slots.get(label) ?? {
          trackNumber,
          label,
          isEncore: entry.isEncore,
          songs: [],
        };
        slots.set(label, slot);
        let song = slot.songs.find((item) => item.title === entry.titleKo);
        if (!song) {
          song = { title: entry.titleKo, places: [] };
          slot.songs.push(song);
        }
        const place =
          entry.dayNumber != null
            ? `${date.city} ${formatDayNumber(entry.dayNumber)}`
            : date.city;
        if (!song.places.includes(place)) song.places.push(place);
      }
    }
  }
  return [...slots.values()];
}

/**
 * 공연일 행 바로 아래 펼침 — 공연 상세 페이지와 같은 노출 방식: 포스터는 크게,
 * 아이콘(포스터와 다를 때)·추가 이미지는 작은 이미지 목록, 그 아래 그날 전체
 * 세트리스트.
 */
function TourDatePanel({ id, date }: { id: string; date: TourDateEntry }) {
  const showIcon =
    !!date.iconImageUrl &&
    date.iconImageUrl !== date.posterImageUrl &&
    !date.additionalImageUrls.includes(date.iconImageUrl);
  const images = [
    ...(showIcon && date.iconImageUrl
      ? [
          {
            src: date.iconImageUrl,
            alt: `${date.date} ${date.venue} 아이콘 이미지`,
          },
        ]
      : []),
    ...date.additionalImageUrls.map((url, i) => ({
      src: url,
      alt: `${date.date} ${date.venue} 추가 이미지 ${i + 1}`,
    })),
  ];

  return (
    <div
      id={id}
      className={cn(
        // 들여써서 일정 행과 구분한다. 세트리스트는 자기 카드 면(Setlist)이 있다.
        "mt-2 ml-3 flex flex-col gap-3",
        "tablet:ml-6",
      )}
    >
      {date.posterImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={date.posterImageUrl}
          alt={`${date.date} ${date.venue} 포스터`}
          loading="lazy"
          className="max-h-[50vh] max-w-full self-center rounded-lg object-contain"
        />
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ZoomableImageGroup
            images={images}
            thumbnailWidth={72}
            thumbnailHeight={72}
          />
        </div>
      )}
      {date.setlist.length > 0 ? (
        <Setlist entries={date.setlist} />
      ) : (
        <p className={cn("text-sm text-white/50", "tablet:text-base")}>
          세트리스트가 곧 업데이트됩니다.
        </p>
      )}
    </div>
  );
}

/**
 * 공연 일정 한 줄 — 썸네일이 주인공. 왼쪽에 공연일 그림(아이콘, 없으면 포스터)을
 * 세로 3:4로 크게 두고, 날짜는 그림 아래쪽에 얹는다. 그림이 없는 공연일은 같은
 * 자리에 날짜 칸만(같은 폭이라 목록 정렬이 흐트러지지 않는다). 오른쪽은 도시·
 * 장소·그날의 선택곡. 한국 공연은 마젠타 "내한" 태그로 강조한다.
 */
function TourDateRow({
  date,
  showYear,
  isOpen,
  panelId,
  onClick,
}: {
  date: TourDateEntry;
  showYear: boolean;
  isOpen: boolean;
  panelId: string;
  onClick: () => void;
}) {
  const thumbnail = date.iconImageUrl ?? date.posterImageUrl;
  // 그날에만 있는 곡(투어 공통 세트리스트에 없는 선택곡) — 펼치지 않아도 보인다.
  const selectedSongs = date.setlist.filter((entry) => entry.isSelected);
  const start = parseIsoDate(date.startDate);
  const end =
    date.endDate && date.endDate !== date.startDate
      ? parseIsoDate(date.endDate)
      : null;
  const isKorea = date.country === "한국";
  const dateLabel = formatTourDateLabel(start, end);

  const yearLabel = showYear
    ? end && start.year !== end.year
      ? `${start.year}–${end.year}`
      : start.year
    : null;
  const weekdayLabel = end ? `${start.weekday}–${end.weekday}` : start.weekday;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className={cn(
        "group flex w-full items-stretch overflow-hidden rounded-lg border text-left transition-colors",
        // 배경 그림 위에서도 읽히게 어두운 면 + 흐림(LIVE_SURFACE_CLASS).
        LIVE_SURFACE_CLASS,
        isOpen
          ? "border-ztmy-pink/60 bg-black/70"
          : "hover:border-white/25 hover:bg-black/65",
      )}
    >
      {/* 왼쪽 썸네일 칸 — 그림이 있으면 3:4로 크게 + 아래에 날짜, 없으면 날짜 칸. */}
      <span
        className={cn(
          "relative flex w-24 shrink-0 flex-col items-center justify-center overflow-hidden border-r border-white/10",
          "tablet:w-32",
          thumbnail ? "aspect-[3/4] self-start" : "min-h-24 bg-white/[0.03]",
        )}
      >
        {thumbnail ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* 그림 위 날짜가 읽히게 아래에서 위로 어두워지는 막 */}
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/85 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex flex-col items-center px-1 pb-1.5">
              <DateText
                label={dateLabel}
                weekday={weekdayLabel}
                year={yearLabel}
                long={!!end && start.month !== end.month}
              />
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center px-1 py-3">
            <DateText
              label={dateLabel}
              weekday={weekdayLabel}
              year={yearLabel}
              long={!!end && start.month !== end.month}
            />
          </span>
        )}
      </span>

      <span
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-3",
          "tablet:px-5",
        )}
      >
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span
            className={cn(
              "text-base font-semibold transition-colors",
              "tablet:text-xl",
              isOpen
                ? "text-ztmy-pink"
                : "group-hover:text-ztmy-pink text-white",
            )}
          >
            {date.city}
          </span>
          {date.cityOriginal && (
            <span className={cn("text-xs text-white/55", "tablet:text-sm")}>
              {date.cityOriginal}
            </span>
          )}
          {isKorea && (
            <span className={cn(LIVE_TAG_CLASS, LIVE_TAG_TONE.visit)}>
              내한
            </span>
          )}
        </span>
        <span
          className={cn("truncate text-sm text-white/75", "tablet:text-base")}
        >
          <VenueText venue={date.venue} />
        </span>
        {selectedSongs.length > 0 && (
          <span
            className={cn(
              "mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs",
              "tablet:text-sm",
            )}
          >
            <span className={cn(LIVE_TAG_CLASS, LIVE_TAG_TONE.selected)}>
              선택곡
            </span>
            {selectedSongs.map((entry, index) => (
              <span
                key={`${entry.songId}-${entry.dayNumber ?? "all"}`}
                className="whitespace-nowrap text-white/80"
              >
                {entry.titleKo}
                {/* 구분점은 앞 곡 끝에 붙여 줄바꿈돼도 새 줄 맨 앞에 오지 않게. */}
                {index < selectedSongs.length - 1 && (
                  <span className="ml-1.5 text-white/30">·</span>
                )}
              </span>
            ))}
          </span>
        )}
      </span>

      <span className="flex shrink-0 items-center pr-3">
        <ChevronLeftIcon
          className={cn(
            "h-3.5 w-3.5 text-white/30 transition-[transform,color] group-hover:text-white/70",
            isOpen ? "rotate-90" : "-rotate-90",
          )}
        />
      </span>
    </button>
  );
}

/** 썸네일 칸의 날짜(MM.DD + 요일, 해를 넘기는 투어면 연도). */
function DateText({
  label,
  weekday,
  year,
  long,
}: {
  label: string;
  weekday: string;
  year: string | null;
  /** 달을 넘기는 기간("03.28–04.02")처럼 긴 날짜는 한 단계 작게. */
  long: boolean;
}) {
  return (
    <>
      {year && <span className="font-mono text-xs text-white/60">{year}</span>}
      <span
        className={cn(
          "text-center font-mono font-bold tracking-tight whitespace-nowrap text-white tabular-nums drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]",
          long ? "tablet:text-sm text-xs" : "tablet:text-base text-sm",
        )}
      >
        {label}
      </span>
      <span className="font-mono text-xs font-medium tracking-[0.15em] text-white/70">
        {weekday}
      </span>
    </>
  );
}

/**
 * 장소 이름 — 도시 이름과 같은 방식으로 한글명(괄호 안)을 먼저 크게, 원어를 뒤에
 * 작고 흐리게. live_venue는 "日本武道館 (일본무도관)"처럼 원어 뒤 괄호에 한글명이
 * 붙는다. 괄호가 없으면 그대로 한 덩어리.
 */
function VenueText({ venue }: { venue: string }) {
  const match = venue.match(/^(.*\S)\s*\(([^()]*)\)\s*$/);
  if (!match) return <>{venue}</>;
  return (
    <>
      {match[2]}
      <span className="ml-1.5 text-[0.85em] opacity-60">{match[1]}</span>
    </>
  );
}
