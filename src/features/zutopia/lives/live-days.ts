import { addDays, diffDays } from "@/lib/ymd";
import { displayVenue, splitRegion } from "@/features/zutopia/lives/region";
import { showsForDay } from "@/features/zutopia/lives/shows";
import type {
  LiveDetail,
  LiveSetlistEntry,
  TourDateEntry,
} from "@/features/zutopia/lives/types";

function formatKoreanDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

const byOrder = (a: LiveSetlistEntry, b: LiveSetlistEntry) =>
  Number(a.isEncore) - Number(b.isEncore) || a.trackNumber - b.trackNumber;

/**
 * 투어가 아닌 단독 공연이 여러 번이면(이틀 이상, 또는 하루에 여러 회차 —
 * lives.metadata.shows) 투어 상세와 같은 모양으로 나눈다 — 공연마다 일정 한 줄
 * (DAY 1 昼の部, DAY 1 夜の部, DAY 2 …)과, 모든 공연에 부른 곡을 모은 공통
 * 세트리스트. 공통이 아닌 곡은 그 공연의 "선택곡"(isSelected, 그 공연의 일차·회차)이
 * 되어 일정 행과 공통 세트리스트의 선택곡 자리에 보인다. 페스티벌·한 번뿐인
 * 공연이면 null(지금처럼 세트리스트 하나).
 */
export function splitLiveDays(
  live: LiveDetail,
): { common: LiveSetlistEntry[]; dates: TourDateEntry[] } | null {
  // 페스티벌은 여러 날이어도 즛토마요가 서는 날은 하루(live-history/units.ts와 같은 기준).
  if (live.type === "FESTIVAL") return null;
  // 출연일(live_date)이 있으면 그날 하루.
  const start = (live.live_date ?? live.start_date).slice(0, 10);
  const end = live.live_date
    ? start
    : (live.end_date ?? live.start_date).slice(0, 10);
  const dayCount = diffDays(start, end) + 1;

  // 공연 하나 = (일차, 회차). 회차는 날마다 metadata.shows · 그날 세트리스트의
  // show_number로 정한다(shows.ts). 하루뿐이면 일차는 비우고, 1회뿐인 날은 회차를 비운다.
  const performances = Array.from(
    { length: dayCount },
    (_, i) => i + 1,
  ).flatMap((day) => {
    const shows = showsForDay(
      live.metadata,
      day,
      live.setlist
        .filter((entry) => entry.dayNumber == null || entry.dayNumber === day)
        .map((entry) => entry.showNumber),
    );
    const dayNumber = dayCount > 1 ? day : null;
    if (shows.length === 0)
      return [
        {
          day,
          dayNumber,
          show: null,
          showLabel: null,
          open: null,
          start: null,
        },
      ];
    return shows.map((info) => ({
      day,
      dayNumber,
      show: info.show as number | null,
      showLabel: info.label as string | null,
      open: info.open,
      start: info.start,
    }));
  });
  if (performances.length < 2) return null;

  // 그 공연에 부른 곡 = 일차·회차가 비었거나 그 공연과 같은 곡
  const entriesFor = (p: (typeof performances)[number]) =>
    live.setlist
      .filter(
        (entry) =>
          (entry.dayNumber == null || entry.dayNumber === p.day) &&
          (p.show == null ||
            entry.showNumber == null ||
            entry.showNumber === p.show),
      )
      .sort(byOrder);
  const songSets = performances.map(
    (p) => new Set(entriesFor(p).map((entry) => entry.songId)),
  );
  const commonIds = new Set(
    [...songSets[0]].filter((id) => songSets.every((set) => set.has(id))),
  );
  const asCommon = (entry: LiveSetlistEntry): LiveSetlistEntry => ({
    ...entry,
    dayNumber: null,
    showNumber: null,
    showLabel: null,
    isSelected: false,
  });

  // 공통 세트리스트의 번호는 첫 공연 순서를 따른다.
  const common = entriesFor(performances[0])
    .filter((entry) => commonIds.has(entry.songId))
    .map(asCommon);

  const { city, original } = splitRegion(live.region);
  const dates: TourDateEntry[] = performances.map((p) => {
    const date = addDays(start, p.day - 1);
    return {
      id: `${live.id}:${p.day}:${p.show ?? 1}`,
      date: formatKoreanDate(date),
      startDate: date,
      endDate: null,
      country: live.country,
      city,
      cityOriginal: original,
      region: live.region,
      venue: displayVenue(live.live_venue),
      // 포스터·추가 이미지는 위 공연 대표 그림에 이미 있어서 공연마다 되풀이하지 않는다.
      iconImageUrl: null,
      posterImageUrl: null,
      additionalImageUrls: [],
      ...(p.dayNumber != null && { dayNumber: p.dayNumber }),
      ...(p.showLabel != null && { showLabel: p.showLabel }),
      ...(p.open != null && { openTime: p.open }),
      ...(p.start != null && { startTime: p.start }),
      setlist: entriesFor(p).map((entry) =>
        commonIds.has(entry.songId)
          ? asCommon(entry)
          : {
              ...entry,
              dayNumber: p.dayNumber,
              showNumber: p.show,
              showLabel: p.showLabel,
              isSelected: true,
            },
      ),
    };
  });

  return { common, dates };
}
