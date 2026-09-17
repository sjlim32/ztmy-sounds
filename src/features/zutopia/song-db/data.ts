import { createBuildTimeSupabaseClient } from "@/lib/supabase/build-time-client";
import { getGuideHref } from "@/features/zutopia/guide-link";
import type { Song } from "./types";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

type OriginalSongRef = Pick<
  Song,
  | "id"
  | "slug"
  | "title"
  | "title_ko"
  | "title_en"
  | "cover_image_url"
  | "music_video_url"
  | "streaming_urls"
  | "arranger"
  | "movie_director"
>;

/**
 * original_song_id의 self-FK를 PostgREST 임베드(`songs!original_song_id(...)`)
 * 로 조인하면 방향이 반대로 나온다 — "이 곡이 가리키는 원곡"이 아니라 "이
 * 곡을 원곡으로 가리키는 다른 버전들"이 나와서(원곡 쪽에 그 원곡의 어레인지
 * 버전이, 어레인지 버전 쪽엔 빈 배열이 나오는 걸 실제 데이터로 확인함),
 * 임베드 대신 필요한 원곡 id만 모아 별도 쿼리로 조회해 Map으로 직접
 * 매칭한다 — self-join 방향 문제 자체를 피해간다.
 */
async function fetchOriginalsById(
  supabase: ReturnType<typeof createBuildTimeSupabaseClient>,
  songs: { original_song_id: string | null }[],
): Promise<Map<string, OriginalSongRef>> {
  const ids = [
    ...new Set(
      songs
        .map((song) => song.original_song_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("songs")
    .select(
      "id, slug, title, title_ko, title_en, cover_image_url, music_video_url, streaming_urls, arranger, movie_director",
    )
    .in("id", ids);

  if (error) {
    throw new Error(`원곡 정보를 가져오지 못했습니다: ${error.message}`);
  }
  return new Map(data.map((original) => [original.id, original]));
}

/**
 * 어레인지 버전(original_song_id가 있는 곡)은 화면에 자기 자신의 정보가
 * 아니라 원곡 정보를 그대로 보여주고, title/title_ko에만 버전명을 붙여야
 * 한다 — 응원법 링크, 유튜브 영상, 스트리밍 링크, 편곡/영상 크레딧,
 * 커버까지 전부 원곡 기준이다. 컴포넌트마다 분기를 넣는 대신 데이터를
 * 내려주는 시점에 이 필드들 자체를 치환해서, 그대로 읽는 모든 화면(목록/
 * 상세/앨범 트랙리스트)에 자동으로 반영되게 한다.
 * title_en에는 버전명을 붙이지 않는다. release_date/id/slug/status 등 이
 * 릴리즈 자체에 대한 사실은 자기 자신 값을 유지한다 — 특히 slug는 song-db
 * 드로어가 URL(?song=<slug>)로 행을 구분하는 키라, 원곡 것으로 바꿔치기하면
 * 원곡과 어레인지 버전이 같은 slug를 갖게 되어 조회가 모호해진다. 응원
 * 가이드만 원곡 slug로 별도 조회한다.
 */
function resolveDisplaySong<T extends Song>(
  song: T,
  originalsById: Map<string, OriginalSongRef>,
): T & { guideHref: string | null } {
  const original = song.original_song_id
    ? (originalsById.get(song.original_song_id) ?? null)
    : null;
  const guideHref = getGuideHref(original?.slug ?? song.slug);

  if (!original) return { ...song, guideHref };

  const suffix = song.version_name ? ` (${song.version_name})` : "";
  return {
    ...song,
    title: `${original.title}${suffix}`,
    title_ko: `${original.title_ko}${suffix}`,
    title_en: original.title_en,
    guideHref,
  };
}

// 곡 페이지는 앨범 개수를, 앨범 페이지는 곡 개수를 SongDbNav 배지에 표시하기
// 위해서만 상대 데이터셋이 필요하다 — get*WithAlbums/get*WithSongs 전체를
// (모든 앨범/곡 정보를 다대다로 조인해서) 다시 불러오는 건 개수 하나 얻자고
// 이 기능에서 가장 비싼 쿼리를 페이지마다 불필요하게 한 번씩 더 실행하는
// 것과 같다. count-only 쿼리(head: true라 실제 행 데이터는 아예 안 옴)로
// 대체한다.
export async function getSongsCount(): Promise<number> {
  const supabase = createBuildTimeSupabaseClient();
  const { count, error } = await supabase
    .from("songs")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(`곡 개수를 가져오지 못했습니다: ${error.message}`);
  }
  return count ?? 0;
}

export async function getAlbumsCount(): Promise<number> {
  const supabase = createBuildTimeSupabaseClient();
  const { count, error } = await supabase
    .from("albums")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(`앨범 개수를 가져오지 못했습니다: ${error.message}`);
  }
  return count ?? 0;
}

export async function getSongsWithAlbums(): Promise<SongWithAlbums[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*, song_albums(track_number, disc_number, albums!inner(*))")
    .eq("status", "ACTIVE")
    .eq("song_albums.albums.status", "ACTIVE")
    .order("title");

  if (error) {
    throw new Error(`곡 목록을 가져오지 못했습니다: ${error.message}`);
  }

  const originalsById = await fetchOriginalsById(supabase, data);

  return data.map(({ song_albums, ...rawSong }) => {
    const song = resolveDisplaySong(rawSong, originalsById);
    // song_albums가 다대다라 같은 앨범을 가리키는 조인 행이 중복으로 들어올
    // 가능성(데이터 이상)을 방어적으로 걸러낸다 — 없으면 no-op, 있으면
    // React key 충돌과 UI 중복 표시를 막아준다. release_date 오름차순으로
    // 정렬해 "이 곡의 첫 번째 앨범"(커버 이미지 폴백 등에서 쓰임)이 매 빌드
    // 마다 임의 순서로 바뀌지 않도록 고정한다.
    const seenAlbumIds = new Set<string>();
    const albums = song_albums
      .filter((row) => {
        if (seenAlbumIds.has(row.albums.id)) return false;
        seenAlbumIds.add(row.albums.id);
        return true;
      })
      .map((row) => ({
        ...row.albums,
        track_number: row.track_number,
        disc_number: row.disc_number,
      }))
      .sort((a, b) => a.release_date.localeCompare(b.release_date));

    return { ...song, albums };
  });
}

export async function getAlbumsWithSongs(): Promise<AlbumWithSongs[]> {
  const supabase = createBuildTimeSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*, song_albums(track_number, disc_number, songs!inner(*))")
    .eq("status", "ACTIVE")
    .eq("song_albums.songs.status", "ACTIVE")
    .order("release_date");

  if (error) {
    throw new Error(`앨범 목록을 가져오지 못했습니다: ${error.message}`);
  }

  const originalsById = await fetchOriginalsById(
    supabase,
    data.flatMap((album) => album.song_albums.map((row) => row.songs)),
  );

  return data.map(({ song_albums, ...album }) => {
    // getSongsWithAlbums와 동일한 이유로(song_albums 조인 행 중복 방어)
    // 같은 곡을 가리키는 행이 두 번 들어오는 경우를 걸러낸다 — 없으면
    // no-op, 있으면 React key 충돌과 트랙 목록 중복 표시를 막아준다.
    const seenSongIds = new Set<string>();
    const songs = [...song_albums]
      .filter((row) => {
        if (seenSongIds.has(row.songs.id)) return false;
        seenSongIds.add(row.songs.id);
        return true;
      })
      // 이제 song_albums에 실제 트랙 순서(disc_number, track_number)가 있으므로
      // 곡 제목 알파벳순 대신 그 순서를 그대로 따른다.
      .sort(
        (a, b) =>
          a.disc_number - b.disc_number || a.track_number - b.track_number,
      )
      .map((row) => {
        const song = resolveDisplaySong(row.songs, originalsById);
        return {
          ...song,
          track_number: row.track_number,
          disc_number: row.disc_number,
        };
      });

    return { ...album, songs };
  });
}
