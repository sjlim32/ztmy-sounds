import { cache } from "react";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getGuideHref } from "@/features/zutopia/guide-link";
import type { Json } from "@/lib/supabase/database.types";
import type { ZutopiaEntry, ZutopiaEntryType } from "@/features/zutopia/types";
import { parseVisitOrdinal } from "@/features/zutopia/lives/visit";
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
  return [year.slice(2), month, day];
}

/**
 * 목록 카드 전용 컴팩트 날짜 표시 — "YY.MM.DD" 기준, 범위면 겹치는 앞자리를
 * 생략한다: 연도·월이 같으면 "26.09.06 - 07", 연도만 같으면
 * "26.09.06 - 10.11", 아예 다르면 "26.09.06 - 27.01.01". 상세 페이지
 * 티켓 스텁이 쓰는 formatLiveDate(한글 "2026년 9월 6일" 표기)와는 완전히
 * 별도 포맷이라, 상세 페이지 표기는 이 함수와 무관하게 그대로 유지된다.
 */
function formatEntryDateRange(
  startDate: string,
  endDate: string | null,
): string {
  const [startYear, startMonth, startDay] = splitDateParts(startDate);
  if (!endDate || endDate === startDate) {
    return `${startYear}.${startMonth}.${startDay}`;
  }

  const [endYear, endMonth, endDay] = splitDateParts(endDate);
  if (startYear !== endYear) {
    return `${startYear}.${startMonth}.${startDay} - ${endYear}.${endMonth}.${endDay}`;
  }
  if (startMonth !== endMonth) {
    return `${startYear}.${startMonth}.${startDay} - ${endMonth}.${endDay}`;
  }
  return `${startYear}.${startMonth}.${startDay} - ${endDay}`;
}

const LIVE_TYPE_TO_ENTRY_TYPE: Record<Live["type"], ZutopiaEntryType> = {
  FESTIVAL: "festival",
  CONCERT: "concert",
  EVENT: "event",
};

/**
 * lives.region은 "大阪 (오사카)"처럼 "원어 (한글)" 형식이다 — 목록 카드엔
 * 한글 도시명만 보여준다. 괄호가 없는(패턴에 안 맞는) 값은 원본 그대로
 * 돌려준다.
 */
function extractKoreanCity(region: string): string {
  return splitRegion(region).city;
}

// "大阪 (오사카)" → { city: "오사카", original: "大阪" }. 괄호가 없으면 원본을
// 그대로 city로 쓴다.
function splitRegion(region: string): {
  city: string;
  original: string | null;
} {
  const match = region.match(/^(.*\S)\s*\(([^()]*)\)\s*$/);
  return match
    ? { city: match[2], original: match[1] }
    : { city: region, original: null };
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
      .select(
        "slug, title, title_ko, start_date, end_date, poster_image_url, icon_image_url, type, region, metadata",
      )
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
  const liveEntries: ZutopiaEntry[] = livesResult.data.flatMap((live) =>
    live.slug && !tourSlugs.has(live.slug)
      ? [
          {
            slug: live.slug,
            label: live.title_ko ?? live.title,
            name: live.title,
            date: formatEntryDateRange(live.start_date, live.end_date),
            thumbnail: live.icon_image_url ?? live.poster_image_url ?? "",
            type: LIVE_TYPE_TO_ENTRY_TYPE[live.type],
            startDate: live.start_date,
            city: extractKoreanCity(live.region),
            visitOrdinal: parseVisitOrdinal(live.metadata),
          },
        ]
      : [],
  );

  // 투어는 페스티벌 출연이 아니라 줏토마요 자신의 콘서트(투어)라 concert
  // 타입으로 분류한다.
  const tourEntries: ZutopiaEntry[] = toursResult.data.map((tour) => ({
    slug: tour.slug,
    label: tour.title_ko,
    name: tour.title,
    date: formatEntryDateRange(tour.start_date, tour.end_date),
    thumbnail: tour.poster_image_url ?? "",
    type: "concert",
    startDate: tour.start_date,
    visitOrdinal: parseVisitOrdinal(tour.metadata),
  }));

  return [...liveEntries, ...tourEntries].sort((a, b) =>
    (b.startDate ?? "").localeCompare(a.startDate ?? ""),
  );
}

const SETLIST_COLUMNS =
  "track_number, is_encore, day_number, note, songs!inner(id, slug, title, title_ko)";
const SETLIST_SELECT = `setlists(${SETLIST_COLUMNS})`;

interface SetlistRow {
  track_number: number;
  is_encore: boolean;
  day_number: number | null;
  note: Json | null;
  songs: { id: string; slug: string; title: string; title_ko: string };
}

function parseSetlistArrange(note: Json | null): string | null {
  if (!note || typeof note !== "object" || Array.isArray(note)) return null;
  if (
    "arrange" in note &&
    typeof (note as { arrange?: unknown }).arrange === "string"
  ) {
    const arrange = (note as { arrange: string }).arrange.trim();
    return arrange.length > 0 ? arrange : null;
  }
  return null;
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
      guideHref: getGuideHref(entry.songs.slug),
      trackNumber: entry.track_number,
      isEncore: entry.is_encore,
      isSelected: isSelected(entry),
      dayNumber: entry.day_number,
      arrange: parseSetlistArrange(entry.note),
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
 *   많이 쓰인 번호(같으면 앞 날) — 어느 날 데이터에 같은 곡이 두 번 들어간
 *   경우(예: INTENSE 서울 둘째날의 어둡게 검게 8·10번)에도 제자리를 지킨다.
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
    return { ...live, setlist: toSetlist(setlists) };
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
        `id, start_date, end_date, country, region, live_venue, icon_image_url, poster_image_url, additional_image_urls, ${SETLIST_SELECT}`,
      )
      .or(tourDateFilter(tour))
      .eq("status", "ACTIVE")
      .eq("setlists.songs.status", "ACTIVE")
      .order("start_date", { ascending: true });

    if (livesError) {
      throw new Error(
        `투어 공연 목록을 가져오지 못했습니다: ${livesError.message}`,
      );
    }

    const dates = lives.map((live) => {
      const { city, original } = splitRegion(live.region);
      return {
        id: live.id,
        date: formatLiveDateRange(live.start_date, live.end_date),
        startDate: live.start_date,
        endDate: live.end_date,
        country: live.country,
        city,
        cityOriginal: original,
        region: live.region,
        venue: live.live_venue,
        iconImageUrl: live.icon_image_url,
        posterImageUrl: live.poster_image_url,
        additionalImageUrls: live.additional_image_urls ?? [],
        setlist: mergeTourSetlist(tourSetlist, live.setlists),
      };
    });

    // 투어 공통 세트리스트(공연일마다 바뀌는 선택곡 제외) — 상세에서 한 번만
    // 보여주고, 공연일 행엔 그날의 선택곡만 미리 보여준다(TourDateList).
    return { ...tour, setlist: toSetlist(tourSetlist), dates };
  },
);
