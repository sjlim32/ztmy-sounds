import { addDays, diffDays, formatDotDate } from "@/lib/ymd";
import { splitParenSuffix } from "@/features/zutopia/lives/split-paren-suffix";
import { isOnlineText, ONLINE_LABEL } from "@/features/zutopia/lives/region";
import { formatDayShow } from "@/features/zutopia/lives/shows";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import {
  ENTRY_TYPE_LABEL,
  ENTRY_TYPE_ORDER,
  type ZutopiaEntryType,
} from "@/features/zutopia/types";
import type {
  StatAlbum,
  StatCell,
  StatRecord,
  StatRow,
  StatSection,
  StatSong,
  StatSummary,
  StatTour,
  StatTrend,
} from "./types";
import { MISSING_SETLIST_RECORD_ID } from "./types";
import { hasSetlist, knowsSong, wilsonLowerBound } from "./has-setlist";

export { hasSetlist, wilsonLowerBound };

/**
 * 통계 페이지 기록 계산(순수 함수 — 빌드 때 한 번, 테스트 대상).
 *
 * 세는 기준:
 * - 공연일(LiveUnit) 하나 = 1회. 투어 각 회차·이틀 공연의 각 날을 따로 센다.
 * - 세트리스트를 모르는 공연일(songIds가 비었거나 투어 공통 곡만 있는 날 —
 *   hasSetlist)은 곡·공연 기록(횟수·참가율·첫 곡 등)에서 뺀다 — "안 불렀다"로 세면
 *   기록이 틀어진다. 다만 투어 공통 곡만 있는 날도 그 공통 곡은 불렀으니 그 곡에
 *   한해서는 아는 날로 센다(knowsSong). 공연 횟수·장소·공백 같은 기록엔 넣는다.
 * - "모르는 구간" = 세트리스트 없는 공연일 + 공연일이 하나도 등록되지 않은 투어
 *   기간. 첫 라이브·라이브 데뷔·첫 공개·공백 끝 부활·연속 기록은 이 구간을 사이에
 *   두면 단정할 수 없어서, 그런 곡·구간은 빼거나(데뷔·부활) 끊는다(연속).
 * - 공연일이 없는 투어는 횟수를 셀 수 없어 해마다·장소 기록엔 못 넣고, 공연 공백
 *   계산에만 "그 기간엔 공연이 있었다"로 넣는다.
 * - 참가율 = 발매일 이후(당일 포함) 세트리스트가 있는 공연일 중 그 곡을 부른 비율.
 *   발매 전에 먼저 부른 날은 횟수엔 넣고 참가율에선 뺀다(100%를 넘지 않게).
 * - 온라인 공연은 처음부터 넣지 않는다(stats/data.ts가 현장 공연만 넘긴다). 장소
 *   기록의 isOnline은 혹시 섞여 들어와도 도시·공연장에 "온라인"이 잡히지 않게 하는
 *   안전장치.
 * - 기록 설명은 두 가지 — description은 카드 제목 아래 짧은 한 줄(무엇을 쟀는지만),
 *   detail은 자세한 세는 기준(전체 순위 옆 창 부제). 둘 다 화면에 그대로 나가니
 *   세는 기준이 바뀌면 detail을 같이 고친다.
 *   공연일이 없는 투어 안내는 그런 투어가 있을 때만 붙는다(emptyTourNote 등).
 *   "모르는 구간"으로 빼거나 끊는 규칙은 계산엔 그대로 두되 설명엔 적지 않는다.
 */
export function buildStatSections(input: {
  /** 지난 공연일(buildLiveUnits 결과, 순서 무관) */
  units: LiveUnit[];
  /** 예정 공연일 — 투어 공연 수에만 쓴다 */
  upcoming: LiveUnit[];
  /**
   * 취소된 공연일(lives.status = 'CANCELED')이 있는 투어 id. 공연일이 전부 취소된
   * 투어는 "공연일이 아직 등록되지 않은 투어"가 아니라 공연이 없던 투어라, 모르는
   * 구간·공연 공백·가장 긴 투어에서 뺀다.
   */
  canceledTourIds?: string[];
  songs: StatSong[];
  /** 미공개곡(원곡) — "가장 많이 부른 미공개곡"에만 쓴다 */
  unreleasedSongs?: StatSong[];
  albums: StatAlbum[];
  tours: StatTour[];
}): StatSection[] {
  const all = [...input.units].sort(byDate);
  const known = all.filter(hasSetlist);
  const songStats = buildSongStats(input.songs, all);
  const unreleasedStats = buildSongStats(input.unreleasedSongs ?? [], all);
  const scheduled = new Set(
    [...all, ...input.upcoming].flatMap((unit) => unit.tourId ?? []),
  );
  const lastDate = all.at(-1)?.date ?? "";
  const canceledTours = new Set(input.canceledTourIds ?? []);
  // 공연일이 하나도 없는 투어의 (지난) 기간 — 공연일이 전부 취소된 투어는 뺀다.
  const emptyTours = input.tours
    .filter(
      (tour) =>
        !scheduled.has(tour.id) &&
        !canceledTours.has(tour.id) &&
        tour.startDate <= lastDate,
    )
    .map((tour) => ({
      tour,
      from: tour.startDate,
      to: minDate(tour.endDate ?? tour.startDate, lastDate),
    }));
  const context: Context = {
    order: new Map(all.map((unit, index) => [unit.id, index])),
    unknownUnits: all.filter((unit) => !hasSetlist(unit)),
    emptyTours,
    emptyTourCount: emptyTours.length,
  };

  const sections: {
    id: StatSection["id"];
    title: string;
    records: RawRecord[];
  }[] = [
    {
      id: "songs",
      title: "곡",
      records: [
        ...songRecords(songStats, known, context),
        ...unreleasedRecords(unreleasedStats, known),
      ],
    },
    {
      id: "setlists",
      title: "세트리스트",
      records: setlistRecords(songStats, known, all),
    },
    {
      id: "albums",
      title: "앨범",
      records: [
        ...albumRecords(input.albums, songStats),
        ...albumYearRecords(input.albums, songStats),
      ],
    },
    {
      id: "lives",
      title: "공연",
      records: liveRecords(
        all,
        known,
        [...songStats, ...unreleasedStats],
        input,
        emptyTours,
        context,
      ),
    },
    {
      id: "places",
      title: "장소",
      records: [...placeRecords(all, context), ...koreaRecords(songStats)],
    },
  ];
  return sections.map((section) => ({
    ...section,
    records: section.records.map(({ trendFor, ...record }) => ({
      ...record,
      total: record.rows.length,
      leaderCount: record.rows.filter((row) => row.rank === 1).length,
      // 흐름 그래프는 1위 카드에만 — 1위 하나만 계산한다.
      trend: trendFor && record.rows[0] ? trendFor(record.rows[0].key) : null,
    })),
  }));
}

/**
 * 통계 맨 위 요약 — 공연일 수, 세트리스트 확보율(곡 기록을 얼마나 믿을 수 있는지),
 * 라이브로 부른 곡 수, 해외 공연 수. 세트리스트가 없는 공연일은 최신 먼저 목록으로
 * (옆 창에서 보고 제보할 수 있게).
 */
export function buildStatSummary(input: {
  units: LiveUnit[];
  songs: StatSong[];
}): StatSummary {
  const all = [...input.units].sort(byDate);
  const known = all.filter(hasSetlist);
  const missing = all.filter((unit) => !hasSetlist(unit)).reverse();
  const playedIds = new Set(known.flatMap((unit) => unit.songIds));
  const playedSongs = input.songs.filter((song) => playedIds.has(song.id));
  const overseas = all.filter(
    (unit) => !isOnline(unit) && unit.country && unit.country !== "일본",
  );
  const years = all.length
    ? `${all[0].date.slice(0, 4)} – ${all.at(-1)!.date.slice(0, 4)}`
    : null;
  return {
    items: [
      { label: "현장 공연일", value: times(all.length), note: years },
      {
        label: "세트리스트 확보",
        value: percent(known.length, all.length),
        note: `${known.length.toLocaleString("ko-KR")} / ${all.length.toLocaleString("ko-KR")}회`,
        ratio: all.length ? known.length / all.length : 0,
      },
      {
        label: "라이브로 부른 곡",
        value: `${playedSongs.length}곡`,
        note: `발매곡 ${input.songs.length}곡 중 ${percent(playedSongs.length, input.songs.length)}`,
      },
      {
        label: "해외 공연일",
        value: times(overseas.length),
        note: `${new Set(overseas.map((unit) => unit.country)).size}개 나라`,
      },
    ],
    missing: {
      id: MISSING_SETLIST_RECORD_ID,
      title: "세트리스트를 아직 모르는 공연",
      description: "곡 기록에서 빠지는 공연일",
      detail:
        "곡 기록에서 빠지는 공연일(최신 먼저) — 그날 세트리스트(선택곡 포함)를 알면 제보해 주세요",
      columns: ["종류", "세트리스트"],
      rows: missing.map((unit, index) => ({
        ...unitRow(unit, [
          ENTRY_TYPE_LABEL[entryTypeOf(unit)],
          unit.commonOnly ? "투어 공통 곡만" : "없음",
        ]),
        rank: index + 1,
      })),
      total: missing.length,
      leaderCount: missing.length ? 1 : 0,
    },
  };
}

/** 카드에 보이는 줄 수(1위 + 2~5위) — 나머지는 "전체 순위 보기"에서 stats.json으로. */
export const PREVIEW_ROW_COUNT = 5;

/**
 * 페이지에 싣는 미리보기 — 기록마다 앞 PREVIEW_ROW_COUNT줄만, 설명(note)은 1위
 * 카드에서만 쓰므로 나머지 줄에선 뺀다(전체 표 데이터는 수백 줄이라 따로 받는다).
 */
export function previewSections(sections: StatSection[]): StatSection[] {
  return sections.map((section) => ({
    ...section,
    records: section.records.map((record) => ({
      ...record,
      rows: record.rows
        .slice(0, PREVIEW_ROW_COUNT)
        .map((row, index) => (index === 0 ? row : { ...row, note: null })),
    })),
  }));
}

/** stats.json — 기록 id → 전체 순위 줄. */
export function fullTables(sections: StatSection[]): Record<string, StatRow[]> {
  return Object.fromEntries(
    sections.flatMap((section) =>
      // 전체 순위표는 설명(note)을 그리지 않는다(1위 note는 페이지 미리보기에 있다).
      section.records.map((record) => [
        record.id,
        record.rows.map((row) => ({ ...row, note: null })),
      ]),
    ),
  );
}

const byDate = (a: LiveUnit, b: LiveUnit) =>
  a.date.localeCompare(b.date) ||
  (a.dayNumber ?? 0) - (b.dayNumber ?? 0) ||
  (a.showNumber ?? 0) - (b.showNumber ?? 0);

// ─── 공통 ──────────────────────────────────────────────────────────────

/**
 * 기록 하나(전체 줄 수 total·공동 1위 수는 buildStatSections가 마지막에 붙인다).
 * trendFor가 있으면 1위 줄의 key로 연도별 흐름을 만든다.
 */
type RawRecord = Omit<StatRecord, "total" | "leaderCount" | "trend"> & {
  trendFor?: (key: string) => StatTrend | null;
};

/** 공연일들의 첫 해부터 마지막 해까지(빈 해 포함) — 연도별 막대의 가로축. */
function yearSpan(units: LiveUnit[]): string[] {
  if (units.length === 0) return [];
  const years = units.map((unit) => Number(unit.date.slice(0, 4)));
  const [from, to] = [Math.min(...years), Math.max(...years)];
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

/** 해마다 몇 번(weight가 있으면 공연일마다 그 값을 더한다). */
function yearlyTrend(
  label: string,
  axis: LiveUnit[],
  units: LiveUnit[],
  weight: (unit: LiveUnit) => number = () => 1,
): StatTrend {
  const counts = new Map<string, number>();
  for (const unit of units) {
    const year = unit.date.slice(0, 4);
    counts.set(year, (counts.get(year) ?? 0) + weight(unit));
  }
  return {
    label,
    unit: "회",
    points: yearSpan(axis).map((year) => ({
      label: year,
      value: counts.get(year) ?? 0,
    })),
  };
}

/** 날짜 구간(양 끝 포함, "YYYY-MM-DD") */
interface Span {
  from: string;
  to: string;
}

interface Context {
  /** 공연일 → 날짜 순(all) 자리 — 같은 날 여러 회차도 앞뒤를 가린다 */
  order: Map<string, number>;
  /** 세트리스트를 모르는 공연일(없거나 투어 공통 곡만 있는 날) */
  unknownUnits: LiveUnit[];
  /** 공연일이 하나도 등록되지 않은 (지난) 투어 기간 */
  emptyTours: Span[];
  /** 공연일이 하나도 등록되지 않은 (지난) 투어 수 */
  emptyTourCount: number;
}

const minDate = (a: string, b: string) => (a < b ? a : b);

/**
 * 두 공연일 사이(양 끝 제외)에 모르는 구간이 있는지 — 공연일은 날짜 순 자리로 판정해
 * 같은 날의 다른 회차도 잡고, 공연일 없는 투어는 기간으로.
 */
function unknownBetween(
  context: Context,
  from: LiveUnit,
  to: LiveUnit,
  songId: string,
) {
  const [a, b] = [context.order.get(from.id)!, context.order.get(to.id)!];
  return (
    context.unknownUnits.some((unit) => {
      if (knowsSong(unit, songId)) return false;
      const index = context.order.get(unit.id)!;
      return index > a && index < b;
    }) ||
    context.emptyTours.some(
      (span) => span.to > from.date && span.from < to.date,
    )
  );
}

/** 첫 라이브 판정에서 발매일·첫 라이브 중 이른 날보다 더 거슬러 살피는 기간(일) —
 * 발매 직전 공연에서 먼저 선보이는 경우가 있어서. */
const PREMIERE_LOOKBACK_DAYS = 90;

/**
 * 첫 라이브(first)가 정말 처음인지 모를 때 — 발매일과 첫 라이브 중 이른 날의 90일
 * 전부터 그 공연일 앞까지, 이 곡을 불렀는지 모르는 공연일·빈 투어가 있으면.
 */
function unknownBeforeFirst(
  context: Context,
  first: LiveUnit,
  releaseDate: string,
  songId: string,
) {
  const start = addDays(
    minDate(first.date, releaseDate),
    -PREMIERE_LOOKBACK_DAYS,
  );
  const index = context.order.get(first.id)!;
  return (
    context.unknownUnits.some(
      (unit) =>
        !knowsSong(unit, songId) &&
        unit.date >= start &&
        context.order.get(unit.id)! < index,
    ) ||
    context.emptyTours.some(
      (span) => span.to >= start && span.from < first.date,
    )
  );
}

/** 공연일이 없는 투어가 있으면 덧붙이는 안내(횟수를 셀 수 없어 빠진다) — 없으면 빈 문자열. */
const emptyTourNote = (context: Context) =>
  context.emptyTourCount > 0
    ? ` — 공연일이 아직 등록되지 않은 투어 ${context.emptyTourCount}개는 빠짐`
    : "";

/** 공연 공백용 — 공연일이 없는 투어는 그 기간 내내 공연이 있던 것으로 본다. 없으면 빈 문자열. */
const emptyTourBreakNote = (context: Context) =>
  context.emptyTourCount > 0
    ? `(공연일이 아직 등록되지 않은 투어 ${context.emptyTourCount}개는 그 기간 내내 공연이 있던 것으로)`
    : "";

/**
 * 점수로 정렬하고 순위를 매긴다 — 점수가 같으면 같은 순위(공동). tie는 점수가
 * 같을 때 줄 순서만 정한다(순위엔 영향 없음).
 */
function rank<T>(
  items: T[],
  score: (item: T) => number,
  order: "desc" | "asc",
  toRow: (item: T) => Omit<StatRow, "rank">,
  tie?: (a: T, b: T) => number,
): StatRow[] {
  const sign = order === "desc" ? -1 : 1;
  const sorted = [...items].sort(
    (a, b) => sign * (score(a) - score(b)) || (tie ? tie(a, b) : 0),
  );
  let previous: number | null = null;
  let current = 0;
  return sorted.map((item, index) => {
    const value = score(item);
    if (value !== previous) current = index + 1;
    previous = value;
    return { ...toRow(item), rank: current };
  });
}

const percent = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–";

const times = (n: number) => `${n.toLocaleString("ko-KR")}회`;

/** 1,234일 · 365일 이상이면 "약 3.4년"을 덧붙일 설명. */
const days = (n: number) => `${n.toLocaleString("ko-KR")}일`;
const aboutYears = (n: number) =>
  n >= 365 ? `약 ${(n / 365).toFixed(1)}년` : null;

function unitName(unit: LiveUnit) {
  return unit.titleKo ?? unit.title;
}

/** 공연 칸 — 날짜와 공연 이름을 나눠 둔다(화면에서 두 줄로). */
function unitCell(unit: LiveUnit): StatCell {
  return {
    date: formatDotDate(unit.date),
    label: unitName(unit),
    href: unit.href,
  };
}

/** 한 줄 글자로 쓰는 공연(1위 설명 등) — 날짜와 이름을 가운뎃점으로 나눈다. */
function unitText(unit: LiveUnit) {
  return `${formatDotDate(unit.date)} · ${unitName(unit)}`;
}

function unitSub(unit: LiveUnit) {
  return [
    formatDotDate(unit.date),
    [unit.city, formatDayShow(unit.dayNumber, unit.showLabel)]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(" · ");
}

function unitRow(unit: LiveUnit, cells: StatCell[], note?: string | null) {
  return {
    key: unit.id,
    name: unitName(unit),
    sub: unitSub(unit),
    image: unit.imageUrl ?? unit.groupImageUrl,
    href: unit.href,
    cells,
    note: note ?? null,
  };
}

function isOnline(unit: LiveUnit) {
  return (
    unit.city === ONLINE_LABEL ||
    isOnlineText(unit.city) ||
    isOnlineText(unit.venue)
  );
}

// ─── 곡 ────────────────────────────────────────────────────────────────

interface SongStat {
  song: StatSong;
  /**
   * 이 곡을 불렀는지 아는 공연일(날짜 순) — 세트리스트를 아는 날 + 이 곡이 투어 공통
   * 곡인 투어 공통 곡만 있는 날(knowsSong)
   */
  known: LiveUnit[];
  /** 부른 공연일(날짜 순) */
  played: LiveUnit[];
  /** 발매 후 이 곡을 불렀는지 아는 공연일 수 */
  eligible: number;
  /** 발매 후 부른 횟수 */
  playedSinceRelease: number;
}

/** all은 날짜 순 공연일 전부 — 곡마다 불렀는지 아는 날(knowsSong)만 골라 센다. */
function buildSongStats(songs: StatSong[], all: LiveUnit[]): SongStat[] {
  return songs.map((song) => {
    const known = all.filter((unit) => knowsSong(unit, song.id));
    const played = known.filter((unit) => unit.songIds.includes(song.id));
    return {
      song,
      known,
      played,
      eligible: known.filter((unit) => unit.date >= song.releaseDate).length,
      playedSinceRelease: played.filter((unit) => unit.date >= song.releaseDate)
        .length,
    };
  });
}

function songRow(song: StatSong, cells: StatCell[], note?: string | null) {
  return {
    key: song.id,
    // 통계는 한글 제목 위주 — 원제는 아래 작은 줄에.
    name: song.titleKo || song.title,
    sub: song.titleKo && song.titleKo !== song.title ? song.title : null,
    image: song.cover,
    href: `/zutopia/songs?song=${song.slug}`,
    cells,
    note: note ?? null,
  };
}

const byRelease = (a: SongStat, b: SongStat) =>
  a.song.releaseDate.localeCompare(b.song.releaseDate);

function songRecords(
  stats: SongStat[],
  known: LiveUnit[],
  context: Context,
): RawRecord[] {
  const rate = (stat: SongStat) =>
    stat.eligible > 0 ? stat.playedSinceRelease / stat.eligible : 0;
  const playCells = (stat: SongStat) => [
    times(stat.played.length),
    percent(stat.playedSinceRelease, stat.eligible),
    stat.played[0] ? formatDotDate(stat.played[0].date) : "–",
    stat.played.at(-1) ? formatDotDate(stat.played.at(-1)!.date) : "–",
  ];
  const playNote = (stat: SongStat) =>
    `발매 후 공연일 ${stat.eligible}회 중 ${stat.playedSinceRelease}회 · 참가율 ${percent(stat.playedSinceRelease, stat.eligible)}`;
  // 첫 라이브는 세트리스트가 있는 공연 중 처음 — 그 전 공연 기록이 비어 있을 수 있다.
  const playColumns = ["횟수", "참가율", "확인된 첫 라이브", "마지막 라이브"];

  const played = stats.filter((stat) => stat.played.length > 0);
  const statById = new Map(stats.map((stat) => [stat.song.id, stat]));
  // 1위 곡의 해마다 라이브 횟수(가로축은 세트리스트가 있는 공연일의 해).
  const songTrend = (key: string) => {
    const stat = statById.get(key);
    return stat ? yearlyTrend("해마다 라이브 횟수", known, stat.played) : null;
  };
  // 참가율 순위는 공연일이 적은 곡을 조금 낮게 보정한 값(Wilson 하한)으로 매긴다 —
  // 발매 후 공연일 2회 중 2회(100%)가 30회 중 29회(97%)를 이기지 않게.
  const rateScore = (stat: SongStat) =>
    wilsonLowerBound(stat.playedSinceRelease, stat.eligible);

  // 오랜 공백 끝 부활 — 연이은 두 라이브 사이. 날짜(일수)로 가장 길었던 때와,
  // 그 사이 건너뛴 공연일(이 곡을 불렀는지 아는 공연일) 수로 가장 많았던 때를 따로
  // 잰다 — 공연이 드물던 시기엔 일수만 길어서, 일부러 뺐다가 돌아온 곡은 공연 수로 보인다.
  type Comeback = {
    stat: SongStat;
    from: LiveUnit;
    to: LiveUnit;
    gap: number;
    skipped: number;
  };
  const byDays: Comeback[] = [];
  const byShows: Comeback[] = [];
  for (const stat of played) {
    const knownIndex = new Map(
      stat.known.map((unit, index) => [unit.id, index]),
    );
    let longest: Comeback | null = null;
    let most: Comeback | null = null;
    for (let i = 1; i < stat.played.length; i++) {
      const [from, to] = [stat.played[i - 1], stat.played[i]];
      // 사이에 이 곡을 불렀는지 모르는 공연이 있으면 그때 불렀을 수도 있다.
      if (unknownBetween(context, from, to, stat.song.id)) continue;
      const item = {
        stat,
        from,
        to,
        gap: diffDays(from.date, to.date),
        skipped: knownIndex.get(to.id)! - knownIndex.get(from.id)! - 1,
      };
      if (!longest || item.gap > longest.gap) longest = item;
      if (!most || item.skipped > most.skipped) most = item;
    }
    if (longest) byDays.push(longest);
    if (most && most.skipped > 0) byShows.push(most);
  }
  const comebackCells = (item: Comeback, first: StatCell) => [
    first,
    unitCell(item.from),
    unitCell(item.to),
  ];
  const comebackNote = (item: Comeback) =>
    [
      `${days(item.gap)} · 공연 ${times(item.skipped)} 건너뜀`,
      aboutYears(item.gap),
    ]
      .filter(Boolean)
      .join(" · ");

  // 최근 흐름 — 세트리스트를 아는 마지막 공연일까지 1년(최근)과 그 전(발매
  // 후)의 참가율을 비교한다. 양쪽 다 공연일이 MIN_TREND_SHOWS회 이상인 곡만.
  const lastKnown = known.at(-1)?.date;
  const recentFrom = lastKnown ? addDays(lastKnown, -364) : "";
  const shifts = played.flatMap((stat) => {
    const eligible = stat.known.filter(
      (unit) => unit.date >= stat.song.releaseDate,
    );
    const recent = eligible.filter((unit) => unit.date >= recentFrom);
    const before = eligible.filter((unit) => unit.date < recentFrom);
    if (recent.length < MIN_TREND_SHOWS || before.length < MIN_TREND_SHOWS)
      return [];
    const ids = new Set(stat.played.map((unit) => unit.id));
    const count = (units: LiveUnit[]) =>
      units.filter((unit) => ids.has(unit.id)).length;
    const [recentPlayed, beforePlayed] = [count(recent), count(before)];
    const recentRate = recentPlayed / recent.length;
    const beforeRate = beforePlayed / before.length;
    return [
      {
        stat,
        recent: recent.length,
        before: before.length,
        recentPlayed,
        beforePlayed,
        // 화면의 %p(정수)와 같은 단위
        delta: Math.round(recentRate * 100) - Math.round(beforeRate * 100),
      },
    ];
  });
  type Shift = (typeof shifts)[number];
  const shiftRow = (item: Shift) =>
    songRow(
      item.stat.song,
      [
        `${item.delta > 0 ? "+" : ""}${item.delta}%p`,
        percent(item.recentPlayed, item.recent),
        percent(item.beforePlayed, item.before),
      ],
      `최근 1년 공연일 ${item.recent}회 중 ${item.recentPlayed}회 · 그 전 ${item.before}회 중 ${item.beforePlayed}회`,
    );

  // 연속 공연일 — 세트리스트가 있는 공연일을 날짜 순으로 이어 볼 때 연달아 부른 최대 횟수.
  // 이 곡을 불렀는지 아는 공연일만 이어 본다(투어 공통 곡은 공통 곡만 있는 날도).
  const streaks = played.map((stat) => {
    const set = new Set(stat.played.map((unit) => unit.id));
    let best = { length: 0, from: stat.known[0], to: stat.known[0] };
    let length = 0;
    let from = stat.known[0];
    let previous: LiveUnit | null = null;
    for (const unit of stat.known) {
      // 사이에 이 곡을 불렀는지 모르는 공연이 있으면 연속이 끊긴 것으로 본다.
      if (previous && unknownBetween(context, previous, unit, stat.song.id))
        length = 0;
      previous = unit;
      if (set.has(unit.id)) {
        if (length === 0) from = unit;
        length += 1;
        if (length > best.length) best = { length, from, to: unit };
      } else length = 0;
    }
    return { stat, ...best };
  });

  // 라이브 데뷔 — 발매일부터 첫 라이브까지(음수면 발매 전 선공개).
  // 그 앞에 세트리스트를 모르는 공연이 있으면 진짜 첫 라이브인지 알 수 없어 뺀다
  // (unknownBeforeFirst).
  const debuts = played
    .filter(
      (stat) =>
        !unknownBeforeFirst(
          context,
          stat.played[0],
          stat.song.releaseDate,
          stat.song.id,
        ),
    )
    .map((stat) => ({
      stat,
      first: stat.played[0],
      gap: diffDays(stat.song.releaseDate, stat.played[0].date),
    }));
  const debutText = (gap: number) =>
    gap < 0
      ? `발매 ${days(-gap)} 전`
      : gap === 0
        ? "발매 당일"
        : `${days(gap)} 만`;
  const debutCells = (debut: (typeof debuts)[number]) => [
    debutText(debut.gap),
    formatDotDate(debut.stat.song.releaseDate),
    unitCell(debut.first),
  ];

  const withOpening = known.filter((unit) => unit.openingSongId);
  const withEncore = known.filter((unit) => unit.encoreSongIds?.length);
  // 비율은 두 가지 — 첫 곡(앵콜)을 아는 공연일 중, 그리고 그 곡을 부른 공연일 중.
  // 뒤쪽은 많이 불린 곡이 횟수로만 이기지 않게 "불렀다 하면 첫 곡"인 곡을 보여 준다.
  const openings = played
    .map((stat) => ({
      stat,
      count: withOpening.filter((unit) => unit.openingSongId === stat.song.id)
        .length,
      // 첫 곡을 아는 날만(투어 공통 곡만 있는 날은 그날 첫 곡을 모른다)
      base: stat.played.filter((unit) => hasSetlist(unit) && unit.openingSongId)
        .length,
    }))
    .filter((item) => item.count > 0);
  const encores = played
    .map((stat) => ({
      stat,
      count: withEncore.filter((unit) =>
        unit.encoreSongIds!.includes(stat.song.id),
      ).length,
      base: stat.played.filter(
        (unit) => hasSetlist(unit) && unit.encoreSongIds?.length,
      ).length,
    }))
    .filter((item) => item.count > 0);

  return [
    {
      id: "song-most-played",
      trendFor: songTrend,
      title: "라이브에서 가장 많이 불린 곡",
      description: "부른 공연일 수",
      detail:
        "세트리스트가 있는 공연일 중 부른 횟수 · 참가율은 발매 후 그런 공연일 중 부른 비율",
      columns: playColumns,
      rows: rank(
        played,
        (stat) => stat.played.length,
        "desc",
        (stat) => songRow(stat.song, playCells(stat), playNote(stat)),
        (a, b) => rate(b) - rate(a),
      ),
    },
    {
      id: "song-highest-rate",
      trendFor: songTrend,
      title: "참가율이 가장 높은 곡",
      description: "발매 후 공연일 중 부른 비율(공연일이 적은 곡은 순위 보정)",
      // 순위는 보정값, 카드 값은 보정 전 %라 막대 길이가 순위와 어긋난다.
      bars: false,
      detail:
        "발매 후 세트리스트가 있는 공연일 중 부른 비율 — 그런 공연일이 적은 곡은 순위를 조금 낮게 보정",
      columns: ["참가율", "횟수", "확인된 첫 라이브", "마지막 라이브"],
      rows: rank(
        stats.filter((stat) => stat.eligible > 0),
        // 보정값 그대로(아주 작은 차이까지) — 보이는 %가 다른 두 곡이 우연히 공동
        // 순위가 되지 않게.
        (stat) => Math.round(rateScore(stat) * 1e6),
        "desc",
        (stat) => {
          const [count, pct, first, last] = playCells(stat);
          return songRow(stat.song, [pct, count, first, last], playNote(stat));
        },
        (a, b) => rate(b) - rate(a) || b.played.length - a.played.length,
      ),
    },
    {
      id: "song-least-played",
      title: "라이브에서 가장 적게 불린 곡",
      description: "부른 횟수가 적은 순",
      detail:
        "발매 후 세트리스트가 있는 공연일이 있는 곡 중 횟수가 적은 순(같으면 발매 후 공연일이 많은 곡 먼저)",
      columns: ["횟수", "발매 후 공연일", "참가율", "마지막 라이브"],
      rows: rank(
        stats.filter((stat) => stat.eligible > 0),
        (stat) => stat.played.length,
        "asc",
        (stat) =>
          songRow(
            stat.song,
            [
              times(stat.played.length),
              times(stat.eligible),
              percent(stat.playedSinceRelease, stat.eligible),
              stat.played.at(-1)
                ? formatDotDate(stat.played.at(-1)!.date)
                : "없음",
            ],
            stat.played.length === 0
              ? `세트리스트를 아는 발매 후 공연일 ${stat.eligible}회 중 0회`
              : playNote(stat),
          ),
        (a, b) => b.eligible - a.eligible,
      ),
    },
    {
      id: "song-rising",
      title: "최근 1년 사이 부쩍 늘어난 곡",
      description: "최근 1년 참가율이 오른 곡",
      detail: `세트리스트를 아는 마지막 공연일까지 1년(최근 1년)의 참가율 − 그 전(발매 후) 참가율(양쪽 다 공연일 ${MIN_TREND_SHOWS}회 이상)`,
      columns: ["변화", "최근 1년", "그 전"],
      trendFor: songTrend,
      rows: rank(
        shifts.filter((item) => item.delta > 0),
        (item) => item.delta,
        "desc",
        shiftRow,
        (a, b) => b.recentPlayed - a.recentPlayed,
      ),
    },
    {
      id: "song-falling",
      title: "최근 1년 사이 뜸해진 곡",
      description: "최근 1년 참가율이 내린 곡",
      detail: `세트리스트를 아는 마지막 공연일까지 1년(최근 1년)의 참가율 − 그 전(발매 후) 참가율(양쪽 다 공연일 ${MIN_TREND_SHOWS}회 이상)`,
      columns: ["변화", "최근 1년", "그 전"],
      trendFor: songTrend,
      rows: rank(
        shifts.filter((item) => item.delta < 0),
        (item) => item.delta,
        "asc",
        shiftRow,
        (a, b) => b.beforePlayed - a.beforePlayed,
      ),
    },
    {
      id: "song-comeback",
      trendFor: songTrend,
      title: "가장 오랜 공백 끝에 돌아온 곡",
      description: "다시 부르기까지 걸린 날",
      detail: "곡마다 연이어 부른 두 공연일 사이가 가장 길었던 때(일수)",
      columns: ["공백", "건너뛴 공연", "이전 라이브", "돌아온 공연"],
      rows: rank(
        byDays,
        (item) => item.gap,
        "desc",
        (item) => {
          const [first, from, to] = comebackCells(item, days(item.gap));
          return songRow(
            item.stat.song,
            [first, times(item.skipped), from, to],
            comebackNote(item),
          );
        },
      ),
    },
    {
      id: "song-comeback-shows",
      trendFor: songTrend,
      title: "가장 많은 공연을 건너뛰고 돌아온 곡",
      description: "다시 부르기까지 건너뛴 공연",
      detail:
        "곡마다 연이어 부른 두 공연일 사이에 세트리스트가 있는 공연일이 가장 많았던 때",
      columns: ["건너뛴 공연", "공백", "이전 라이브", "돌아온 공연"],
      rows: rank(
        byShows,
        (item) => item.skipped,
        "desc",
        (item) => {
          const [first, from, to] = comebackCells(item, times(item.skipped));
          return songRow(
            item.stat.song,
            [first, days(item.gap), from, to],
            comebackNote(item),
          );
        },
        (a, b) => b.gap - a.gap,
      ),
    },
    {
      id: "song-streak",
      trendFor: songTrend,
      title: "가장 오래 연속으로 불린 곡",
      description: "빠짐없이 이어 부른 공연일",
      detail: "연이은 공연일마다 빠짐없이 부른 최대 횟수",
      columns: ["연속", "시작", "끝"],
      rows: rank(
        streaks,
        (item) => item.length,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [
              `${item.length}회 연속`,
              formatDotDate(item.from.date),
              formatDotDate(item.to.date),
            ],
            `${formatDotDate(item.from.date)} – ${formatDotDate(item.to.date)}`,
          ),
        (a, b) => byRelease(a.stat, b.stat),
      ),
    },
    {
      id: "song-fastest-debut",
      title: "가장 빨리 라이브에 오른 곡",
      description: "발매일부터 첫 라이브까지",
      detail: "발매일부터 첫 라이브까지(발매 전에 먼저 부른 곡이 앞)",
      columns: ["첫 라이브까지", "발매일", "첫 라이브"],
      rows: rank(
        debuts,
        (item) => item.gap,
        "asc",
        (item) =>
          songRow(item.stat.song, debutCells(item), unitText(item.first)),
      ),
    },
    {
      id: "song-slowest-debut",
      title: "라이브까지 가장 오래 걸린 곡",
      description: "발매일부터 첫 라이브까지",
      detail: "발매일부터 첫 라이브까지 가장 오래 걸린 순",
      columns: ["첫 라이브까지", "발매일", "첫 라이브"],
      rows: rank(
        debuts,
        (item) => item.gap,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            debutCells(item),
            [aboutYears(item.gap), unitText(item.first)]
              .filter(Boolean)
              .join(" · "),
          ),
      ),
    },
    {
      id: "song-opener",
      title: "오프닝 단골 곡",
      description: "공연 첫 곡으로 부른 횟수",
      detail: `공연 첫 곡으로 가장 많이 부른 곡(첫 곡을 아는 공연일 ${withOpening.length}회 기준) · "부른 날 중"은 그 곡을 부른 공연일 중 첫 곡이었던 비율`,
      columns: ["첫 곡 횟수", "전체 중", "부른 날 중"],
      rows: rank(
        openings,
        (item) => item.count,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [
              times(item.count),
              percent(item.count, withOpening.length),
              percent(item.count, item.base),
            ],
            `첫 곡을 아는 공연일 ${withOpening.length}회 중 ${percent(item.count, withOpening.length)} · 그중 부른 날 ${item.base}회 중 ${percent(item.count, item.base)}`,
          ),
        (a, b) => b.count / b.base - a.count / a.base,
      ),
    },
    {
      id: "song-encore",
      title: "앵콜 단골 곡",
      description: "앵콜로 부른 횟수",
      detail: `앵콜로 가장 많이 부른 곡(앵콜이 있던 공연일 ${withEncore.length}회 기준) · "부른 날 중"은 앵콜이 있던 날 가운데 그 곡을 부른 날 중 앵콜로 부른 비율`,
      columns: ["앵콜 횟수", "전체 중", "부른 날 중"],
      rows: rank(
        encores,
        (item) => item.count,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [
              times(item.count),
              percent(item.count, withEncore.length),
              percent(item.count, item.base),
            ],
            `앵콜이 있던 공연일 ${withEncore.length}회 중 ${percent(item.count, withEncore.length)} · 그중 부른 날 ${item.base}회 중 ${percent(item.count, item.base)}`,
          ),
        (a, b) => b.count / b.base - a.count / a.base,
      ),
    },
  ];
}

/** 미공개곡 — 발매 전이라 참가율이 없어 횟수만. */
function unreleasedRecords(stats: SongStat[], known: LiveUnit[]): RawRecord[] {
  const played = stats.filter((stat) => stat.played.length > 0);
  return [
    {
      id: "song-unreleased",
      title: "라이브에서 가장 많이 부른 미공개곡",
      description: "아직 음원이 없는 곡",
      detail:
        "음원으로 아직 나오지 않은 곡을 부른 공연일 수(세트리스트가 있는 공연일 기준)",
      columns: ["횟수", "확인된 첫 라이브", "마지막 라이브"],
      trendFor: (key) => {
        const stat = played.find((item) => item.song.id === key);
        return stat
          ? yearlyTrend("해마다 라이브 횟수", known, stat.played)
          : null;
      },
      rows: rank(
        played,
        (stat) => stat.played.length,
        "desc",
        (stat) =>
          songRow(stat.song, [
            times(stat.played.length),
            unitCell(stat.played[0]),
            unitCell(stat.played.at(-1)!),
          ]),
      ),
    },
  ];
}

// ─── 세트리스트 ────────────────────────────────────────────────────────

/** 최근 흐름 기록에 넣는 최소 공연일 수(최근 1년·그 전 각각) */
const MIN_TREND_SHOWS = 5;

/** 평균 위치 기록에 넣는 최소 횟수 — 몇 번 안 부른 곡은 위치가 우연에 가깝다. */
const MIN_POSITION_PLAYS = 5;

/**
 * 세트리스트 안의 자리·흐름 — 본편 마지막 곡, 공연 마지막 곡, 본편 평균 위치(초반·
 * 후반), 이어 부른 두 곡, 다른 버전, 커버곡. 순서는 공연일의 mainOrder·encoreOrder
 * (곡 순서를 아는 공연일만).
 */
function setlistRecords(
  stats: SongStat[],
  known: LiveUnit[],
  all: LiveUnit[],
): RawRecord[] {
  const statById = new Map(stats.map((stat) => [stat.song.id, stat]));
  const ordered = known.filter((unit) => unit.mainOrder?.length);
  const songTrend = (key: string) => {
    const stat = statById.get(key);
    return stat ? yearlyTrend("해마다 라이브 횟수", known, stat.played) : null;
  };

  // 자리별 단골 — pool(대상 공연일)에서 pick이 고른 곡을 센다. "부른 날 중"은 pool
  // 중 그 곡을 부른 날에서의 비율. 커버곡 자리("cover:…")는 곡이 아니라 건너뛴다.
  const slotRows = (
    pool: LiveUnit[],
    poolLabel: string,
    pick: (unit: LiveUnit) => string | undefined,
  ) => {
    const inPool = new Set(pool.map((unit) => unit.id));
    const counts = new Map<string, number>();
    for (const unit of pool) {
      const id = pick(unit);
      if (id && statById.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const items = [...counts].map(([id, count]) => {
      const stat = statById.get(id)!;
      const base = stat.played.filter((unit) => inPool.has(unit.id)).length;
      return { stat, count, base };
    });
    return rank(
      items,
      (item) => item.count,
      "desc",
      (item) =>
        songRow(
          item.stat.song,
          [
            times(item.count),
            percent(item.count, pool.length),
            percent(item.count, item.base),
          ],
          `${poolLabel} ${pool.length}회 중 ${percent(item.count, pool.length)} · 그중 부른 날 ${item.base}회 중 ${percent(item.count, item.base)}`,
        ),
      (a, b) => b.count / b.base - a.count / a.base,
    );
  };
  // 본편 마지막 곡은 앵콜이 있던 공연일만 — 앵콜이 없거나 기록되지 않은 날(페스티벌
  // 등)의 본편 마지막은 공연 마지막 곡과 같아서.
  const withEncore = ordered.filter((unit) => unit.encoreOrder?.length);

  // 본편 평균 위치 — 첫 곡 0%, 마지막 곡 100%.
  const positions = new Map<string, number[]>();
  for (const unit of ordered) {
    const order = unit.mainOrder!;
    if (order.length < 2) continue;
    order.forEach((id, index) => {
      if (!statById.has(id)) return;
      positions.set(id, [
        ...(positions.get(id) ?? []),
        index / (order.length - 1),
      ]);
    });
  }
  const placed = [...positions]
    .filter(([, list]) => list.length >= MIN_POSITION_PLAYS)
    .map(([id, list]) => ({
      stat: statById.get(id)!,
      average: list.reduce((sum, value) => sum + value, 0) / list.length,
      count: list.length,
    }));
  const positionText = (value: number) => `${Math.round(value * 100)}% 지점`;
  const positionRows = (order: "asc" | "desc") =>
    rank(
      placed,
      (item) => Math.round(item.average * 100),
      order,
      (item) =>
        songRow(
          item.stat.song,
          [positionText(item.average), times(item.count)],
          `본편 ${times(item.count)} 평균 ${positionText(item.average)}(첫 곡 0% · 본편 마지막 곡 100%)`,
        ),
      (a, b) => b.count - a.count,
    );

  // 이어 부른 두 곡 — 본편·앵콜 안에서 바로 다음 곡(앵콜 첫 곡은 본편 마지막과 잇지 않는다).
  // 순위는 이어 부른 투어·공연(투어면 투어 하나, 아니면 공연 하나) 수로 — 공연일 수로
  // 세면 세트리스트가 고정된 투어 하나의 곡 쌍이 전부 같은 횟수로 1위를 덮는다.
  const pairs = new Map<
    string,
    { from: SongStat; to: SongStat; count: number; groups: Set<string> }
  >();
  for (const unit of ordered) {
    for (const order of [unit.mainOrder!, unit.encoreOrder ?? []]) {
      for (let i = 1; i < order.length; i++) {
        const [from, to] = [statById.get(order[i - 1]), statById.get(order[i])];
        if (!from || !to) continue;
        const key = `${from.song.id}>${to.song.id}`;
        const pair = pairs.get(key) ?? {
          from,
          to,
          count: 0,
          groups: new Set<string>(),
        };
        pair.count += 1;
        pair.groups.add(unit.tourId ?? unit.liveId);
        pairs.set(key, pair);
      }
    }
  }
  const songName = (song: StatSong) => song.titleKo || song.title;

  // 다른 버전으로 부른 곡(short·acoustic …)
  const versions = new Map<
    string,
    { stat: SongStat; units: LiveUnit[]; names: string[] }
  >();
  for (const unit of known) {
    for (const { songId, name } of unit.variations ?? []) {
      const stat = statById.get(songId);
      if (!stat) continue;
      const item = versions.get(songId) ?? { stat, units: [], names: [] };
      if (!item.units.includes(unit)) item.units.push(unit);
      if (!item.names.includes(name)) item.names.push(name);
      versions.set(songId, item);
    }
  }

  // 커버곡 — 제목이 같으면 하나로.
  const covers = new Map<
    string,
    {
      title: string;
      titleKo: string | null;
      artist: string | null;
      units: LiveUnit[];
    }
  >();
  for (const unit of all) {
    for (const cover of unit.covers ?? []) {
      const item = covers.get(cover.title) ?? { ...cover, units: [] };
      item.units.push(unit);
      covers.set(cover.title, item);
    }
  }

  return [
    {
      id: "setlist-closer",
      title: "본편 마지막 곡 단골",
      description: "앵콜 전 마지막 곡",
      detail: `앵콜이 있던 공연일(곡 순서를 아는 ${withEncore.length}회)에서 앵콜 전 본편을 마무리한 곡 · "부른 날 중"은 그중 그 곡을 부른 날에서 본편 마지막이었던 비율`,
      columns: ["마지막 곡 횟수", "전체 중", "부른 날 중"],
      trendFor: songTrend,
      rows: slotRows(withEncore, "앵콜이 있던 공연일", (unit) =>
        unit.mainOrder!.at(-1),
      ),
    },
    {
      id: "setlist-finale",
      title: "공연 마지막 곡 단골",
      description: "그날의 마지막 곡",
      detail:
        '앵콜이 있으면 앵콜 마지막, 없거나 기록되지 않았으면 본편 마지막 곡(곡 순서를 아는 공연일) · "부른 날 중"은 그 곡을 부른 날에서 마지막이었던 비율',
      columns: ["마지막 곡 횟수", "전체 중", "부른 날 중"],
      trendFor: songTrend,
      rows: slotRows(
        ordered,
        "곡 순서를 아는 공연일",
        (unit) => unit.encoreOrder?.at(-1) ?? unit.mainOrder!.at(-1),
      ),
    },
    {
      id: "setlist-early",
      bars: false,
      title: "공연 초반에 주로 부르는 곡",
      description: "본편 평균 위치가 앞인 곡",
      detail: `본편 평균 위치가 앞인 곡(첫 곡 0% · 본편 마지막 곡 100%, 본편에서 ${MIN_POSITION_PLAYS}회 이상)`,
      columns: ["평균 위치", "본편 횟수"],
      rows: positionRows("asc"),
    },
    {
      id: "setlist-late",
      bars: false,
      title: "공연 후반에 주로 부르는 곡",
      description: "본편 평균 위치가 뒤인 곡",
      detail: `본편 평균 위치가 뒤인 곡(첫 곡 0% · 본편 마지막 곡 100%, 본편에서 ${MIN_POSITION_PLAYS}회 이상)`,
      columns: ["평균 위치", "본편 횟수"],
      rows: positionRows("desc"),
    },
    {
      id: "setlist-pairs",
      title: "가장 자주 이어 부른 두 곡",
      description: "여러 투어·공연에 걸쳐 바로 이어 부른 두 곡",
      detail:
        '본편·앵콜 안에서 바로 이어 부른 투어·공연 수(투어는 하나로, 2곳 이상) · "앞 곡 부른 날 중"은 앞 곡을 부른 공연일 중 이어진 비율',
      columns: ["투어·공연", "공연일", "앞 곡 부른 날 중"],
      rows: rank(
        [...pairs.values()].filter((pair) => pair.groups.size >= 2),
        (pair) => pair.groups.size,
        "desc",
        (pair) => {
          const inOrdered = new Set(ordered.map((unit) => unit.id));
          const base = pair.from.played.filter((unit) =>
            inOrdered.has(unit.id),
          ).length;
          return {
            key: `${pair.from.song.id}>${pair.to.song.id}`,
            name: `${songName(pair.from.song)} → ${songName(pair.to.song)}`,
            image: pair.from.song.cover,
            href: `/zutopia/songs?song=${pair.from.song.slug}`,
            cells: [
              `${pair.groups.size}곳`,
              times(pair.count),
              percent(pair.count, base),
            ],
            note: `투어·공연 ${pair.groups.size}곳 · 「${songName(pair.from.song)}」 부른 날 ${base}회 중 ${percent(pair.count, base)}`,
          };
        },
        (a, b) => b.count - a.count,
      ),
    },
    {
      id: "setlist-versions",
      title: "다른 버전으로 가장 많이 부른 곡",
      description: "short·acoustic 등으로 부른 횟수",
      detail:
        "short·acoustic·jazz 등 원래와 다른 버전으로 부른 공연일 수(세트리스트 메모 기준)",
      columns: ["횟수", "버전"],
      trendFor: (key) => {
        const item = versions.get(key);
        return item ? yearlyTrend("해마다 다른 버전", known, item.units) : null;
      },
      rows: rank(
        [...versions.values()],
        (item) => item.units.length,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [times(item.units.length), item.names.join(", ")],
            item.names.join(" · "),
          ),
      ),
    },
    {
      id: "setlist-covers",
      title: "가장 많이 부른 커버곡",
      description: "다른 가수의 곡",
      detail: "다른 가수의 곡을 부른 공연일 수(제목이 같으면 하나로)",
      columns: ["횟수", "원곡 가수", "마지막 라이브"],
      rows: rank(
        [...covers.values()],
        (item) => item.units.length,
        "desc",
        (item) => {
          const last = item.units.at(-1)!;
          return {
            key: `cover:${item.title}`,
            // 통계는 한글 제목 위주 — 원제는 아래 작은 줄에.
            name: item.titleKo ?? item.title,
            sub:
              item.titleKo && item.titleKo !== item.title ? item.title : null,
            cells: [
              times(item.units.length),
              item.artist ?? "–",
              unitCell(last),
            ],
            note: `${item.artist ? `${item.artist} · ` : ""}마지막 ${unitText(last)}`,
          };
        },
        (a, b) => b.units.at(-1)!.date.localeCompare(a.units.at(-1)!.date),
      ),
    },
  ];
}

// ─── 앨범 ──────────────────────────────────────────────────────────────

function albumRecords(albums: StatAlbum[], stats: SongStat[]): RawRecord[] {
  const bySong = new Map(stats.map((stat) => [stat.song.id, stat]));
  const items = albums
    .map((album) => {
      const songs = album.songIds.flatMap((id) => bySong.get(id) ?? []);
      // 수록곡 평균 참가율 — 발매 후 공연일이 있는 수록곡만(신곡은 아직 셀 수 없다).
      const rated = songs.filter((stat) => stat.eligible > 0);
      return {
        album,
        total: songs.reduce((sum, stat) => sum + stat.played.length, 0),
        songCount: songs.length,
        playedCount: songs.filter((stat) => stat.played.length > 0).length,
        averageRate: rated.length
          ? rated.reduce(
              (sum, stat) => sum + stat.playedSinceRelease / stat.eligible,
              0,
            ) / rated.length
          : null,
        ratedCount: rated.length,
      };
    })
    .filter((item) => item.songCount > 0);

  type Item = (typeof items)[number];
  const row = (item: Item, cells: StatCell[], note: string) => ({
    key: item.album.id,
    name: item.album.title,
    sub: item.album.titleKo !== item.album.title ? item.album.titleKo : null,
    image: item.album.cover,
    href: `/zutopia/albums?album=${item.album.slug}`,
    cells,
    note,
  });
  const coverage = (item: Item) => `${item.playedCount}/${item.songCount}곡`;
  // 1위 앨범 수록곡의 해마다 라이브 횟수 합계.
  const known = [
    ...new Map(
      stats.flatMap((stat) => stat.played).map((unit) => [unit.id, unit]),
    ).values(),
  ];
  const albumTrend = (key: string) => {
    const album = albums.find((item) => item.id === key);
    if (!album) return null;
    const ids = new Set(album.songIds);
    return yearlyTrend(
      "해마다 수록곡 라이브 횟수",
      known,
      known,
      (unit) => unit.songIds.filter((id) => ids.has(id)).length,
    );
  };
  const note = (item: Item) =>
    `수록곡 ${item.songCount}곡 중 ${item.playedCount}곡 라이브 · 합계 ${times(item.total)}`;

  return [
    {
      id: "album-most-played",
      trendFor: albumTrend,
      title: "라이브에서 가장 많이 불린 앨범",
      description: "수록곡 라이브 횟수 합계",
      detail: "수록곡 라이브 횟수 합계(세트리스트가 있는 공연일 기준)",
      columns: ["합계", "라이브된 수록곡"],
      rows: rank(
        items,
        (item) => item.total,
        "desc",
        (item) => row(item, [times(item.total), coverage(item)], note(item)),
      ),
    },
    {
      // 한 번이라도 부른 수록곡 비율은 거의 모든 앨범이 100%라 가르지 못해서, 수록곡이
      // 공연마다 얼마나 자주 나오는지(평균 참가율)로 잰다.
      id: "album-rate",
      trendFor: albumTrend,
      title: "수록곡이 가장 자주 불리는 앨범",
      description: "수록곡 평균 참가율",
      detail:
        "수록곡마다 발매 후 세트리스트가 있는 공연일 중 부른 비율의 평균(발매 후 공연일이 아직 없는 곡은 빠짐)",
      columns: ["평균 참가율", "라이브된 수록곡", "합계"],
      rows: rank(
        items.filter((item) => item.averageRate != null),
        (item) => Math.round(item.averageRate! * 1000),
        "desc",
        (item) =>
          row(
            item,
            [percent(item.averageRate!, 1), coverage(item), times(item.total)],
            `수록곡 ${item.ratedCount}곡 평균 참가율 ${percent(item.averageRate!, 1)} · 합계 ${times(item.total)}`,
          ),
        (a, b) => b.total - a.total,
      ),
    },
    {
      id: "album-least-played",
      title: "라이브에서 가장 적게 불린 앨범",
      description: "수록곡 라이브 횟수 합계가 적은 순",
      detail: "수록곡 라이브 횟수 합계가 적은 순",
      columns: ["합계", "라이브된 수록곡"],
      rows: rank(
        items,
        (item) => item.total,
        "asc",
        (item) => row(item, [times(item.total), coverage(item)], note(item)),
      ),
    },
  ];
}

/**
 * 해마다 가장 많이 불린 앨범 — 그해 세트리스트가 있는 공연일의 곡 라이브 횟수를
 * 앨범별로 더해, 1위 앨범과 그 비중(그해 앨범 수록곡 라이브 합계 중). 한 곡이
 * 여러 앨범에 실렸으면 앨범마다 센다. 줄은 최신 해 먼저(순위 = 해 순서).
 */
function albumYearRecords(albums: StatAlbum[], stats: SongStat[]): RawRecord[] {
  const years = new Map<string, Map<string, number>>();
  const albumsBySong = new Map<string, StatAlbum[]>();
  for (const album of albums)
    for (const id of album.songIds)
      albumsBySong.set(id, [...(albumsBySong.get(id) ?? []), album]);
  for (const stat of stats)
    for (const unit of stat.played) {
      const year = unit.date.slice(0, 4);
      const counts = years.get(year) ?? new Map<string, number>();
      for (const album of albumsBySong.get(stat.song.id) ?? [])
        counts.set(album.id, (counts.get(album.id) ?? 0) + 1);
      years.set(year, counts);
    }
  const byId = new Map(albums.map((album) => [album.id, album]));
  const items = [...years]
    .flatMap(([year, counts]) => {
      const sorted = [...counts].sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return [];
      const total = sorted.reduce((sum, [, count]) => sum + count, 0);
      const [id, count] = sorted[0];
      return [{ year, album: byId.get(id)!, count, total }];
    })
    .sort((a, b) => b.year.localeCompare(a.year));
  return [
    {
      id: "album-by-year",
      title: "해마다 가장 많이 불린 앨범",
      description: "그해 수록곡을 가장 많이 부른 앨범",
      detail:
        "그해 세트리스트가 있는 공연일에 수록곡을 가장 많이 부른 앨범(최신 해 먼저) · 비중은 그해 앨범 수록곡 라이브 합계 중(여러 앨범에 실린 곡은 앨범마다 셈)",
      columns: ["앨범", "비중", "수록곡 라이브"],
      rows: items.map((item, index) => ({
        key: item.year,
        rank: index + 1,
        name: `${item.year}년`,
        image: item.album.cover,
        href: `/zutopia/albums?album=${item.album.slug}`,
        cells: [
          item.album.title,
          percent(item.count, item.total),
          times(item.count),
        ],
        note: `${item.album.title} · 그해 ${percent(item.count, item.total)}`,
      })),
    },
  ];
}

// ─── 공연 ──────────────────────────────────────────────────────────────

/** 공연 목록과 같은 종류 구분 — 투어 소속이면 투어, 페스티벌, 그 밖은 콘서트. */
function entryTypeOf(unit: LiveUnit): ZutopiaEntryType {
  if (unit.tourId) return "tour";
  return unit.type === "FESTIVAL" ? "festival" : "concert";
}

/**
 * 해마다 이름에 붙는 연도 표기를 뗀 페스티벌 이름 — "FUJI ROCK FESTIVAL '19",
 * "COUNTDOWN JAPAN 19/20", "OSAKA GIGANTIC MUSIC FESTIVAL 2022"를 같은 페스티벌로 묶는다.
 */
export function festivalKey(title: string): string {
  return title
    .replace(/\s*(\d{2}\/\d{2}|'\d{2}|(?<!\d)\d{4}(?!\d))/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 이름에 붙은 회차 표기('19, 19/20, 2024) — 없으면 시작 연도. */
function festivalEdition(unit: LiveUnit): string {
  return (
    unit.title.match(/\d{2}\/\d{2}|'\d{2}|(?<!\d)\d{4}(?!\d)/)?.[0] ??
    unit.date.slice(0, 4)
  );
}

function liveRecords(
  all: LiveUnit[],
  known: LiveUnit[],
  stats: SongStat[],
  input: {
    upcoming: LiveUnit[];
    tours: StatTour[];
    songs: StatSong[];
    unreleasedSongs?: StatSong[];
    canceledTourIds?: string[];
  },
  emptyTours: (Span & { tour: StatTour })[],
  context: Context,
): RawRecord[] {
  // 그 공연일에 처음 라이브로 부른 곡
  const debutsByUnit = new Map<string, StatSong[]>();
  for (const stat of stats) {
    const first = stat.played[0];
    if (!first) continue;
    // 그 앞에 세트리스트를 모르는 공연이 있으면 진짜 첫 공개인지 모른다.
    if (unknownBeforeFirst(context, first, stat.song.releaseDate, stat.song.id))
      continue;
    debutsByUnit.set(first.id, [
      ...(debutsByUnit.get(first.id) ?? []),
      stat.song,
    ]);
  }
  const debutUnits = known.filter((unit) => debutsByUnit.has(unit.id));

  // 투어 — 기간과 공연 횟수(예정 포함)
  const showsByTour = new Map<string, number>();
  for (const unit of [...all, ...input.upcoming])
    if (unit.tourId)
      showsByTour.set(unit.tourId, (showsByTour.get(unit.tourId) ?? 0) + 1);
  // 공연일이 전부 취소된 투어(남은 공연 0회 + 취소된 공연일 있음)는 열리지 않은
  // 투어라 가장 긴 투어에서 뺀다.
  const canceledTours = new Set(input.canceledTourIds ?? []);
  const tours = input.tours
    .map((tour) => ({
      tour,
      span: diffDays(tour.startDate, tour.endDate ?? tour.startDate) + 1,
      shows: showsByTour.get(tour.id) ?? 0,
    }))
    .filter((item) => item.shows > 0 || !canceledTours.has(item.tour.id));

  // 해마다 공연 횟수
  const years = new Map<string, LiveUnit[]>();
  for (const unit of all) {
    const year = unit.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), unit]);
  }
  const typeBreakdown = (units: LiveUnit[]) =>
    ENTRY_TYPE_ORDER.map((type) => {
      const count = units.filter((unit) => entryTypeOf(unit) === type).length;
      return count > 0 ? `${ENTRY_TYPE_LABEL[type]} ${count}` : null;
    })
      .filter(Boolean)
      .join(" · ");

  // 공연 사이 공백 — 공연일과 공연일이 없는 투어 기간을 "공연이 있던 때"로 이어
  // 붙이고, 그 사이 빈 기간을 잰다.
  const busy: (Span & { label: string; href: string | null })[] = [
    ...all.map((unit) => ({
      from: unit.date,
      to: unit.date,
      label: unitName(unit),
      href: unit.href,
    })),
    ...emptyTours.map((span) => ({
      ...span,
      label: span.tour.titleKo,
      href: `/zutopia/lives/${span.tour.slug}`,
    })),
  ].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  const gaps: {
    from: (typeof busy)[number];
    to: (typeof busy)[number];
    gap: number;
  }[] = [];
  let reach = busy[0];
  for (const span of busy.slice(1)) {
    if (span.from > reach.to) {
      const gap = diffDays(reach.to, span.from);
      if (gap > 1) gaps.push({ from: reach, to: span, gap });
      reach = span;
    } else if (span.to > reach.to)
      reach = { ...reach, to: span.to, label: span.label, href: span.href };
  }

  // 투어 비교 — 세트리스트가 있는 공연일만. 고정률 = 그 투어의 확인된 모든 공연일에
  // 부른 곡 수 / 공연일 평균 곡 수, 다른 곡 = 투어에서 부른 곡 중 그 공통 곡이 아닌 곡,
  // 신곡 비중 = 공연일 기준 발매 1년 안이거나 아직 발매 전인 곡(미공개곡 포함)의 비율.
  const songById = new Map(input.songs.map((song) => [song.id, song]));
  // 아직 음원이 없는 곡(미공개곡)은 늘 신곡으로 센다.
  const unreleasedIds = new Set(
    (input.unreleasedSongs ?? []).map((song) => song.id),
  );
  const tourComparisons = input.tours.flatMap((tour) => {
    const units = known.filter((unit) => unit.tourId === tour.id);
    if (units.length === 0) return [];
    const sets = units.map((unit) => new Set(unit.songIds));
    const everySong = new Set(units.flatMap((unit) => unit.songIds));
    const common = [...everySong].filter((id) =>
      sets.every((set) => set.has(id)),
    );
    const average =
      units.reduce((sum, unit) => sum + unit.songIds.length, 0) / units.length;
    let plays = 0;
    let fresh = 0;
    for (const unit of units)
      for (const id of unit.songIds) {
        const song = songById.get(id);
        if (unreleasedIds.has(id)) {
          plays += 1;
          fresh += 1;
          continue;
        }
        if (!song) continue;
        plays += 1;
        if (diffDays(song.releaseDate, unit.date) < 365) fresh += 1;
      }
    return [
      {
        tour,
        units,
        common: common.length,
        distinct: everySong.size,
        fixed: average > 0 ? common.length / average : 0,
        plays,
        fresh,
      },
    ];
  });
  type TourComparison = (typeof tourComparisons)[number];
  const tourRow = (item: TourComparison, cells: StatCell[], note: string) => ({
    key: item.tour.id,
    name: item.tour.titleKo,
    sub: `${formatDotDate(item.tour.startDate)} – ${formatDotDate(item.tour.endDate ?? item.tour.startDate)}`,
    image: item.tour.poster,
    href: `/zutopia/lives/${item.tour.slug}`,
    cells,
    note,
  });
  // 고정·다양함은 공연일이 2회 이상 확인된 투어만(하루면 모두 공통 곡이다).
  const comparable = tourComparisons.filter((item) => item.units.length >= 2);

  // 같은 페스티벌 출연 횟수
  const festivals = new Map<string, LiveUnit[]>();
  for (const unit of all) {
    if (unit.type !== "FESTIVAL") continue;
    const key = festivalKey(unit.title);
    festivals.set(key, [...(festivals.get(key) ?? []), unit]);
  }

  return [
    {
      id: "live-most-songs",
      title: "가장 많은 곡을 부른 공연",
      description: "세트리스트 곡 수",
      detail: "세트리스트의 곡 수(같은 곡은 한 번, 어레인지는 원곡으로)",
      columns: ["곡 수", "종류"],
      rows: rank(
        known,
        (unit) => unit.songIds.length,
        "desc",
        (unit) =>
          unitRow(unit, [
            `${unit.songIds.length}곡`,
            ENTRY_TYPE_LABEL[entryTypeOf(unit)],
          ]),
        byDate,
      ),
    },
    {
      id: "live-most-debuts",
      title: "라이브 첫 공개가 가장 많았던 공연",
      description: "그날 처음 부른 곡 수",
      detail: "그날 처음 라이브에서 부른 곡 수(미공개곡 포함)",
      columns: ["첫 공개", "곡"],
      rows: rank(
        debutUnits,
        (unit) => debutsByUnit.get(unit.id)!.length,
        "desc",
        (unit) => {
          const songs = debutsByUnit.get(unit.id)!;
          const names = songs.map((song) => song.titleKo).join(", ");
          return unitRow(unit, [`${songs.length}곡`, names], names);
        },
        byDate,
      ),
    },
    {
      id: "live-longest-tour",
      title: "가장 긴 투어",
      description: "첫 공연부터 마지막 공연까지",
      detail: "투어 첫날부터 마지막 날까지 기간(공연 횟수는 예정 포함)",
      columns: ["기간", "공연 횟수", "일정"],
      rows: rank(
        tours,
        (item) => item.span,
        "desc",
        (item) => {
          const period = `${formatDotDate(item.tour.startDate)} – ${formatDotDate(item.tour.endDate ?? item.tour.startDate)}`;
          return {
            key: item.tour.id,
            name: item.tour.titleKo,
            sub: period,
            image: item.tour.poster,
            href: `/zutopia/lives/${item.tour.slug}`,
            cells: [
              days(item.span),
              item.shows > 0 ? times(item.shows) : "–",
              period,
            ],
            note:
              item.shows > 0
                ? `${period} · ${times(item.shows)} 공연`
                : `${period} · 공연일 미등록`,
          };
        },
      ),
    },
    {
      id: "live-busiest-year",
      // 모든 해를 그리고 1위 해를 강조한다.
      trendFor: (key) => ({
        ...yearlyTrend("해마다 공연일", all, all),
        highlight: key,
      }),
      title: "공연이 가장 많았던 해",
      description: "그해 공연일 수",
      detail: `그해 공연일 수${emptyTourNote(context)}`,
      columns: ["공연", "종류별"],
      rows: rank(
        [...years],
        ([, units]) => units.length,
        "desc",
        ([year, units]) => ({
          key: year,
          name: `${year}년`,
          cells: [times(units.length), typeBreakdown(units)],
          note: typeBreakdown(units),
        }),
        ([a], [b]) => b.localeCompare(a),
      ),
    },
    {
      id: "live-longest-break",
      title: "가장 길었던 공연 공백",
      description: "연이은 두 공연일 사이",
      detail: `연이은 두 공연일 사이 간격${emptyTourBreakNote(context)}`,
      columns: ["공백", "이전 공연", "다음 공연"],
      rows: rank(
        gaps,
        (item) => item.gap,
        "desc",
        (item) => ({
          key: `${item.from.to}>${item.to.from}`,
          name: `${formatDotDate(item.from.to)} → ${formatDotDate(item.to.from)}`,
          sub: `${item.from.label} → ${item.to.label}`,
          cells: [
            days(item.gap),
            {
              date: formatDotDate(item.from.to),
              label: item.from.label,
              href: item.from.href,
            },
            {
              date: formatDotDate(item.to.from),
              label: item.to.label,
              href: item.to.href,
            },
          ],
          note: aboutYears(item.gap),
        }),
      ),
    },
    {
      id: "live-tour-fixed",
      title: "세트리스트가 가장 고정된 투어",
      description: "확인된 공연일 모두에서 부른 곡 비율",
      detail:
        "세트리스트를 아는 투어 공연일 모두에서 부른 곡 수 ÷ 공연일 평균 곡 수(확인된 공연일 2회 이상)",
      columns: ["고정률", "매번 부른 곡", "확인된 공연일"],
      rows: rank(
        comparable,
        (item) => Math.round(item.fixed * 100),
        "desc",
        (item) =>
          tourRow(
            item,
            [
              percent(item.fixed, 1),
              `${item.common}곡`,
              times(item.units.length),
            ],
            `확인된 공연일 ${item.units.length}회 모두 부른 곡 ${item.common}곡`,
          ),
        (a, b) => b.units.length - a.units.length,
      ),
    },
    {
      id: "live-tour-variety",
      title: "공연일마다 곡이 가장 많이 바뀐 투어",
      description: "공연일마다 바뀐 곡 수",
      detail:
        "투어에서 부른 곡 중 세트리스트를 아는 공연일 모두에서 부르지는 않은 곡 수(확인된 공연일 2회 이상)",
      columns: ["바뀐 곡", "투어 전체 곡", "확인된 공연일"],
      rows: rank(
        comparable,
        (item) => item.distinct - item.common,
        "desc",
        (item) =>
          tourRow(
            item,
            [
              `${item.distinct - item.common}곡`,
              `${item.distinct}곡`,
              times(item.units.length),
            ],
            `투어 전체 ${item.distinct}곡 중 공연일마다 바뀐 곡 ${item.distinct - item.common}곡`,
          ),
        (a, b) => b.units.length - a.units.length,
      ),
    },
    {
      id: "live-tour-new",
      title: "신곡 비중이 가장 높은 투어",
      description: "발매 1년 안·미공개 곡의 비율",
      detail:
        "세트리스트를 아는 공연일에 부른 곡 중 그날 기준 발매 1년 안이거나 아직 발매 전인 곡(미공개곡 포함)의 비율",
      columns: ["신곡 비중", "신곡 횟수", "확인된 공연일"],
      rows: rank(
        tourComparisons.filter((item) => item.plays > 0),
        (item) => Math.round((item.fresh / item.plays) * 100),
        "desc",
        (item) =>
          tourRow(
            item,
            [
              percent(item.fresh, item.plays),
              times(item.fresh),
              times(item.units.length),
            ],
            `부른 곡 ${times(item.plays)} 중 신곡 ${times(item.fresh)}`,
          ),
        (a, b) => b.fresh - a.fresh,
      ),
    },
    {
      id: "live-festival",
      title: "가장 많이 출연한 페스티벌",
      description: "같은 페스티벌 출연 횟수",
      detail: "연도 표기를 뗀 이름이 같은 페스티벌을 하나로",
      columns: ["출연", "회차"],
      rows: rank(
        [...festivals],
        ([, units]) => units.length,
        "desc",
        ([name, units]) => ({
          key: name,
          name,
          image: units.at(-1)!.imageUrl,
          href: units.at(-1)!.href,
          cells: [times(units.length), units.map(festivalEdition).join(", ")],
          note: units.map(festivalEdition).join(" · "),
        }),
      ),
    },
  ];
}

/** 내한 참가율을 셀 최소 한국 공연일 수(발매 후·그 곡을 불렀는지 아는 날) */
const MIN_KOREA_SHOWS = 3;

/**
 * 내한 공연(나라 "한국")에서 유독 자주 부른 곡 — 내한 참가율 − 그 밖 공연 참가율.
 * 세트리스트를 아는 내한 공연이 몇 회 안 돼 "가장 많이 부른 곡"은 여러 곡이 전부
 * 100%로 묶여서, 평소보다 얼마나 더 불렀는지로 잰다.
 */
function koreaRecords(stats: SongStat[]): RawRecord[] {
  const items = stats.flatMap((stat) => {
    const eligible = stat.known.filter(
      (unit) => unit.date >= stat.song.releaseDate,
    );
    const korea = eligible.filter((unit) => unit.country === "한국");
    const others = eligible.filter((unit) => unit.country !== "한국");
    if (korea.length < MIN_KOREA_SHOWS || others.length === 0) return [];
    const played = new Set(stat.played.map((unit) => unit.id));
    const count = (units: LiveUnit[]) =>
      units.filter((unit) => played.has(unit.id)).length;
    const [inKorea, elsewhere] = [count(korea), count(others)];
    const delta =
      Math.round((inKorea / korea.length) * 100) -
      Math.round((elsewhere / others.length) * 100);
    return delta > 0
      ? [{ stat, korea, others, inKorea, elsewhere, delta }]
      : [];
  });
  return [
    {
      id: "place-korea-songs",
      title: "내한 공연에서 유독 자주 부른 곡",
      description: "내한 참가율 − 그 밖 참가율",
      detail: `발매 후 세트리스트를 아는 한국 공연일 중 부른 비율 − 그 밖 공연일 중 부른 비율(한국 공연일 ${MIN_KOREA_SHOWS}회 이상인 곡)`,
      columns: ["차이", "내한", "그 밖"],
      rows: rank(
        items,
        (item) => item.delta,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [
              `+${item.delta}%p`,
              percent(item.inKorea, item.korea.length),
              percent(item.elsewhere, item.others.length),
            ],
            `내한 ${item.korea.length}회 중 ${item.inKorea}회 · 그 밖 ${item.others.length}회 중 ${item.elsewhere}회`,
          ),
        (a, b) => b.inKorea - a.inKorea,
      ),
    },
  ];
}

// ─── 장소 ──────────────────────────────────────────────────────────────

/**
 * 공연장 이름 — "幕張メッセ国際展示場 (1~11ホール) (마쿠하리 멧세 국제전시장(1~11홀))"
 * 처럼 홀 번호가 붙어도 같은 곳으로 묶는다. key는 원어 이름에서 괄호를 모두 뗀 것,
 * label은 한글 이름(없으면 원어)에서 괄호를 뗀 것.
 */
export function venueName(venue: string): { key: string; label: string } {
  const { main, suffix } = splitParenSuffix(venue);
  const strip = (text: string) =>
    text
      .replace(/\s*\([^()]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const key = strip(main);
  // 끝 괄호가 한글이 아니면(영문 병기 등) 원어 이름을 그대로 쓴다.
  const label = suffix && /[가-힣]/.test(suffix) ? strip(suffix) || key : key;
  return { key, label };
}

function placeRecords(all: LiveUnit[], context: Context): RawRecord[] {
  const offline = all.filter((unit) => !isOnline(unit));
  const yearsOf = (units: LiveUnit[]) => {
    const first = units[0].date.slice(0, 4);
    const last = units.at(-1)!.date.slice(0, 4);
    return first === last ? first : `${first} – ${last}`;
  };

  const group = (keyOf: (unit: LiveUnit) => string | null) => {
    const map = new Map<string, LiveUnit[]>();
    for (const unit of offline) {
      const key = keyOf(unit);
      if (!key) continue;
      map.set(key, [...(map.get(key) ?? []), unit]);
    }
    return [...map];
  };

  const cities = group((unit) => unit.city || null);
  const venues = group((unit) =>
    unit.venue ? venueName(unit.venue).key : null,
  );
  const countries = group((unit) =>
    unit.country && unit.country !== "일본" ? unit.country : null,
  );
  const overseasTotal = countries.reduce(
    (sum, [, units]) => sum + units.length,
    0,
  );
  const unique = (values: string[]) => [...new Set(values)].join(", ");
  // 1위 장소의 해마다 공연일(가로축은 전체 공연일의 해).
  const placeTrend =
    (groups: [string, LiveUnit[]][]) =>
    (key: string): StatTrend | null => {
      const units = groups.find(([name]) => name === key)?.[1];
      return units ? yearlyTrend("해마다 공연일", offline, units) : null;
    };

  return [
    {
      id: "place-city",
      trendFor: placeTrend(cities),
      title: "가장 자주 공연한 도시",
      description: "공연일 수",
      detail: `공연일 기준(온라인 공연 제외)${emptyTourNote(context)}`,
      columns: ["공연", "기간"],
      rows: rank(
        cities,
        ([, units]) => units.length,
        "desc",
        ([city, units]) => ({
          key: city,
          name: city,
          sub: units[0].country ?? null,
          cells: [times(units.length), yearsOf(units)],
          note: yearsOf(units),
        }),
      ),
    },
    {
      id: "place-venue",
      trendFor: placeTrend(venues),
      title: "가장 자주 선 공연장",
      description: "공연일 수",
      detail: `홀 번호 등 괄호 안 표기가 달라도 같은 공연장은 하나로${emptyTourNote(context)}`,
      columns: ["공연", "도시", "기간"],
      rows: rank(
        venues,
        ([, units]) => units.length,
        "desc",
        ([key, units]) => {
          const { label } = venueName(units[0].venue!);
          return {
            key,
            name: label,
            sub: label !== key ? key : null,
            cells: [
              times(units.length),
              unique(units.map((unit) => unit.city)),
              yearsOf(units),
            ],
            note: `${unique(units.map((unit) => unit.city))} · ${yearsOf(units)}`,
          };
        },
      ),
    },
    {
      id: "place-overseas",
      trendFor: placeTrend(countries),
      title: "해외 공연이 가장 많았던 나라",
      description: "일본 밖 공연일 수",
      detail: `일본 밖 공연일(해외 공연 총 ${overseasTotal}회)${emptyTourNote(context)}`,
      columns: ["공연", "도시", "기간"],
      rows: rank(
        countries,
        ([, units]) => units.length,
        "desc",
        ([country, units]) => ({
          key: country,
          name: country,
          cells: [
            times(units.length),
            unique(units.map((unit) => unit.city)),
            yearsOf(units),
          ],
          note: `${unique(units.map((unit) => unit.city))} · ${yearsOf(units)}`,
        }),
      ),
    },
  ];
}
