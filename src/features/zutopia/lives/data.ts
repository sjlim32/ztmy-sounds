import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getGuideHref } from "@/features/zutopia/guide-link";
// registry.ts가 이 파일을 import하므로(Task 5, getEntries 연결), 여기서는
// 타입만 가져와 순환 참조를 피한다 — `import type`은 컴파일 시 완전히
// 제거되어 런타임 순환 require가 생기지 않는다.
import type {
  ZutopiaEntry,
  ZutopiaEntryType,
} from "@/features/zutopia/registry";
import type { LiveDetail } from "./types";

/** "2026-09-06" -> "2026년 9월 6일" (기존 정적 데이터 표기와 동일한 형식). */
function formatLiveDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

const LIVE_TYPE_TO_ENTRY_TYPE: Record<string, ZutopiaEntryType> = {
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
    thumbnail: live.poster_image_url ?? live.icon_image_url ?? "",
    type: LIVE_TYPE_TO_ENTRY_TYPE[live.type],
  }));
}

/**
 * 상세 페이지용 — 공연 정보 + 세트리스트(본편 먼저, 앙코르 나중, 각각
 * track_number 오름차순). 없는 슬러그는 null(호출부에서 notFound() 처리).
 */
export async function getLiveBySlug(slug: string): Promise<LiveDetail | null> {
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
}
