import {
  ALBUM_TYPE_ORDER,
  ALBUM_TYPE_SECTION_LABEL,
} from "@/features/zutopia/song-db/labels";
import { applySortDirection } from "@/features/zutopia/song-db/sort";
import type {
  Album,
  AlbumGroupBy,
  AlbumWithSongs,
  SongGroupBy,
  SongWithAlbums,
  SortDirection,
} from "@/features/zutopia/song-db/types";

export interface SongGroup {
  key: string;
  label: string;
  /**
   * groupBy === "album"이고 "미분류"가 아닌 실제 앨범 그룹일 때만
   * 채워진다 — PC에서 그룹 헤더에 앨범 kr/en 부제와 발매일을 보여주기
   * 위해 필요하다(연도/미분류 그룹은 특정 앨범에 귀속되지 않아 null).
   */
  album: Album | null;
  songs: SongWithAlbums[];
}

export interface AlbumGroup {
  key: string;
  label: string;
  albums: AlbumWithSongs[];
}

const OTHERS_KEY = "기타";

/**
 * SongListView(목록 행)와 SongDetailPanel(드로어 상세) 둘 다에서 쓰인다
 * — 두 곳이 서로를 참조하는 순환 import를 막기 위해 여기 둔다.
 */
export function getSongCoverSrc(song: SongWithAlbums): string | null {
  return song.cover_image_url ?? song.albums[0]?.cover_image_url ?? null;
}

function songYear(song: SongWithAlbums): string {
  return song.release_date.slice(0, 4);
}

function albumYear(album: AlbumWithSongs): string {
  return album.release_date.slice(0, 4);
}

function isAlbumTypeKey(
  type: string,
): type is (typeof ALBUM_TYPE_ORDER)[number] {
  return (ALBUM_TYPE_ORDER as readonly string[]).includes(type);
}

/**
 * groupBy === "album": 앨범마다 그 앨범에 속한 곡을 나열한다.
 * song_albums가 다대다라 한 곡이 여러 앨범에 속하면 각 앨범 그룹에 전부
 * 나타난다(중복이 아니라 "이 앨범에도 실렸다"는 사실 그대로). 그룹
 * 내부는 그 앨범 기준 track_number(동률이면 disc_number)로 정렬한다.
 * 앨범이 없는 곡은 맨 뒤 "기타" 그룹으로 모은다.
 *
 * groupBy === "year": songYear 기준 연도별로 묶어 오름차순(데뷔 연도가
 * 위) 정렬하고, 그룹 내부는 release_date 오름차순으로 정렬한다.
 * release_date는 NOT NULL이라 "기타" 버킷이 필요 없다.
 *
 * 두 경우 모두 오름차순으로 만든 뒤, direction이 "desc"면 그룹 순서와
 * 그룹 내부 순서를 통째로 뒤집는다 — groupBy와 무관한 공용 옵션이라
 * 그룹핑 로직에 분기를 늘리지 않고 후처리로 뺐다(아래 groupAlbums 동일).
 */
export function groupSongs(
  songs: SongWithAlbums[],
  groupBy: SongGroupBy,
  direction: SortDirection,
): SongGroup[] {
  let groups: SongGroup[];

  if (groupBy === "year") {
    const byYear = new Map<string, SongWithAlbums[]>();
    for (const song of songs) {
      const year = songYear(song);
      const bucket = byYear.get(year);
      if (bucket) bucket.push(song);
      else byYear.set(year, [song]);
    }
    groups = [...byYear.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, list]) => ({
        key: year,
        label: `${year}년`,
        album: null,
        songs: [...list].sort((a, b) =>
          a.release_date.localeCompare(b.release_date),
        ),
      }));
  } else {
    const others: SongWithAlbums[] = [];
    const byAlbum = new Map<
      string,
      { album: Album; songs: SongWithAlbums[] }
    >();
    for (const song of songs) {
      if (song.albums.length === 0) {
        others.push(song);
        continue;
      }
      for (const album of song.albums) {
        const entry = byAlbum.get(album.id);
        if (entry) entry.songs.push(song);
        else byAlbum.set(album.id, { album, songs: [song] });
      }
    }
    groups = [...byAlbum.values()]
      .sort((a, b) => a.album.release_date.localeCompare(b.album.release_date))
      .map(({ album, songs }) => ({
        key: album.id,
        label: album.title,
        album,
        songs: [...songs].sort((a, b) => {
          const refA = a.albums.find((ref) => ref.id === album.id);
          const refB = b.albums.find((ref) => ref.id === album.id);
          return (
            (refA?.disc_number ?? 0) - (refB?.disc_number ?? 0) ||
            (refA?.track_number ?? 0) - (refB?.track_number ?? 0)
          );
        }),
      }));
    if (others.length > 0) {
      groups.push({
        key: OTHERS_KEY,
        label: "미분류",
        album: null,
        songs: others,
      });
    }
  }

  return applySortDirection(
    groups,
    direction,
    (group) => group.songs,
    (group, songs) => ({ ...group, songs }),
  );
}

/**
 * groupBy에 따라 정렬 기준이 통째로 바뀐다 — "type"은 정규→미니→EP
 * 고정 순서, "year"는 데뷔년도가 위로 오는 오름차순이다. year 키는 Map
 * 등장 순서가 아니라 명시적으로 정렬한다 — albums가 이미 release_date
 * 오름차순으로 온다는(현재는 data.ts .order() 덕분에 참인) 가정에
 * 기대면 나중에 그 정렬이 바뀔 때 조용히 깨질 수 있다(위 groupSongs도
 * 동일).
 *
 * 항상 오름차순으로 만든 뒤, direction이 "desc"면 그룹 순서와 그룹 내부
 * 앨범 순서를 통째로 뒤집는다.
 */
export function groupAlbums(
  albums: AlbumWithSongs[],
  groupBy: AlbumGroupBy,
  direction: SortDirection,
): AlbumGroup[] {
  let groups: AlbumGroup[];

  if (groupBy === "year") {
    const byYear = new Map<string, AlbumWithSongs[]>();
    for (const album of albums) {
      const year = albumYear(album);
      const bucket = byYear.get(year);
      if (bucket) {
        bucket.push(album);
      } else {
        byYear.set(year, [album]);
      }
    }
    groups = [...byYear.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, list]) => ({
        key: year,
        label: `${year}년`,
        albums: list,
      }));
  } else {
    const byType = new Map<string, AlbumWithSongs[]>();
    for (const album of albums) {
      const key = album.album_type ?? "기타";
      const bucket = byType.get(key);
      if (bucket) {
        bucket.push(album);
      } else {
        byType.set(key, [album]);
      }
    }
    const orderedKeys = [
      ...ALBUM_TYPE_ORDER.filter((type) => byType.has(type)),
      ...[...byType.keys()].filter((key) => !isAlbumTypeKey(key)),
    ];
    groups = orderedKeys.map((key) => ({
      key,
      label: isAlbumTypeKey(key) ? ALBUM_TYPE_SECTION_LABEL[key] : key,
      albums: byType.get(key) ?? [],
    }));
  }

  return applySortDirection(
    groups,
    direction,
    (group) => group.albums,
    (group, albums) => ({ ...group, albums }),
  );
}
