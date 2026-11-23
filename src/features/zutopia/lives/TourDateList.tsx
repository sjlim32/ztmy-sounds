"use client";

import { useRef, useState, type ReactNode } from "react";
import { ThumbImage } from "@/components/ThumbImage";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { Setlist, type SetlistSlot } from "@/features/zutopia/lives/Setlist";
import {
  CANCELED_TEXT_CLASS,
  LIVE_SECTION_TITLE_SHADOW,
  LIVE_SURFACE_CLASS,
  LIVE_TAG_CLASS,
  LIVE_TAG_TONE,
} from "@/features/zutopia/lives/surface";
import { formatDayShow } from "@/features/zutopia/lives/shows";
import { groupTourDates } from "@/features/zutopia/lives/date-groups";
import { setlistSongCount } from "@/features/zutopia/lives/medley";
import { FOCUS_RING } from "@/components/button-styles";
import type {
  LiveSetlistEntry,
  TourDateEntry,
  TourSetlistVersion,
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
 * "공연 일정" 구역 — 제목 줄(일정 수) + 공연일 목록(TourDateList). 투어 상세와,
 * 이틀 이상인 단독 공연 상세(DAY별로 나눈 일정, lives/live-days.ts)가 같이 쓴다.
 * 공연일이 아직 없으면 안내 문구만.
 */
export function LiveSchedule({ dates }: { dates: TourDateEntry[] }) {
  return (
    <section className="w-full">
      {/* 카드 밖 제목이라 배경 그림 위에서도 읽히게 글자 그림자 */}
      <div
        className={cn(
          "flex items-baseline justify-between gap-3 border-b border-white/15 pb-2",
          "tablet:pb-3",
          LIVE_SECTION_TITLE_SHADOW,
        )}
      >
        <p
          className={cn("text-base font-semibold text-white", "tablet:text-lg")}
        >
          공연 일정
        </p>
        {/* 취소된 공연일은 세지 않는다(일정엔 취소선으로 남는다). */}
        <p className={cn("font-mono text-sm text-white/60")}>
          {dates.filter((date) => !date.canceled).length} dates
        </p>
      </div>

      {dates.length > 0 ? (
        <TourDateList dates={dates} />
      ) : (
        <p className={cn("pt-3 text-sm text-white/50", "tablet:text-base")}>
          세부 공연 일정이 곧 업데이트됩니다.
        </p>
      )}
    </section>
  );
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
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
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
    // 공연일마다 카드를 두지 않고, 목록 전체를 어두운 면 하나로(배경 그림 위에서도
    // 읽히게) — 공연일 사이는 얇은 구분선만.
    <ul
      className={cn(
        "mt-3 flex flex-col divide-y divide-white/10 overflow-hidden rounded-lg",
        "tablet:mt-4",
        LIVE_SURFACE_CLASS,
      )}
    >
      {groupTourDates(dates).map((group) => {
        // 하루 공연도 연달은 공연도 같은 모양 — 도시 머리 하나 + 날짜 줄(하루면 한 줄).
        const indent = group.some(
          (date) => date.iconImageUrl ?? date.posterImageUrl,
        );
        return (
          <li key={group[0].id} className="pb-1.5">
            <TourDateGroupHeader
              dates={group}
              isOpen={group.some((date) => date.id === openId)}
            />
            {group.map((date) => {
              const isOpen = openId === date.id;
              const panelId = `tour-date-${date.id}`;
              return (
                <div
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
                    indent={indent}
                  />
                  {isOpen && <TourDatePanel id={panelId} date={date} />}
                </div>
              );
            })}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 투어 공통 세트리스트 — 투어 상세에 한 번만, 처음엔 접어 두고("투어 세트리스트 한
 * 눈에 보기") 제목 줄을 눌러 펼친다. 공연일마다 다른 곡이 들어가는 번호엔 "선택곡"
 * 줄을 끼워, 그 자리에 실제로 들어간 곡들(공연일 전체에서 모음)을 보여준다. 공통
 * 곡이 없는 투어(공연일마다 전부 다른 구성이거나 아직 데이터가 없음)면 그리지 않는다.
 * toolbar는 펼쳤을 때 제목 아래(판 고르기).
 */
export function TourCommonSetlist({
  entries,
  dates,
  title = "투어 세트리스트 한 눈에 보기",
  toolbar = null,
}: {
  entries: LiveSetlistEntry[];
  dates: TourDateEntry[];
  title?: string;
  toolbar?: ReactNode;
}) {
  if (entries.length === 0) return null;
  return (
    <Setlist
      title={title}
      entries={entries}
      slots={collectSelectedSlots(entries, dates)}
      collapsible
      defaultOpen={false}
      toolbar={toolbar}
    />
  );
}

/**
 * 투어 공통 세트리스트를 판(tour_setlist_versions)마다 — 판이 하나면 지금처럼 하나,
 * 둘 이상이면 펼친 카드 안 제목 아래에 판 고르기 탭(같은 폭으로 나란히: 이름 + 그 판
 * 공연일의 첫–마지막 도시·횟수)을 두고 고른 판의 세트리스트를 보여 준다. 이름은 판에
 * 적은 이름(label), 없으면 versionName의 기본 이름(전반기·후반기). 판을 바꿔도 펼친
 * 상태는 그대로다. 선택곡 자리는 그 판을 따른 공연일로만 모은다.
 */
export function TourSetlistVersions({
  versions,
  dates,
}: {
  versions: TourSetlistVersion[];
  dates: TourDateEntry[];
}) {
  const [selectedId, setSelectedId] = useState(versions[0]?.id ?? null);
  const selected =
    versions.find((version) => version.id === selectedId) ?? versions[0];
  if (!selected) return null;
  if (versions.length === 1)
    return <TourCommonSetlist entries={selected.entries} dates={dates} />;

  const tabs = (
    <div className={cn("border-b border-white/10 px-4 py-3", "tablet:px-5")}>
      <div
        role="group"
        aria-label="세트리스트 시기 고르기"
        className={cn(
          "grid gap-2",
          versions.length === 2
            ? "grid-cols-2"
            : "tablet:grid-cols-3 grid-cols-1",
        )}
      >
        {versions.map((version, index) => {
          const active = version.id === selected.id;
          const versionDates = dates.filter(
            (date) => date.versionId === version.id && !date.canceled,
          );
          const cities = versionCities(versionDates);
          return (
            <button
              key={version.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedId(version.id)}
              className={cn(
                "flex min-w-0 flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors",
                FOCUS_RING,
                active
                  ? "border-ztmy-magenta/80 bg-ztmy-magenta/15 text-white"
                  : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/35 hover:text-white",
              )}
            >
              <span className="text-base font-semibold">
                {version.label ?? versionName(index, versions.length)}
              </span>
              <span
                className={cn(
                  "w-full truncate text-sm",
                  active ? "text-white/80" : "text-white/55",
                )}
              >
                {[
                  cities,
                  versionDates.length ? `${versionDates.length}회` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // key 없이 — 판을 바꿔도 펼친 상태(Setlist의 isOpen)를 그대로 둔다.
  return (
    <TourCommonSetlist
      entries={selected.entries}
      dates={dates.filter((date) => date.versionId === selected.id)}
      toolbar={tabs}
    />
  );
}

/** 판의 기본 이름 — 둘이면 전반기·후반기, 셋이면 전반기·중반기·후반기, 그 이상은 "1기"부터. */
function versionName(index: number, count: number) {
  if (count === 2) return ["전반기", "후반기"][index];
  if (count === 3) return ["전반기", "중반기", "후반기"][index];
  return `${index + 1}기`;
}

/**
 * 판을 따른 공연일의 첫 도시–마지막 도시(취소된 공연일은 빼고, 날짜 순). 도시가 하나면
 * 그 도시, 공연일이 없으면 null.
 */
function versionCities(dates: TourDateEntry[]) {
  const held = dates
    .filter((date) => !date.canceled)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (held.length === 0) return null;
  const first = held[0].city;
  const last = held.at(-1)!.city;
  return first === last ? first : `${first}–${last}`;
}

// 공연일들의 선택곡을 투어 공통 세트리스트의 "선택곡 자리"별로 모은다. 곡마다
// 불린 곳(도시 + 일차)을 함께 모으고, 같은 곡·같은 곳은 한 번만, 처음 나온
// 순서대로.
//
// 자리는 공연일 번호가 아니라 "그날 그때까지 부른 공통 곡 중 가장 큰 번호 뒤"로 정한다 —
// 공통 곡이 공연일마다 다른 번호로 불리면(예: INTENSE 홍콩에선 잔기가 14번)
// 번호만으로는 앞뒤가 틀어진다. 신베이의 저혈볼트는 미러튠(13) 뒤라 14번 자리,
// 홍콩의 거짓이 아니야는 잔기(15) 뒤라 15번 다음 자리가 된다.
// 표시 번호: 그 공통 곡과 다음 공통 곡 사이에 빈 번호가 있으면 그 번호, 없으면
// "15-1"처럼 앞 공통 곡 번호에 순번을 붙인다.
export function collectSelectedSlots(
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
          // 그날까지 부른 공통 곡 중 가장 큰 번호 — 공통 곡 둘이 날마다 순서만
          // 바뀌어도(aipega-okinawa DAY 2: 7번 곡 → 6번 곡) 뒤의 선택곡이 앞 자리로
          // 끌려가지 않게 바로 앞 곡이 아니라 최댓값을 기준으로 한다.
          anchor = Math.max(anchor, commonNumber);
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
          song = {
            title: entry.titleKo,
            places: [],
            unreleased: entry.unreleased,
            cover: entry.cover,
          };
          slot.songs.push(song);
        }
        const dayShow = formatDayShow(entry.dayNumber, entry.showLabel);
        const place = dayShow ? `${date.city} ${dayShow}` : date.city;
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
        // 열린 행과 같은 옅은 바탕으로 이어 한 덩어리로(테두리·카드 없이).
        "flex flex-col gap-3 bg-white/[0.05] px-3 pb-4",
        "tablet:px-4",
      )}
    >
      {date.posterImageUrl && (
        // 화면 폭별로 줄인 포스터(srcset) — 원본보다 큰 후보는 원본 크기로 온다.
        <ThumbImage
          src={date.posterImageUrl}
          displayWidth={800}
          sizes={"(max-width: 49.99rem) 100vw, 800px"}
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
        <Setlist entries={date.setlist} plain />
      ) : (
        <p className={cn("text-sm text-white/50", "tablet:text-base")}>
          세트리스트가 곧 업데이트됩니다.
        </p>
      )}
    </div>
  );
}

/**
 * 공연 일정의 날짜 줄 — 도시·공연장·그림은 위 머리(TourDateGroupHeader)에 한 번만
 * 두고, 여기엔 날짜(요일·연도·시각)·DAY·취소 태그와 그날의 선택곡만. 머리에 그림이
 * 있으면 머리의 도시 글자와 같은 줄에 맞춰 들인다. 오른쪽 끝은 그날 곡 수 + 꺾쇠
 * (누르면 그 아래 TourDatePanel에 세트리스트). 펼치면 줄과 펼친 영역이 같은 옅은
 * 바탕으로 이어진다.
 */
function TourDateRow({
  date,
  showYear,
  isOpen,
  panelId,
  onClick,
  indent,
}: {
  date: TourDateEntry;
  showYear: boolean;
  isOpen: boolean;
  panelId: string;
  onClick: () => void;
  /** 묶음 머리에 그림이 있으면 날짜를 머리의 도시 글자 줄에 맞춰 들인다 */
  indent: boolean;
}) {
  // 그날에만 있는 곡(투어 공통 세트리스트에 없는 선택곡) — 펼치지 않아도 보인다.
  const selectedSongs = date.setlist.filter((entry) => entry.isSelected);
  const start = parseIsoDate(date.startDate);
  const end =
    date.endDate && date.endDate !== date.startDate
      ? parseIsoDate(date.endDate)
      : null;
  const yearLabel = showYear
    ? end && start.year !== end.year
      ? `${start.year}–${end.year}`
      : start.year
    : null;
  // 취소된 공연일 — 회색·빨간 취소선, 펼칠 세트리스트가 없어 누를 수 없다.
  const canceled = !!date.canceled;
  const rowClass = cn(
    "group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
    "tablet:gap-4 tablet:px-4",
    // 머리 그림(w-14·w-20) + 간격만큼 들여 도시 글자와 맞춘다.
    indent && "pl-20 tablet:pl-28",
  );

  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <DateLine
            label={formatTourDateLabel(start, end)}
            weekday={end ? `${start.weekday}–${end.weekday}` : start.weekday}
            year={yearLabel}
            startTime={date.startTime}
            openTime={date.openTime}
            canceled={canceled}
          />
          {(date.dayNumber != null || date.showLabel) && (
            // 세트리스트의 DAY 태그와 같은 색(1일차 분홍, 2일차 보라, 이후 반복)
            <span
              className={cn(
                LIVE_TAG_CLASS,
                LIVE_TAG_TONE.day[
                  ((date.dayNumber ?? 1) - 1) % LIVE_TAG_TONE.day.length
                ],
                canceled && "opacity-50",
              )}
            >
              {formatDayShow(date.dayNumber, date.showLabel)}
            </span>
          )}
          {canceled && (
            <span className={cn(LIVE_TAG_CLASS, LIVE_TAG_TONE.canceled)}>
              공연 취소
            </span>
          )}
        </span>

        {selectedSongs.length > 0 && (
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
            <span className={cn(LIVE_TAG_CLASS, LIVE_TAG_TONE.selected)}>
              선택곡
            </span>
            {selectedSongs.map((entry, index) => (
              <span
                key={`${entry.songId}-${entry.dayNumber ?? "all"}-${entry.showNumber ?? "all"}`}
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

      {!canceled && (
        <span className="flex shrink-0 items-center gap-1.5">
          {/* 펼치면 무엇이 나오는지 — 그날 곡 수(세트리스트가 아직 없으면 꺾쇠만) */}
          {date.setlist.length > 0 && (
            <span
              className={cn(
                "text-sm whitespace-nowrap tabular-nums transition-colors",
                isOpen
                  ? "text-white/80"
                  : "text-white/50 group-hover:text-white/80",
              )}
            >
              {setlistSongCount(date.setlist)}곡
            </span>
          )}
          <ChevronLeftIcon
            className={cn(
              "h-3.5 w-3.5 text-white/30 transition-[transform,color] group-hover:text-white/70",
              isOpen ? "rotate-90" : "-rotate-90",
            )}
          />
        </span>
      )}
    </>
  );

  if (canceled) {
    return <div className={rowClass}>{content}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className={cn(
        rowClass,
        isOpen ? "bg-white/[0.05]" : "hover:bg-white/[0.04]",
      )}
    >
      {content}
    </button>
  );
}

/**
 * 공연 일정의 도시 머리 — 같은 도시·공연장에서 연달아 열린 공연일 묶음(하루 공연은
 * 한 날짜짜리 묶음)마다 하나. 목록을 훑는 기준이라 도시만 크고 굵게, 그 옆에 원어
 * 이름·내한 태그, 아래 공연장, 왼쪽에 묶음의 첫 그림(아이콘, 없으면 포스터). 누르는
 * 줄이 아니라 그 아래 날짜 줄(TourDateRow)이 그날 세트리스트를 펼친다. 날짜 줄 하나가
 * 열려 있으면 도시가 분홍색, 묶음 전체가 취소면 회색·취소선.
 */
function TourDateGroupHeader({
  dates,
  isOpen,
}: {
  dates: TourDateEntry[];
  isOpen: boolean;
}) {
  const first = dates[0];
  const thumbnail =
    dates
      .map((date) => date.iconImageUrl ?? date.posterImageUrl)
      .find(Boolean) ?? null;
  const allCanceled = dates.every((date) => date.canceled);
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 px-3 pt-3 pb-1",
        "tablet:gap-4 tablet:px-4",
      )}
    >
      {thumbnail && (
        <span
          className={cn(
            "relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-md bg-white/5",
            "tablet:w-20",
          )}
        >
          <ThumbImage
            src={thumbnail}
            displayWidth={240}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              allCanceled && "opacity-40 grayscale",
            )}
          />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span
            className={cn(
              "text-lg leading-tight font-bold transition-colors",
              "tablet:text-xl",
              allCanceled
                ? CANCELED_TEXT_CLASS
                : isOpen
                  ? "text-ztmy-pink"
                  : "text-white",
            )}
          >
            {first.city}
          </span>
          {first.cityOriginal && (
            <span
              className={cn(
                "text-sm",
                allCanceled ? CANCELED_TEXT_CLASS : "text-white/55",
              )}
            >
              {first.cityOriginal}
            </span>
          )}
          {first.country === "한국" && (
            <span
              className={cn(
                LIVE_TAG_CLASS,
                LIVE_TAG_TONE.visit,
                allCanceled && "opacity-50",
              )}
            >
              내한
            </span>
          )}
        </span>
        <span
          className={cn(
            "truncate text-sm",
            allCanceled ? CANCELED_TEXT_CLASS : "text-white/65",
          )}
        >
          <VenueText venue={first.venue} />
        </span>
      </span>
    </div>
  );
}

/**
 * 날짜 줄의 날짜 — "03.29"(이틀이면 "03.29–30")를 도시보다 한 단계 작게, 옆에 요일,
 * 해를 넘기는 투어면 연도, 회차가 있으면 개장·시작 시각을 작고 흐리게.
 */
function DateLine({
  label,
  weekday,
  year,
  startTime,
  openTime,
  canceled = false,
}: {
  label: string;
  weekday: string;
  year: string | null;
  /** 같은 날 여러 회차 공연의 시작·개장 시각 "HH:MM"(lives.metadata.shows). */
  startTime?: string;
  openTime?: string;
  /** 취소된 공연일 — 회색·빨간 취소선으로. */
  canceled?: boolean;
}) {
  const muted = canceled ? CANCELED_TEXT_CLASS : "text-white/55";
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        className={cn(
          "text-base font-semibold whitespace-nowrap tabular-nums",
          "tablet:text-lg",
          canceled ? CANCELED_TEXT_CLASS : "text-white/90",
        )}
      >
        {label}
      </span>
      <span className={cn("text-sm font-medium tracking-wider", muted)}>
        {weekday}
      </span>
      {year && (
        <span className={cn("text-sm tabular-nums", muted)}>{year}</span>
      )}
      {(startTime || openTime) && (
        <span className={cn("text-sm tabular-nums", muted)}>
          {[openTime && `OPEN ${openTime}`, startTime && `START ${startTime}`]
            .filter(Boolean)
            .join(" / ")}
        </span>
      )}
    </span>
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
