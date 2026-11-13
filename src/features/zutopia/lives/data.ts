import { cache } from "react";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getGuideHref } from "@/features/zutopia/guide-link";
import type { Json } from "@/lib/supabase/database.types";
import type { ZutopiaEntry, ZutopiaEntryType } from "@/features/zutopia/types";
import { parseVisitOrdinal } from "@/features/zutopia/lives/visit";
import { parseSongMetadata } from "@/features/zutopia/song-db/song-metadata";
import {
  displayVenue,
  extractKoreanCity,
  isOnlineText,
  splitRegion,
} from "@/features/zutopia/lives/region";
import type { Live, LiveDetail, LiveSetlistEntry, TourDetail } from "./types";

/**
 * live_date는 timestamptz라 PostgREST가 "2026-09-06T00:00:00+00:00" 같은
 * 전체 타임스탬프 문자열로 내려준다 — 날짜 부분만 쓰면 되므로 "T" 앞부분만
 * 잘라 파싱한다. 이 파싱 없이 그대로 split("-")하면 시간대 오프셋 부분이
 * day 자리에 섞여 NaN이 될 수 있다(실제로 한 번 발생한 버그). 순수 날짜
 * 문자열("2026-09-06")도 그대로 지원한다.
 */
export function formatLiveDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("T")[0].split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

/**
 * 목록 카드는 공연(페스티벌) 전체 기간(start_date~end_date)을 보여준다 —
 * live_date(줏토마요가 실제로 서는 날짜)는 상세 페이지 전용이다. 같은
 * 날이거나 end_date가 없으면(단일 일자 공연) 범위 없이 하루만 보여준다.
 */
function formatLiveDateRange(
  startDate: string,
  endDate: string | null,
): string {
  const start = formatLiveDate(startDate);
  if (!endDate || endDate === startDate) return start;
  return `${start} ~ ${formatLiveDate(endDate)}`;
}

function splitDateParts(isoDate: string): [string, string, string] {
  const [year, month, day] = isoDate.split("T")[0].split("-");
  return [year, month, day];
}

/**
 * 목록 카드 전용 날짜 표시 — "2026.09.12", 범위면 "2026.09.12 – 09.21"
 * (해가 같으면 끝 날짜는 월.일만, 해를 넘기면 "2025.12.28 – 2026.01.02").
 * "– 21"처럼 일만 남기면 끝 날짜가 몇 월인지 한 번 더 읽어야 해서 월은 항상
 * 붙인다. 상세 페이지 티켓의 한글 표기(formatLiveDate)와는 별개다.
 */
function formatEntryDateRange(
  startDate: string,
  endDate: string | null,
): string {
  const [startYear, startMonth, startDay] = splitDateParts(startDate);
  const start = `${startYear}.${startMonth}.${startDay}`;
  if (!endDate || endDate === startDate) return start;

  const [endYear, endMonth, endDay] = splitDateParts(endDate);
  const end =
    startYear === endYear
      ? `${endMonth}.${endDay}`
      : `${endYear}.${endMonth}.${endDay}`;
  return `${start} – ${end}`;
}

// 페스티벌이 아닌 단독 공연(CONCERT·EVENT…)은 모두 콘서트로 묶는다.
function liveEntryType(type: Live["type"]): ZutopiaEntryType {
  return type === "FESTIVAL" ? "festival" : "concert";
}

const LIVE_ENTRY_COLUMNS =
  "slug, title, title_ko, start_date, end_date, poster_image_url, icon_image_url, type, region, live_venue, metadata";

type LiveEntryRow = Pick<
  Live,
  | "slug"
  | "title"
  | "title_ko"
  | "start_date"
  | "end_date"
  | "poster_image_url"
  | "icon_image_url"
  | "type"
  | "region"
  | "live_venue"
  | "metadata"
>;

/** 어느 투어에도 안 묶인 공연 행 → 목록 항목(투어 slug와 같은 행은 투어 소속이라 뺀다). */
function toStandaloneLiveEntries(
  lives: LiveEntryRow[],
  tourSlugs: Set<string | null>,
  extra?: Partial<ZutopiaEntry>,
): ZutopiaEntry[] {
  return lives.flatMap((live) =>
    live.slug && !tourSlugs.has(live.slug)
      ? [
          {
            slug: live.slug,
            label: live.title_ko ?? live.title,
            name: live.title,
            date: formatEntryDateRange(live.start_date, live.end_date),
            thumbnail: live.icon_image_url ?? live.poster_image_url ?? "",
            type: liveEntryType(live.type),
            startDate: live.start_date,
            // 온라인 공연은 도시 대신 그림 위 "온라인" 태그로(목록 카드).
            ...(isOnlineText(live.region) || isOnlineText(live.live_venue)
              ? { online: true }
              : { city: extractKoreanCity(live.region) }),
            visitOrdinal: parseVisitOrdinal(live.metadata),
            ...extra,
          },
        ]
      : [],
  );
}

/**
 * 취소된 단독 공연(lives.status = 'CANCELED', 투어 소속 아님) — 공연 목록 화면에만
 * 회색·취소선으로 보여 주고 누를 수 없다. 상세 페이지·사이트맵·검색·참전 기록·
 * 통계는 getLiveEntries(ACTIVE만)를 그대로 써서 취소 공연이 끼지 않는다. 투어
 * 소속 취소 공연일은 투어 상세 일정(getTourBySlug)에서 같은 모양으로 보인다.
 */
export async function getCanceledLiveEntries(): Promise<ZutopiaEntry[]> {
  const supabase = createBuildTimeSupabaseClient();
  const [livesResult, toursResult] = await Promise.all([
    supabase
      .from("lives")
      .select(LIVE_ENTRY_COLUMNS)
      .eq("status", "CANCELED")
      .is("tour_id", null),
    supabase.from("tours").select("slug").eq("status", "ACTIVE"),
  ]);
  if (livesResult.error) {
    throw new Error(
      `취소된 공연 목록을 가져오지 못했습니다: ${livesResult.error.message}`,
    );
  }
  if (toursResult.error) {
    throw new Error(
      `투어 목록을 가져오지 못했습니다: ${toursResult.error.message}`,
    );
  }
  return toStandaloneLiveEntries(
    livesResult.data,
    new Set(toursResult.data.map((tour) => tour.slug)),
    { canceled: true },
  );
}

/**
 * 허브/카테고리 목록 카드용 — 두 출처를 하나의 목록으로 합친다.
 *
 * - lives: 어느 투어에도 안 묶인 공연만 — 페스티벌 등 단발성 출연이
 *   여기 해당한다. 투어 소속 공연(tour_id가 있거나 slug가 투어 slug와
 *   같은 행 — isTourDate 참고)은 그 투어 항목 안에 묶이므로 따로
 *   노출하지 않는다.
 * - tours: 줏토마요 자신이 헤드라이너인 콘서트(투어) — 아직 개별
 *   공연일(lives) 데이터가 하나도 없어도, 투어 자체는 목록에 나와야
 *   한다(포스터·기간만으로 카드 하나를 만든다).
 *
 * 둘 다 시작일(start_date) 기준 최신순으로 정렬해 하나의 배열로 합친다.
 */
export async function getLiveEntries(): Promise<ZutopiaEntry[]> {
  const supabase = createBuildTimeSupabaseClient();

  const [livesResult, toursResult] = await Promise.all([
    supabase
      .from("lives")
      .select(LIVE_ENTRY_COLUMNS)
      .eq("status", "ACTIVE")
      .is("tour_id", null),
    supabase
      .from("tours")
      .select(
        "slug, title, title_ko, start_date, end_date, poster_image_url, metadata",
      )
      .eq("status", "ACTIVE"),
  ]);

  if (livesResult.error) {
    throw new Error(
      `공연 목록을 가져오지 못했습니다: ${livesResult.error.message}`,
    );
  }
  if (toursResult.error) {
    throw new Error(
      `투어 목록을 가져오지 못했습니다: ${toursResult.error.message}`,
    );
  }

  const tourSlugs = new Set(toursResult.data.map((tour) => tour.slug));
  const liveEntries = toStandaloneLiveEntries(livesResult.data, tourSlugs);

  const tourEntries: ZutopiaEntry[] = toursResult.data.map((tour) => ({
    slug: tour.slug,
    label: tour.title_ko,
    name: tour.title,
    date: formatEntryDateRange(tour.start_date, tour.end_date),
    thumbnail: tour.poster_image_url ?? "",
    type: "tour",
    startDate: tour.start_date,
    visitOrdinal: parseVisitOrdinal(tour.metadata),
  }));

  return [...liveEntries, ...tourEntries].sort((a, b) =>
    (b.startDate ?? "").localeCompare(a.startDate ?? ""),
  );
}

const SETLIST_COLUMNS =
  "track_number, is_encore, day_number, show_number, note, songs(id, slug, title, title_ko, title_en, metadata)";
const SETLIST_SELECT = `setlists(${SETLIST_COLUMNS})`;

interface SetlistSong {
  id: string;
  slug: string;
  title: string;
  title_ko: string;
  title_en: string;
  metadata: Json | null;
  /** 커버곡(즛토마요 곡이 아님) — 곡 행 없이 note.title로 만든 가짜 곡 */
  isCover?: boolean;
  /** 커버곡의 원곡 아티스트(note.original_artist) */
  coverArtist?: string | null;
}

interface SetlistRow {
  track_number: number;
  is_encore: boolean;
  day_number: number | null;
  show_number: number | null;
  note: Json | null;
  songs: SetlistSong;
}

/** 조회 결과 그대로 — 곡이 연결되지 않았거나(커버곡) 비활성 곡이면 songs가 null. */
type FetchedSetlistRow = Omit<SetlistRow, "songs"> & {
  songs: Omit<SetlistSong, "isCover" | "coverArtist"> | null;
};

/**
 * 조회한 세트리스트 행을 화면용으로 맞춘다 — 곡이 연결된 행은 그대로, 곡 없이
 * note.title이 있는 행(커버곡, note.info "cover")은 그 제목으로 가짜 곡을 만들고,
 * 둘 다 아니면(비활성 곡 등) 뺀다. 커버곡 id는 "cover:제목"이라 같은 공연 안에서
 * 다른 곡과 겹치지 않는다. 라이브 기록·통계(live-history)는 곡 행이 있는 것만 센다.
 */
function normalizeSetlistRows(rows: FetchedSetlistRow[]): SetlistRow[] {
  return rows.flatMap((row) => {
    if (row.songs) return [{ ...row, songs: row.songs }];
    const title = parseSetlistNote(row.note, "title");
    if (!title) return [];
    return [
      {
        ...row,
        songs: {
          id: `cover:${title}`,
          slug: "",
          title,
          // 한글 제목(note.title_kr) — 없으면 원제 그대로.
          title_ko: parseSetlistNote(row.note, "title_kr") ?? title,
          title_en: "",
          metadata: null,
          isCover: true,
          coverArtist: parseSetlistNote(row.note, "original_artist"),
        },
      },
    ];
  });
}

/** setlists.note의 글자 칸 하나(arrange·info·variation) — 없거나 비면 null. */
function parseSetlistNote(
  note: Json | null,
  key:
    "arrange" | "info" | "variation" | "title" | "title_kr" | "original_artist",
): string | null {
  if (!note || typeof note !== "object" || Array.isArray(note)) return null;
  const value = (note as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

// 본편 먼저, 앙코르 나중, 각각 track_number 오름차순, 동률이면 day_number 오름차순.
function toSetlist(
  rows: SetlistRow[],
  isSelected: (row: SetlistRow) => boolean = () => false,
): LiveSetlistEntry[] {
  return [...rows]
    .sort(
      (a, b) =>
        Number(a.is_encore) - Number(b.is_encore) ||
        a.track_number - b.track_number ||
        (a.day_number ?? 0) - (b.day_number ?? 0),
    )
    .map((entry) => ({
      songId: entry.songs.id,
      title: entry.songs.title,
      titleKo: entry.songs.title_ko,
      titleEn: entry.songs.title_en,
      guideHref: getGuideHref(entry.songs.slug),
      trackNumber: entry.track_number,
      isEncore: entry.is_encore,
      isSelected: isSelected(entry),
      dayNumber: entry.day_number,
      showNumber: entry.show_number,
      showLabel: null,
      arrange: parseSetlistNote(entry.note, "arrange"),
      info: parseSetlistNote(entry.note, "info"),
      variation: parseSetlistNote(entry.note, "variation"),
      unreleased: parseSongMetadata(entry.songs.metadata).isUnreleased,
      isCover: !!entry.songs.isCover,
      coverArtist: entry.songs.coverArtist ?? null,
    }));
}

/**
 * 투어 공연일 세트리스트 = 투어 공통 곡(setlists.tour_id) + 그 공연일에만
 * 있는 곡(setlists.live_id)을 track_number로 합친 것. 공연일 쪽에만 있는
 * 곡은 "선택곡"으로 표시한다 — 투어 공통 세트리스트의 빈 번호 자리를
 * 공연일마다 다른 곡으로 채우는 구성이다.
 *
 * 같은 곡이 양쪽에 다 있으면 한 번만, 공통 곡으로 보여주되 번호(·앙코르·
 * 일차)는 공연일 쪽을 따른다 — 공연일 세트리스트가 그날의 실제 순서라서다.
 * 투어 공통에선 15번인 곡이 어느 공연일엔 14번이면(예: INTENSE 홍콩의 잔기),
 * 투어 번호를 남기면 그 공연일의 15번 곡과 번호가 겹치고 14번이 빈다.
 */
function mergeTourSetlist(
  tourRows: SetlistRow[],
  rawLiveRows: SetlistRow[],
): LiveSetlistEntry[] {
  const tourSongIds = new Set(tourRows.map((row) => row.songs.id));
  const liveRows = collapseRepeatedDays(rawLiveRows, tourSongIds);
  const liveSongIds = new Set(liveRows.map((row) => row.songs.id));
  // 공연일에도 있는 공통 곡은 공연일 행으로 대신한다(번호를 공연일 기준으로).
  const tourOnly = tourRows.filter((row) => !liveSongIds.has(row.songs.id));
  const selected = new Set(
    liveRows.filter((row) => !tourSongIds.has(row.songs.id)),
  );
  return toSetlist([...tourOnly, ...liveRows], (row) => selected.has(row));
}

/**
 * 이틀 이상 공연(day_number가 있는 공연일)에서 날마다 세트리스트 전체를 따로
 * 등록한 경우, 같은 곡이 날마다 한 줄씩 반복되지 않게 한 줄로 합친다.
 * - 투어 공통 곡: 날짜와 상관없이 한 줄(일차 없음). 번호는 여러 날 중 가장
 *   많이 쓰인 번호(같으면 앞 날) — 어느 날 데이터에 같은 곡이 두 번 잘못
 *   들어간 경우에도 제자리를 지킨다.
 * - 그 밖의 곡(선택곡): 모든 날에 불렸으면 한 줄(일차 없음, 번호는 위와 같은
 *   방식), 아니면 날마다 따로(DAY 1·DAY 2 배지).
 */
function collapseRepeatedDays(
  rows: SetlistRow[],
  tourSongIds: Set<string>,
): SetlistRow[] {
  const days = new Set(
    rows.flatMap((row) => (row.day_number == null ? [] : [row.day_number])),
  );
  if (days.size < 2) return rows;

  const groups = new Map<string, SetlistRow[]>();
  for (const row of rows) {
    const key = `${row.songs.id}-${row.is_encore}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].flatMap((group) => {
    const groupDays = new Set(group.map((row) => row.day_number));
    const numbers = group.map((row) => row.track_number);
    // 모든 날에 불린 곡이면(번호가 조금 달라도) 일차 없이 한 줄 — 양일 같은
    // 선택곡은 "선택곡" 배지만 남는다.
    const sameEveryDay = [...days].every((day) => groupDays.has(day));
    if (!tourSongIds.has(group[0].songs.id) && !sameEveryDay) return group;
    const ordered = [...group].sort(
      (a, b) => (a.day_number ?? 0) - (b.day_number ?? 0),
    );
    const count = new Map<number, number>();
    for (const n of numbers) count.set(n, (count.get(n) ?? 0) + 1);
    const best = ordered.reduce((picked, row) =>
      (count.get(row.track_number) ?? 0) > (count.get(picked.track_number) ?? 0)
        ? row
        : picked,
    );
    return [{ ...best, day_number: null }];
  });
}

/**
 * 투어 소속 공연일을 찾는 PostgREST or 필터. 공연일은 tour_id로 묶는 게
 * 원칙이지만, slug에 투어 slug를 그대로 넣어(tour_id 없이) 등록된 행도
 * 있어 둘 다 투어 소속으로 본다.
 */
function tourDateFilter(tour: { id: string; slug: string }): string {
  return `tour_id.eq.${tour.id},slug.eq.${tour.slug}`;
}

/**
 * 상세 페이지용 — 공연 정보 + 세트리스트(본편 먼저, 앙코르 나중, 각각
 * track_number 오름차순). 없는 슬러그는 null(호출부에서 notFound() 처리).
 * generateMetadata와 페이지 컴포넌트가 같은 slug로 각자 호출하므로 React
 * cache()로 감싸 같은 렌더 패스 안에서 중복 Supabase 조회를 막는다.
 */
export const getLiveBySlug = cache(
  async (slug: string): Promise<LiveDetail | null> => {
    const supabase = createBuildTimeSupabaseClient();
    const { data, error } = await supabase
      .from("lives")
      .select(`*, ${SETLIST_SELECT}`)
      .eq("slug", slug)
      .eq("status", "ACTIVE")
      .eq("setlists.songs.status", "ACTIVE")
      .maybeSingle();

    if (error) {
      throw new Error(`공연 정보를 가져오지 못했습니다: ${error.message}`);
    }
    if (!data) return null;

    const { setlists, ...live } = data;
    return { ...live, setlist: toSetlist(normalizeSetlistRows(setlists)) };
  },
);

/**
 * 투어 상세 페이지용. 투어에 묶인 개별 공연일(lives.tour_id로 연결)은 자기
 * slug/상세 페이지가 없고 투어 slug 하나를 공유한다 — 공연일마다 장소,
 * 포스터/추가 이미지, 세트리스트만 함께 내려주고, 티켓·음원 링크는 tours
 * 행의 컬럼을 쓴다. 아직 공연일이 없는 투어는 dates가 빈 배열이 된다.
 * getLiveBySlug와 마찬가지로 같은 렌더 패스 안 중복 조회를 막기 위해
 * cache()로 감싼다.
 */
export const getTourBySlug = cache(
  async (slug: string): Promise<TourDetail | null> => {
    const supabase = createBuildTimeSupabaseClient();
    const { data: tour, error } = await supabase
      .from("tours")
      .select("*")
      .eq("slug", slug)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (error) {
      throw new Error(`투어 정보를 가져오지 못했습니다: ${error.message}`);
    }
    if (!tour) return null;

    const { data: tourSetlist, error: tourSetlistError } = await supabase
      .from("setlists")
      .select(SETLIST_COLUMNS)
      .eq("tour_id", tour.id)
      .eq("songs.status", "ACTIVE");

    if (tourSetlistError) {
      throw new Error(
        `투어 세트리스트를 가져오지 못했습니다: ${tourSetlistError.message}`,
      );
    }

    const { data: lives, error: livesError } = await supabase
      .from("lives")
      .select(
        `id, start_date, end_date, country, region, live_venue, icon_image_url, poster_image_url, additional_image_urls, status, ${SETLIST_SELECT}`,
      )
      .or(tourDateFilter(tour))
      // 취소된 공연일도 일정엔 회색·취소선으로 남긴다(누를 수 없음, TourDateList).
      .in("status", ["ACTIVE", "CANCELED"])
      .eq("setlists.songs.status", "ACTIVE")
      .order("start_date", { ascending: true });

    if (livesError) {
      throw new Error(
        `투어 공연 목록을 가져오지 못했습니다: ${livesError.message}`,
      );
    }

    const dates = lives.map((live) => {
      const { city, original } = splitRegion(live.region);
      const canceled = live.status === "CANCELED";
      return {
        id: live.id,
        date: formatLiveDateRange(live.start_date, live.end_date),
        startDate: live.start_date,
        endDate: live.end_date,
        country: live.country,
        city,
        cityOriginal: original,
        region: live.region,
        venue: displayVenue(live.live_venue),
        iconImageUrl: live.icon_image_url,
        posterImageUrl: live.poster_image_url,
        additionalImageUrls: live.additional_image_urls ?? [],
        canceled,
        // 취소된 공연일엔 투어 공통 세트리스트도 얹지 않는다(불린 곡이 없다).
        setlist: canceled
          ? []
          : mergeTourSetlist(
              normalizeSetlistRows(tourSetlist),
              normalizeSetlistRows(live.setlists),
            ),
      };
    });

    // 투어 공통 세트리스트(공연일마다 바뀌는 선택곡 제외) — 상세에서 한 번만
    // 보여주고, 공연일 행엔 그날의 선택곡만 미리 보여준다(TourDateList).
    return {
      ...tour,
      setlist: toSetlist(normalizeSetlistRows(tourSetlist)),
      dates,
    };
  },
);
