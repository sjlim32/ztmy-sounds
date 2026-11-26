import { addDays, diffDays } from "@/lib/ymd";
import {
  extractKoreanCity,
  isOnlineLive,
} from "@/features/zutopia/lives/region";
import { showsForDay } from "@/features/zutopia/lives/shows";
import { parseSetlistNote } from "@/features/zutopia/lives/setlist-note";
import {
  versionForDate,
  type TourVersion,
} from "@/features/zutopia/lives/tour-versions";
import type {
  LiveUnit,
  RawCoverRow,
  RawLive,
  RawTourVersion,
  RawSetlistRow,
  RawTour,
  SongLiveStat,
  StatOnlyUnitField,
} from "./types";

export { addDays };

function daysInclusive(start: string, end: string): number {
  return diffDays(start, end) + 1;
}

function buildAllUnits(input: {
  lives: RawLive[];
  tours: RawTour[];
  setlists: RawSetlistRow[];
  originalOf: Record<string, string>;
  /** 곡이 연결되지 않은 커버곡 행(통계용, 없어도 된다) */
  covers?: RawCoverRow[];
  /** 투어 세트리스트 판 — 없으면(예전 데이터) 투어 공통 행을 모두 한 판으로 */
  versions?: RawTourVersion[];
}): LiveUnit[] {
  const { lives, tours, setlists, originalOf } = input;
  const versionsByTour = new Map<string, TourVersion[]>();
  for (const version of input.versions ?? [])
    push(versionsByTour, version.tour_id, {
      id: version.id,
      startsOn: version.starts_on,
      label: version.label,
      fixed: version.fixed,
    });
  const toursById = new Map(tours.map((tour) => [tour.id, tour]));
  const toursBySlug = new Map(tours.map((tour) => [tour.slug, tour]));

  const tourRows = new Map<string, RawSetlistRow[]>();
  const liveRows = new Map<string, RawSetlistRow[]>();
  for (const row of setlists) {
    if (row.live_id) push(liveRows, row.live_id, row);
    else if (row.tour_id) push(tourRows, row.tour_id, row);
  }
  const tourCovers = new Map<string, RawCoverRow[]>();
  const liveCovers = new Map<string, RawCoverRow[]>();
  for (const row of input.covers ?? []) {
    if (row.live_id) push(liveCovers, row.live_id, row);
    else if (row.tour_id) push(tourCovers, row.tour_id, row);
  }

  const units: LiveUnit[] = [];
  for (const live of lives) {
    const tour =
      (live.tour_id ? toursById.get(live.tour_id) : undefined) ??
      (live.slug ? toursBySlug.get(live.slug) : undefined) ??
      null;
    // 그날의 판(lives/tour-versions.ts — 투어 상세와 같은 규칙)과 그 판의 공통 행.
    // 여러 날 공연은 날마다 고른다(판 경계에 걸친 양일 공연, genso-dodan 4/20·21).
    const versionScope = (date: string) => {
      const version = tour
        ? versionForDate(
            versionsByTour.get(tour.id) ?? [],
            date,
            live.setlist_version_id ?? null,
          )
        : null;
      const inVersion = (row: { version_id?: string | null }) =>
        !version || row.version_id === version.id;
      const common = tour
        ? (tourRows.get(tour.id) ?? []).filter(inVersion)
        : [];
      return { version, inVersion, common };
    };
    type VersionScope = ReturnType<typeof versionScope>;
    // 공연일 행 중 "그날만 빠진 곡"(omitted)은 곡이 아니라 판에서 뺄 표시.
    const allOwn = liveRows.get(live.id) ?? [];
    const own = allOwn.filter((row) => !row.omitted);
    const omits = allOwn.filter((row) => row.omitted);
    const slug = tour?.slug ?? live.slug;

    const base = {
      liveId: live.id,
      type: live.type,
      title: tour?.title ?? live.title,
      titleKo: tour?.title_ko ?? live.title_ko,
      city: extractKoreanCity(live.region),
      tourId: tour?.id ?? null,
      href: slug ? `/zutopia/lives/${slug}` : null,
      imageUrl:
        live.icon_image_url ??
        live.poster_image_url ??
        tour?.poster_image_url ??
        null,
      // 온라인 공연(region·live_venue가 "online") — 참전 기록·통계에선 뺀다(inPersonUnits).
      ...(isOnlineLive(live) && {
        online: true,
      }),
      groupImageUrl: tour
        ? (tour.poster_image_url ??
          live.icon_image_url ??
          live.poster_image_url ??
          null)
        : (live.icon_image_url ?? live.poster_image_url ?? null),
    };
    // day = null(하루 공연)이면 DAY 번호가 붙은 자기 행도 전부 센다. 회차(show)도
    // 같은 규칙 — show_number가 빈 행은 그날 모든 회차에 부른 곡.
    const inUnit =
      (day: number | null, show: number | null) =>
      (row: Pick<RawSetlistRow, "day_number" | "show_number">) =>
        (day === null || row.day_number == null || row.day_number === day) &&
        (show === null || row.show_number == null || row.show_number === show);
    // 같은 곡이 투어 공통·공연일 양쪽에 있으면 공연일 행(그날의 실제 번호)만 쓴다
    // (lives/data.ts mergeTourSetlist와 같은 규칙).
    const rowsFor = (
      { common }: VersionScope,
      day: number | null,
      show: number | null,
    ) => {
      const mine = own.filter(inUnit(day, show));
      const skip = new Set(
        [...mine, ...omits.filter(inUnit(day, show))].map(
          (row) => originalOf[row.song_id] ?? row.song_id,
        ),
      );
      return [
        ...common.filter(
          (row) => !skip.has(originalOf[row.song_id] ?? row.song_id),
        ),
        ...mine,
      ];
    };
    const coverRowsFor = (
      { inVersion }: VersionScope,
      day: number | null,
      show: number | null,
    ) => {
      const ownCovers = liveCovers.get(live.id) ?? [];
      const omittedTitles = new Set(
        ownCovers
          .filter((row) => row.omitted && inUnit(day, show)(row))
          .map((row) => row.title),
      );
      return [
        ...(tour ? (tourCovers.get(tour.id) ?? []) : []).filter(
          (row) => inVersion(row) && !omittedTitles.has(row.title),
        ),
        ...ownCovers.filter((row) => !row.omitted && inUnit(day, show)(row)),
      ];
    };
    const coversFor = (
      scope: VersionScope,
      day: number | null,
      show: number | null,
    ) => {
      const rows = coverRowsFor(scope, day, show);
      const seen = new Set<string>();
      const covers = rows.flatMap((row) =>
        seen.has(row.title)
          ? []
          : (seen.add(row.title),
            [{ title: row.title, titleKo: row.titleKo, artist: row.artist }]),
      );
      return covers.length ? { covers } : {};
    };
    const unitFields = (
      scope: VersionScope,
      day: number | null,
      show: number | null,
    ) => {
      const { version, common } = scope;
      const rows = rowsFor(scope, day, show);
      // 투어 공통 세트리스트만 있고 그날 행(곡·커버곡)이 하나도 없는 공연일 — 그날의
      // 선택곡을 모른다(통계는 세트리스트를 모르는 날로 친다). 고정 세트리스트 판(fixed)은
      // 선택곡이 없어 그날 행이 없어도 안다.
      const commonOnly =
        common.length > 0 &&
        !version?.fixed &&
        // "빠진 곡" 표시만 있는 날도 그날 선택곡은 모른다.
        !own.some(inUnit(day, show)) &&
        !(liveCovers.get(live.id) ?? []).some(inUnit(day, show));
      return {
        songIds: uniqueSongIds(rows, originalOf),
        ...setlistDetails(rows, originalOf, coverRowsFor(scope, day, show)),
        ...coversFor(scope, day, show),
        ...(commonOnly && { commonOnly: true as const }),
        ...(live.live_venue !== undefined && { venue: live.live_venue }),
        ...(live.country !== undefined && { country: live.country }),
      };
    };

    // 하루 회차(metadata.shows · 그날 세트리스트의 show_number 중 큰 쪽, 2회 이상일
    // 때만) — 날마다 회차 수만큼 단위를 만든다. 첫 회차 id는 예전과 같은
    // "공연id:날짜"라 이미 저장된 체크가 그대로 첫 회차가 된다.
    // rowDay: 이 공연일에 넣을 세트리스트 행의 일차(기본은 dayNumber와 같다). live_date로
    // 하루만 세는 여러 날 공연은 dayNumber는 비우되 그날 일차의 행만 넣는다.
    const pushDay = (
      date: string,
      dayNumber: number | null,
      rowDay: number | null = dayNumber,
    ) => {
      const scope = versionScope(date);
      const shows = showsForDay(
        live.metadata,
        rowDay ?? 1,
        own
          .filter(
            (row) =>
              rowDay === null ||
              row.day_number == null ||
              row.day_number === rowDay,
          )
          .map((row) => row.show_number),
      );
      if (shows.length === 0) {
        units.push({
          ...base,
          id: `${live.id}:${date}`,
          date,
          dayNumber,
          ...unitFields(scope, rowDay, null),
        });
        return;
      }
      shows.forEach(({ show, label }) => {
        units.push({
          ...base,
          id: show === 1 ? `${live.id}:${date}` : `${live.id}:${date}:${show}`,
          date,
          dayNumber,
          showNumber: show,
          showLabel: label,
          ...unitFields(scope, rowDay, show),
        });
      });
    };

    // 페스티벌, 그리고 live_date(즛토마요가 실제로 선 날)가 있는 공연은 그날 하루.
    // 여러 날 공연의 live_date면 그날 일차(시작일부터 몇째 날)의 행만 — 투어 상세
    // (lives/live-days.ts splitTourDateByDay)와 같은 기준.
    if (live.type === "FESTIVAL" || live.live_date) {
      const date = (live.live_date ?? live.start_date).slice(0, 10);
      const start = live.start_date.slice(0, 10);
      const end = (live.end_date ?? live.start_date).slice(0, 10);
      const rowDay =
        live.type !== "FESTIVAL" && end > start
          ? daysInclusive(start, date)
          : null;
      pushDay(date, null, rowDay);
      continue;
    }

    const start = live.start_date.slice(0, 10);
    const end = (live.end_date ?? live.start_date).slice(0, 10);
    const days = Math.max(1, daysInclusive(start, end));
    for (let n = 1; n <= days; n++)
      pushDay(addDays(start, n - 1), days > 1 ? n : null);
  }

  return units;
}

type BuildInput = Parameters<typeof buildAllUnits>[0];

/**
 * lives 행을 공연 단위(하루하루의 공연)로 나눈다. 규칙은 설계 문서
 * (docs/superpowers/specs/2026-11-05-zutopia-live-checklist-timeline-design.md
 * "나누는 규칙")를 따른다.
 * - FESTIVAL: 행 하나 = 단위 하나, 날짜는 즛토마요 출연일(live_date, 없으면 start_date).
 * - CONCERT/EVENT: start_date~end_date 하루마다 단위 하나. DAY N의 곡 =
 *   (투어 공통 곡) + 이 행의 day_number 없는 곡 + day_number = N인 곡.
 *   day_number 없이 이틀짜리로 등록된 행은 양일 같은 세트리스트로 본다.
 * - 투어 소속: tour_id 일치 또는 slug가 투어 slug와 같은 행(lives/tour-dates.ts의
 *   tourDateFilter와 같은 기준). 제목·링크는 투어 것을 쓴다.
 * - 곡 id는 어레인지 버전이면 원곡 id로 바꾸고, 같은 날 같은 곡은 한 번만 센다.
 * - today보다 뒤의 단위는 뺀다(예정 공연일은 buildUpcomingUnits).
 */
export function buildLiveUnits(input: BuildInput, today: string): LiveUnit[] {
  return buildAllUnits(input)
    .filter((unit) => unit.date <= today)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (a.dayNumber ?? 0) - (b.dayNumber ?? 0) ||
        (a.showNumber ?? 0) - (b.showNumber ?? 0),
    );
}

/**
 * 예정 공연일 — today보다 뒤의 단위만, 날짜 오름차순(가까운 것부터). 나누는
 * 규칙은 buildLiveUnits와 같다(활동 연혁의 "예정" 표시용, 집계엔 안 쓴다).
 */
export function buildUpcomingUnits(
  input: BuildInput,
  today: string,
): LiveUnit[] {
  return buildAllUnits(input)
    .filter((unit) => unit.date > today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.dayNumber ?? 0) - (b.dayNumber ?? 0) ||
        (a.showNumber ?? 0) - (b.showNumber ?? 0),
    );
}

/** 곡별 라이브 횟수와 가장 최근·가장 처음 단위. units는 buildLiveUnits 결과(최신 먼저). */
export function buildSongLiveStats(
  units: LiveUnit[],
): Record<string, SongLiveStat> {
  const stats: Record<string, SongLiveStat> = {};
  for (const unit of units) {
    for (const songId of unit.songIds) {
      const stat = stats[songId];
      // units가 최신 먼저라, 처음 만난 단위가 마지막 라이브이고 계속 덮어쓰면
      // 남는 단위가 첫 라이브다.
      if (stat) {
        stat.count += 1;
        stat.firstUnitId = unit.id;
      } else {
        stats[songId] = { count: 1, lastUnitId: unit.id, firstUnitId: unit.id };
      }
    }
  }
  return stats;
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function uniqueSongIds(
  rows: RawSetlistRow[],
  originalOf: Record<string, string>,
): string[] {
  return [
    ...new Set(rows.map((row) => originalOf[row.song_id] ?? row.song_id)),
  ];
}

/**
 * 오프닝·앵콜·곡 순서·버전(통계용) — track_number·is_encore가 있는 행에서만. 첫
 * 곡은 앵콜이 아닌 곡 중 순서가 가장 앞선 곡(같으면 투어 공통 행이 먼저). 순서는
 * 본편·앵콜 따로 track_number 순(같으면 앞 행 먼저), 같은 곡은 처음 나온 자리만.
 * 커버곡도 "cover:제목"으로 자리를 차지한다 — 커버를 사이에 둔 두 곡이 이어 부른
 * 곡으로 세지거나 위치가 당겨지지 않게(통계는 곡이 아닌 id를 건너뛴다). 순서 정보가
 * 없는 원시 데이터면 빈 값.
 */
function setlistDetails(
  rows: RawSetlistRow[],
  originalOf: Record<string, string>,
  coverRows: RawCoverRow[] = [],
): Pick<
  LiveUnit,
  "openingSongId" | "encoreSongIds" | "mainOrder" | "encoreOrder" | "variations"
> {
  if (!rows.some((row) => row.track_number !== undefined)) return {};
  const original = (row: RawSetlistRow) =>
    originalOf[row.song_id] ?? row.song_id;
  const slots = [
    ...rows.map((row) => ({
      id: original(row),
      track: row.track_number,
      encore: !!row.is_encore,
    })),
    ...coverRows.map((row) => ({
      id: `cover:${row.title}`,
      track: row.track_number,
      encore: !!row.is_encore,
    })),
  ];
  const ordered = (encore: boolean) => [
    ...new Set(
      slots
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => slot.encore === encore && slot.track != null)
        .sort((a, b) => a.slot.track! - b.slot.track! || a.index - b.index)
        .map(({ slot }) => slot.id),
    ),
  ];
  const mainOrder = ordered(false);
  const variations = rows.flatMap((row) => {
    const name = parseSetlistNote(row.note, "variation");
    return name ? [{ songId: original(row), name }] : [];
  });
  return {
    openingSongId: mainOrder[0] ?? null,
    encoreSongIds: [
      ...new Set(rows.filter((row) => row.is_encore).map(original)),
    ],
    mainOrder,
    encoreOrder: ordered(true),
    ...(variations.length > 0 && { variations }),
  };
}

/**
 * 클라이언트 컴포넌트(참전 기록 등)로 넘길 공연일 — 통계 전용 필드(장소·나라·첫 곡·
 * 앵콜·곡 순서·버전·커버곡)를 빼서 페이지 데이터를 줄인다.
 */
export function toClientUnit(
  unit: LiveUnit,
): Omit<LiveUnit, StatOnlyUnitField> {
  /* eslint-disable @typescript-eslint/no-unused-vars -- 빼려고 꺼낸다 */
  const {
    venue,
    country,
    openingSongId,
    encoreSongIds,
    mainOrder,
    encoreOrder,
    variations,
    covers,
    commonOnly,
    ...rest
  } = unit;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return rest;
}

/**
 * 현장 공연만 — 온라인 공연(unit.online)을 뺀다. 참전 기록(체크할 공연)과 통계가
 * 쓴다. 곡별 라이브 횟수·마지막 라이브는 온라인 공연도 세고, 활동 연혁은 온라인
 * 공연을 그리되 공연 횟수엔 넣지 않는다(timeline/events.ts showDates).
 */
export function inPersonUnits<T extends Pick<LiveUnit, "online">>(
  units: T[],
): T[] {
  return units.filter((unit) => !unit.online);
}
