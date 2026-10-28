/**
 * 즛토피아 통합 검색 인덱스. 빌드 때 서버(data.ts)가 만들어 첫 화면에
 * 내려주고, 검색 자체는 브라우저(search.ts)에서 한다 — 정적 빌드라 검색
 * 서버가 없다. 곡·앨범·공연을 서로 id로 이어 둬서, 곡 하나가 걸리면 그 곡이
 * 실린 앨범과 그 곡을 부른 공연까지 함께 찾는다.
 */
export interface SearchSong {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  titleEn: string;
  cover: string | null;
  releaseYear: string;
}

export interface SearchAlbum {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  titleEn: string;
  cover: string | null;
  releaseYear: string;
  songIds: string[];
}

export interface SearchLive {
  /** /zutopia/lives/<slug> — 투어 소속 공연일은 투어 slug로 묶인다. */
  slug: string;
  label: string;
  name: string;
  titleEn: string | null;
  date: string;
  /** 시작 연도("2026") — 검색 결과를 연도별로 묶는 데 쓴다. */
  year: string;
  thumbnail: string;
  /** 이 공연(투어면 모든 공연일 합쳐서)의 세트리스트에 있는 곡 id. */
  songIds: string[];
}

export interface ZutopiaSearchIndex {
  songs: SearchSong[];
  albums: SearchAlbum[];
  lives: SearchLive[];
}
