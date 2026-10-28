import type {
  SearchAlbum,
  SearchLive,
  SearchSong,
  ZutopiaSearchIndex,
} from "@/features/zutopia/search/types";

/** 검색어·제목을 비교할 수 있게 맞춘다 — 대소문자·전각/반각·띄어쓰기 무시. */
export function normalizeSearchText(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

function matches(query: string, ...fields: (string | null | undefined)[]) {
  return fields.some(
    (field) => field != null && normalizeSearchText(field).includes(query),
  );
}

/**
 * 결과 한 줄. related면 검색어가 이 항목 자체가 아니라 걸린 곡을 통해
 * 이어진 것이다 — viaSongs는 그 곡들(예: 「초침을 깨물다」 수록 앨범).
 */
export interface SearchHit<T> {
  item: T;
  related: boolean;
  viaSongs: SearchSong[];
}

export interface ZutopiaSearchResult {
  songs: SearchHit<SearchSong>[];
  albums: SearchHit<SearchAlbum>[];
  lives: SearchHit<SearchLive>[];
  total: number;
}

/**
 * 통합 검색. 곡·앨범·공연 제목(원어·한글·영문)에 검색어가 들어간 항목을
 * 찾고, 걸린 곡이 있으면 그 곡이 실린 앨범과 그 곡을 부른 공연도 "관련"
 * 결과로 더한다 — "초침"을 찾으면 초침을 깨물다(곡) + 그 곡이 실린 앨범 +
 * 그 곡을 부른 공연이 함께 나온다. 직접 걸린 항목이 관련 항목보다 먼저 온다.
 */
export function searchZutopia(
  index: ZutopiaSearchIndex,
  rawQuery: string,
): ZutopiaSearchResult {
  const query = normalizeSearchText(rawQuery);
  if (!query) return { songs: [], albums: [], lives: [], total: 0 };

  const matchedSongs = index.songs.filter((song) =>
    matches(query, song.title, song.titleKo, song.titleEn),
  );
  const matchedSongIds = new Set(matchedSongs.map((song) => song.id));
  const viaSongsOf = (songIds: string[]) =>
    matchedSongs.filter((song) => songIds.includes(song.id));

  const albums = collectHits(
    index.albums,
    (album) => matches(query, album.title, album.titleKo, album.titleEn),
    (album) => album.songIds.some((id) => matchedSongIds.has(id)),
    (album) => viaSongsOf(album.songIds),
  );
  const lives = collectHits(
    index.lives,
    (live) => matches(query, live.label, live.name, live.titleEn),
    (live) => live.songIds.some((id) => matchedSongIds.has(id)),
    (live) => viaSongsOf(live.songIds),
  );
  const songs = matchedSongs.map((item) => ({
    item,
    related: false,
    viaSongs: [],
  }));

  return {
    songs,
    albums,
    lives,
    total: songs.length + albums.length + lives.length,
  };
}

function collectHits<T>(
  items: T[],
  isDirect: (item: T) => boolean,
  isRelated: (item: T) => boolean,
  viaSongs: (item: T) => SearchSong[],
): SearchHit<T>[] {
  const direct: SearchHit<T>[] = [];
  const related: SearchHit<T>[] = [];
  for (const item of items) {
    if (isDirect(item)) {
      direct.push({ item, related: false, viaSongs: [] });
    } else if (isRelated(item)) {
      related.push({ item, related: true, viaSongs: viaSongs(item) });
    }
  }
  return [...direct, ...related];
}
