import { cache } from "react";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { withAssetUrls } from "@/lib/asset-url";
import { buildLiveUnits, buildSongLiveStats } from "./units";
import type { LiveHistory } from "./types";

/**
 * 어레인지 버전 곡 id → 원곡 id. 원곡은 키가 없다. 라이브 기록은 원곡 기준으로
 * 세므로(어레인지 버전 곡도 원곡 기록을 보여 준다) 집계와 표시가 모두 쓴다.
 */
export const getOriginalOf = cache(
  async (): Promise<Record<string, string>> => {
    const supabase = createBuildTimeSupabaseClient();
    const { data, error } = await supabase
      .from("songs")
      .select("id, original_song_id")
      .eq("status", "ACTIVE")
      .not("original_song_id", "is", null);

    if (error) {
      throw new Error(
        `어레인지 곡 정보를 가져오지 못했습니다: ${error.message}`,
      );
    }
    return Object.fromEntries(
      data.flatMap((song) =>
        song.original_song_id ? [[song.id, song.original_song_id]] : [],
      ),
    );
  },
);

/**
 * 모든 공연 단위(하루하루의 공연)와 곡별 라이브 기록 — 디스코그래피 마지막
 * 라이브, 참전 기록, 활동 연혁이 같이 쓴다. 빌드 시점 날짜 이후의
 * 공연은 뺀다.
 */
export const getLiveHistory = cache(async (): Promise<LiveHistory> => {
  const supabase = createBuildTimeSupabaseClient();
  const [livesResult, toursResult, setlistsResult, originalOf] =
    await Promise.all([
      supabase
        .from("lives")
        .select(
          "id, slug, tour_id, title, title_ko, type, start_date, end_date, live_date, region, icon_image_url, poster_image_url",
        )
        .eq("status", "ACTIVE"),
      supabase
        .from("tours")
        .select("id, slug, title, title_ko, poster_image_url")
        .eq("status", "ACTIVE"),
      supabase
        .from("setlists")
        .select("live_id, tour_id, song_id, day_number, songs!inner(status)")
        .eq("songs.status", "ACTIVE"),
      getOriginalOf(),
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
  if (setlistsResult.error) {
    throw new Error(
      `세트리스트를 가져오지 못했습니다: ${setlistsResult.error.message}`,
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const units = buildLiveUnits(
    {
      lives: livesResult.data.map(withAssetUrls),
      tours: toursResult.data.map(withAssetUrls),
      setlists: setlistsResult.data.map(
        ({ live_id, tour_id, song_id, day_number }) => ({
          live_id,
          tour_id,
          song_id,
          day_number,
        }),
      ),
      originalOf,
    },
    today,
  );
  return { units, statsBySongId: buildSongLiveStats(units) };
});
