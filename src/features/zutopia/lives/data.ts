import { cache } from "react";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getGuideHref } from "@/features/zutopia/guide-link";
import type { ZutopiaEntry, ZutopiaEntryType } from "@/features/zutopia/types";
import type { Live, LiveDetail } from "./types";

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

const LIVE_TYPE_TO_ENTRY_TYPE: Record<Live["type"], ZutopiaEntryType> = {
  FESTIVAL: "festival",
  CONCERT: "concert",
  EVENT: "event",
};

/** 허브/카테고리 목록 카드용 — lives 테이블에서 활성 공연만 최신순으로. */
export async function getLiveEntries(): Promise<ZutopiaEntry[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("lives")
    .select(
      "slug, title, title_ko, live_date, poster_image_url, icon_image_url, type",
    )
    .eq("status", "ACTIVE")
    .order("live_date", { ascending: false });

  if (error) {
    throw new Error(`공연 목록을 가져오지 못했습니다: ${error.message}`);
  }

  return data.map((live) => ({
    slug: live.slug,
    label: live.title_ko,
    name: live.title,
    date: formatLiveDate(live.live_date),
    thumbnail: live.icon_image_url ?? live.poster_image_url ?? "",
    type: LIVE_TYPE_TO_ENTRY_TYPE[live.type],
  }));
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
