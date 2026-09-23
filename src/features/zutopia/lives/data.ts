import { cache } from "react";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getGuideHref } from "@/features/zutopia/guide-link";
import type { ZutopiaEntry, ZutopiaEntryType } from "@/features/zutopia/types";
import type { Live, LiveDetail, TourDetail } from "./types";

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
  const match = region.match(/\(([^()]*)\)\s*$/);
  return match ? match[1] : region;
}

/**
 * 허브/카테고리 목록 카드용 — 두 출처를 하나의 목록으로 합친다.
 *
 * - lives: tour_id가 없는(어느 투어에도 안 묶인) 공연만 — 페스티벌 등
 *   단발성 출연이 여기 해당한다. tour_id가 있는 lives는 그 투어 항목
 *   안에 묶여야 하므로 목록에 따로 노출하지 않는다(아직은 tour_id가
 *   달린 lives 데이터가 없어 이 필터가 당장 뭔가를 걸러내진 않지만,
 *   투어별 개별 공연일이 추가되기 시작하면 필요해진다).
 * - tours: 줏토마요 자신이 헤드라이너인 단독 공연(투어) — 아직 개별
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
        "slug, title, title_ko, start_date, end_date, poster_image_url, icon_image_url, type, region",
      )
      .eq("status", "ACTIVE")
      .is("tour_id", null),
    supabase
      .from("tours")
      .select("slug, title, title_ko, start_date, end_date, poster_image_url")
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

  const liveEntries: ZutopiaEntry[] = livesResult.data.map((live) => ({
    slug: live.slug,
    label: live.title_ko,
    name: live.title,
    date: formatEntryDateRange(live.start_date, live.end_date),
    thumbnail: live.icon_image_url ?? live.poster_image_url ?? "",
    type: LIVE_TYPE_TO_ENTRY_TYPE[live.type],
    startDate: live.start_date,
    city: extractKoreanCity(live.region),
  }));

  // 투어는 페스티벌 출연이 아니라 줏토마요 자신의 "단독 공연"이라 concert
  // 타입으로 분류한다 — 목록 필터의 "단독 공연" 카테고리가 이걸 가리킨다.
  const tourEntries: ZutopiaEntry[] = toursResult.data.map((tour) => ({
    slug: tour.slug,
    label: tour.title_ko,
    name: tour.title,
    date: formatEntryDateRange(tour.start_date, tour.end_date),
    thumbnail: tour.poster_image_url ?? "",
    type: "concert",
    startDate: tour.start_date,
  }));

  return [...liveEntries, ...tourEntries].sort((a, b) =>
    (b.startDate ?? "").localeCompare(a.startDate ?? ""),
  );
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
      .select(
        "*, setlists(track_number, is_encore, songs!inner(id, slug, title, title_ko))",
      )
      .eq("slug", slug)
      .eq("status", "ACTIVE")
      .eq("setlists.songs.status", "ACTIVE")
      .maybeSingle();

    if (error) {
      throw new Error(`공연 정보를 가져오지 못했습니다: ${error.message}`);
    }
    if (!data) return null;

    const { setlists, ...live } = data;
    const setlist = [...setlists]
      .sort(
        (a, b) =>
          Number(a.is_encore) - Number(b.is_encore) ||
          a.track_number - b.track_number,
      )
      .map((entry) => ({
        songId: entry.songs.id,
        title: entry.songs.title,
        titleKo: entry.songs.title_ko,
        guideHref: getGuideHref(entry.songs.slug),
      }));

    return { ...live, setlist };
  },
);

/**
 * 투어 상세 페이지용. lives처럼 세트리스트는 없고, 대신 이 투어에 묶인
 * 개별 공연일(lives.tour_id로 연결)이 있으면 그 목록을 함께 내려준다 —
 * 아직 이런 데이터가 없는 투어는 dates가 빈 배열이 되고, 상세 페이지가
 * 그에 맞는 빈 상태를 보여준다. getLiveBySlug와 마찬가지로 같은 렌더
 * 패스 안 중복 조회를 막기 위해 cache()로 감싼다.
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

    const { data: lives, error: livesError } = await supabase
      .from("lives")
      .select("slug, title, title_ko, start_date, end_date, live_venue")
      .eq("tour_id", tour.id)
      .eq("status", "ACTIVE")
      .order("start_date", { ascending: true });

    if (livesError) {
      throw new Error(
        `투어 공연 목록을 가져오지 못했습니다: ${livesError.message}`,
      );
    }

    const dates = lives.map((live) => ({
      slug: live.slug,
      title: live.title,
      titleKo: live.title_ko,
      date: formatLiveDateRange(live.start_date, live.end_date),
      venue: live.live_venue,
    }));

    return { ...tour, dates };
  },
);
