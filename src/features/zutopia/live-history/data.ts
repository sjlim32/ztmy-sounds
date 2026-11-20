import { cache } from "react";
import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { koreaDate } from "@/lib/korea-date";
import {
  buildLiveUnits,
  buildUpcomingUnits,
  buildSongLiveStats,
} from "./units";
import { parseSetlistNote } from "@/features/zutopia/lives/setlist-note";
import type { LiveHistory, RawCoverRow } from "./types";

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
  const [
    livesResult,
    toursResult,
    setlistsResult,
    coversResult,
    versionsResult,
    originalOf,
  ] = await Promise.all([
    supabase
      .from("lives")
      .select(
        "id, slug, tour_id, title, title_ko, type, start_date, end_date, live_date, setlist_version_id, region, country, live_venue, icon_image_url, poster_image_url, metadata",
      )
      .eq("status", "ACTIVE"),
    supabase
      .from("tours")
      .select("id, slug, title, title_ko, poster_image_url")
      .eq("status", "ACTIVE"),
    // 세트리스트는 1000행(max_rows)을 넘을 수 있어(지금 약 800행) 끝까지 나눠 받는다(fetchAllRows).
    fetchAllRows((from, to) =>
      supabase
        .from("setlists")
        .select(
          "live_id, tour_id, version_id, song_id, day_number, show_number, track_number, is_encore, omitted, note, songs!inner(status)",
        )
        .eq("songs.status", "ACTIVE")
        .order("id")
        .range(from, to),
    ),
    // 곡이 연결되지 않은 커버곡(note.title) — 곡 기록엔 안 넣고 통계의 커버곡 기록과
    // 곡 순서(자리 차지)에만.
    fetchAllRows((from, to) =>
      supabase
        .from("setlists")
        .select(
          "live_id, tour_id, version_id, day_number, show_number, track_number, is_encore, omitted, note",
        )
        .is("song_id", null)
        .not("note", "is", null)
        .order("id")
        .range(from, to),
    ),
    // 투어 세트리스트 판 — 공연일마다 그 판의 투어 공통 행만 쓴다(units.ts).
    supabase
      .from("tour_setlist_versions")
      .select("id, tour_id, starts_on, label, fixed"),
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
  if (coversResult.error) {
    throw new Error(
      `커버곡 세트리스트를 가져오지 못했습니다: ${coversResult.error.message}`,
    );
  }
  if (versionsResult.error) {
    throw new Error(
      `투어 세트리스트 판을 가져오지 못했습니다: ${versionsResult.error.message}`,
    );
  }
  if (setlistsResult.error) {
    throw new Error(
      `세트리스트를 가져오지 못했습니다: ${setlistsResult.error.message}`,
    );
  }

  // 한국 날짜 기준(UTC면 한국 아침 9시 전 빌드에서 하루 어긋남).
  const today = koreaDate();
  const input = {
    lives: livesResult.data,
    tours: toursResult.data,
    // 곡이 연결된 행만(커버곡처럼 song_id가 빈 행은 즛토마요 곡 기록이 아니다).
    setlists: setlistsResult.data.flatMap(
      ({
        live_id,
        tour_id,
        version_id,
        song_id,
        day_number,
        show_number,
        track_number,
        is_encore,
        omitted,
        note,
      }) =>
        song_id
          ? [
              {
                live_id,
                tour_id,
                version_id,
                song_id,
                day_number,
                show_number,
                track_number,
                is_encore,
                omitted,
                note,
              },
            ]
          : [],
    ),
    covers: coversResult.data.flatMap((row): RawCoverRow[] => {
      const title = parseSetlistNote(row.note, "title");
      return title
        ? [
            {
              live_id: row.live_id,
              tour_id: row.tour_id,
              day_number: row.day_number,
              show_number: row.show_number,
              title,
              titleKo: parseSetlistNote(row.note, "title_kr"),
              artist: parseSetlistNote(row.note, "original_artist"),
              track_number: row.track_number,
              is_encore: row.is_encore,
              version_id: row.version_id,
              omitted: row.omitted,
            },
          ]
        : [];
    }),
    versions: versionsResult.data,
    originalOf,
  };
  const units = buildLiveUnits(input, today);
  return {
    units,
    upcoming: buildUpcomingUnits(input, today),
    statsBySongId: buildSongLiveStats(units),
  };
});
