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

/**
 * 검색어가 이 항목에 걸리는지 — 띄어쓰기를 뺀 검색어 전체가 한 칸(제목·별명)에
 * 들어 있거나, 띄어 친 단어가 각각 어느 칸에든 들어 있으면(순서 무관) 걸린다.
 * 별명 "니와 투 니라"는 "니와"·"투"·"니라"·"니라 니와" 모두로 찾힌다.
 */
function matches(query: Query, fields: (string | null | undefined)[]) {
  const normalized = fields
    .filter((field): field is string => field != null && field !== "")
    .map(normalizeSearchText);
  if (normalized.some((field) => field.includes(query.joined))) return true;
  return (
    query.tokens.length > 1 &&
    query.tokens.every((token) =>
      normalized.some((field) => field.includes(token)),
    )
  );
}

interface Query {
  /** 띄어쓰기를 뺀 전체 */
  joined: string;
  /** 띄어 친 단어마다 */
  tokens: string[];
}

function parseQuery(raw: string): Query {
  return {
    joined: normalizeSearchText(raw),
    tokens: raw.split(/\s+/).map(normalizeSearchText).filter(Boolean),
  };
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
 * 통합 검색. 곡·앨범·공연 제목(원어·한글·영문)과 별명에 검색어가 들어간 항목을
 * 찾고, 걸린 곡이 있으면 그 곡이 실린 앨범과 그 곡을 부른 공연도 "관련"
 * 결과로 더한다 — "초침"을 찾으면 초침을 깨물다(곡) + 그 곡이 실린 앨범 +
 * 그 곡을 부른 공연이 함께 나온다. 직접 걸린 항목이 관련 항목보다 먼저 온다.
 */
export function searchZutopia(
  index: ZutopiaSearchIndex,
  rawQuery: string,
): ZutopiaSearchResult {
  const query = parseQuery(rawQuery);
  if (!query.joined) return { songs: [], albums: [], lives: [], total: 0 };

  const matchedSongs = index.songs.filter((song) =>
    matches(query, [song.title, song.titleKo, song.titleEn, ...song.aliases]),
  );
  const matchedSongIds = new Set(matchedSongs.map((song) => song.id));
  const viaSongsOf = (songIds: string[]) =>
    matchedSongs.filter((song) => songIds.includes(song.id));

  const albums = collectHits(
    index.albums,
    (album) =>
      matches(query, [
        album.title,
        album.titleKo,
        album.titleEn,
        ...album.aliases,
      ]),
    (album) => album.songIds.some((id) => matchedSongIds.has(id)),
    (album) => viaSongsOf(album.songIds),
  );
  const lives = collectHits(
    index.lives,
    (live) =>
      matches(query, [live.label, live.name, live.titleEn, ...live.aliases]),
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

/**
 * 결과 글자 강조용 — 검색어(띄어쓰기를 뺀 전체, 그리고 띄어 친 단어마다)가
 * 원문의 어디에 들어 있는지 [시작, 끝) 범위로 돌려준다. 비교는 검색과 같은
 * 기준(normalizeSearchText — 대소문자·전각/반각·띄어쓰기 무시)이라, 원문 글자를
 * 하나씩 맞춰 가며 정규화된 위치를 원문 위치로 되돌린다. 겹치는 범위는 합친다.
 */
export function findMatchRanges(
  text: string,
  rawQuery: string,
): [number, number][] {
  const query = parseQuery(rawQuery);
  if (!query.joined || !text) return [];

  // 정규화된 글자 하나하나가 원문 몇 번째 글자에서 왔는지.
  let normalized = "";
  const origin: number[] = [];
  let index = 0;
  for (const char of text) {
    for (const piece of normalizeSearchText(char)) {
      normalized += piece;
      origin.push(index);
    }
    index += char.length;
  }

  const ranges: [number, number][] = [];
  const needles = new Set([query.joined, ...query.tokens]);
  for (const needle of needles) {
    let from = normalized.indexOf(needle);
    while (from !== -1) {
      const last = origin[from + needle.length - 1];
      // 마지막 글자가 서로게이트 쌍이면 끝을 그 뒤로.
      const lastLength = text.codePointAt(last)! > 0xffff ? 2 : 1;
      ranges.push([origin[from], last + lastLength]);
      from = normalized.indexOf(needle, from + 1);
    }
  }

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1])
      previous[1] = Math.max(previous[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}
