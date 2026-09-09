"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { ALBUM_TYPE_SHORT_LABEL } from "./labels";
import { SongDbDrawer } from "./SongDbDrawer";
import { SortFilterBar } from "./SortFilterBar";
import type {
  Album,
  SongAlbumRef,
  SongGroupBy,
  SongWithAlbums,
  SortDirection,
} from "./types";

interface SongGroup {
  key: string;
  label: string;
  // groupBy === "album"이고 "미분류"가 아닌 실제 앨범 그룹일 때만 채워진다 —
  // PC에서 그룹 헤더에 앨범 kr/en 부제와 발매일을 추가로 보여주기 위해
  // 필요하다(연도 그룹/미분류 그룹은 특정 앨범 하나로 귀속되지 않으므로 null).
  album: Album | null;
  songs: SongWithAlbums[];
}

// 곡 하나가 여러 앨범에 실릴 수 있어서(song_albums 다대다), "이 곡"만으로는
// 드로어가 어느 앨범 문맥에서 열렸는지 알 수 없다 — 앨범별로 보기 모드에서
// 같은 곡이 여러 그룹에 중복 등장할 때, 사용자가 실제로 클릭한 행이 속한
// 그룹의 앨범(contextAlbumId)까지 같이 들고 다녀야 드로어 상단에 "지금 보고
// 있는 이 앨범" 기준 정보를 보여주고 하단 목록에서는 그 앨범만 제외할 수
// 있다. 연도별로 보기처럼 특정 앨범 그룹이 없는 경우 null.
interface SelectedSong {
  song: SongWithAlbums;
  contextAlbumId: string | null;
}

const OTHERS_KEY = "기타";

/**
 * 곡 자신의 release_date를 우선 쓰고(디지털 싱글 등 앨범 없이 발매될 수
 * 있음), 없으면 소속 앨범 중 가장 이른 발매일로 대체한다. 둘 다 없으면
 * null(발매일 미상 — "기타" 그룹으로 빠진다).
 */
function songReleaseDate(song: SongWithAlbums): string | null {
  if (song.release_date) return song.release_date;
  if (song.albums.length === 0) return null;
  const earliest = song.albums.reduce((min, album) =>
    album.release_date < min.release_date ? album : min,
  );
  return earliest.release_date;
}

function songYear(song: SongWithAlbums): string | null {
  return songReleaseDate(song)?.slice(0, 4) ?? null;
}

function formatDateShort(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year.slice(2)}.${month}.${day}`;
}

function getSongCoverSrc(song: SongWithAlbums): string | null {
  return song.cover_image_url ?? song.albums[0]?.cover_image_url ?? null;
}

/**
 * music_video_url(watch?v=, youtu.be/, 이미 embed/인 경우까지)에서 실제
 * <iframe> 삽입용 embed URL을 뽑아낸다. 알 수 없는 형식이면 null을 반환해
 * 드로어에서 깨진 플레이어 대신 아예 렌더링을 건너뛴다.
 */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) return url;
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 드로어의 "앨범 수록 정보" 한 줄 — "(미니 1집 - 正しい偽りからの起床 (올바른
 * 거짓으로부터의 기상, ...))" 형태. album_type은 NOT NULL이라 항상 있고,
 * album_number는 없을 수 있어 있을 때만 "n집"을 붙인다. kr/en 중 있는 것만
 * 쉼표로 이어붙이고, 둘 다 없으면 괄호 자체를 생략한다.
 */
function formatAlbumCredit(
  album: Album,
  trackNumber: SongAlbumRef["track_number"],
) {
  const typeLabel = album.album_type
    ? ALBUM_TYPE_SHORT_LABEL[album.album_type]
    : "";
  const numberLabel = album.album_number ? `${album.album_number}집` : "";
  const albumInfo = [typeLabel, numberLabel].filter(Boolean).join(" ");
  const localized = [album.title_ko, album.title_en]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex flex-col">
      <span className={cn("text-xs", "tablet:text-sm")}>{albumInfo}</span>

      <div className="flex items-baseline gap-2">
        <span className="tablet:text-base text-sm">{album.title}</span>

        <span className={cn("text-xs text-white/80", "tablet:text-sm")}>
          {trackNumber ? `(Track ${trackNumber})` : ""}
        </span>
      </div>

      <span className={cn("text-xs text-white/50", "tablet:text-sm")}>
        {localized}
      </span>
    </div>
  );
}

/**
 * groupBy === "album": 앨범마다 그 앨범에 속한 곡을 나열한다. song_albums가
 * 다대다라 한 곡이 여러 앨범에 속하면 각 앨범 그룹에 전부 나타난다(중복이
 * 아니라 "이 앨범에도 실렸다"는 사실 그대로). 그룹 내부는 그 앨범 기준
 * track_number(동률이면 disc_number)로 정렬한다 — song.albums 안에서 "이
 * 그룹의 앨범"에 해당하는 SongAlbumRef를 찾아 트랙 번호를 읽는다. 앨범이
 * 하나도 없는 곡은 맨 뒤 "기타" 그룹으로.
 *
 * groupBy === "year": 위 songYear 기준 연도별로 묶고 오름차순(데뷔 연도가
 * 위) 정렬한다. 각 연도 그룹 내부는 실제 발매일(songReleaseDate) 오름차순
 * 으로 정렬한다. 마찬가지로 연도를 못 구하는 곡은 "기타"로.
 *
 * 위 두 경우 모두 항상 오름차순 기준으로 만들고, direction이 "desc"면
 * 마지막에 그룹 순서와 각 그룹 내부 곡 순서를 통째로 뒤집는다 — groupBy가
 * 뭐든 동일하게 적용되는 공용 옵션이라 그룹핑 로직 자체에 분기를 늘리지
 * 않고 후처리로 뺐다(AlbumListView의 groupAlbums와 동일한 패턴).
 */
function groupSongs(
  songs: SongWithAlbums[],
  groupBy: SongGroupBy,
  direction: SortDirection,
): SongGroup[] {
  const others: SongWithAlbums[] = [];
  let groups: SongGroup[];

  if (groupBy === "year") {
    const byYear = new Map<string, SongWithAlbums[]>();
    for (const song of songs) {
      const year = songYear(song);
      if (!year) {
        others.push(song);
        continue;
      }
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
          (songReleaseDate(a) ?? "").localeCompare(songReleaseDate(b) ?? ""),
        ),
      }));
    if (others.length > 0) {
      groups.push({
        key: OTHERS_KEY,
        label: OTHERS_KEY,
        album: null,
        songs: others,
      });
    }
  } else {
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

  if (direction === "desc") {
    return groups
      .slice()
      .reverse()
      .map((group) => ({ ...group, songs: [...group.songs].reverse() }));
  }
  return groups;
}

const SORT_OPTIONS: { value: SongGroupBy; label: string }[] = [
  { value: "album", label: "앨범" },
  { value: "year", label: "발매일" },
];

const DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: "desc", label: "내림차순" },
  { value: "asc", label: "오름차순" },
];

export function SongListView({ songs }: { songs: SongWithAlbums[] }) {
  const [groupBy, setGroupBy] = useState<SongGroupBy>("album");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selected, setSelected] = useState<SelectedSong | null>(null);
  const showDateColumn = groupBy === "year";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <SortFilterBar
          options={SORT_OPTIONS}
          value={groupBy}
          onChange={setGroupBy}
        />
        <SortFilterBar
          label="순서"
          options={DIRECTION_OPTIONS}
          value={sortDirection}
          onChange={setSortDirection}
        />
      </div>

      {songs.length === 0 ? (
        <p className={cn("text-base text-white/50", "tablet:text-lg")}>
          아직 등록된 곡이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groupSongs(songs, groupBy, sortDirection).map((group) => {
            const albumTypeLabel = group.album
              ? [
                  group.album.album_type
                    ? ALBUM_TYPE_SHORT_LABEL[group.album.album_type]
                    : "",
                  group.album.album_number
                    ? `${group.album.album_number}집`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              : "";
            const albumSubtitle = group.album
              ? [albumTypeLabel, group.album.title_ko]
                  .filter(Boolean)
                  .join(" · ")
              : "";

            return (
              <section key={group.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className={cn(
                      "min-w-0 truncate font-mono text-lg font-semibold tracking-[0.2em] uppercase",
                      "tablet:text-2xl",
                    )}
                  >
                    {group.label}
                  </p>
                  {group.album && (
                    <span
                      className={cn(
                        "shrink-0 font-mono text-sm text-white/70",
                        "tablet:text-base",
                      )}
                    >
                      {formatDateShort(group.album.release_date)}
                    </span>
                  )}
                </div>

                {(albumSubtitle || group.album?.title_en) && (
                  <div className="flex items-baseline justify-between gap-3">
                    {albumSubtitle && (
                      <p
                        className={cn(
                          "min-w-0 truncate text-sm font-normal tracking-normal text-white/50 normal-case",
                          "tablet:text-base",
                        )}
                      >
                        {albumSubtitle}
                      </p>
                    )}
                    {group.album?.title_en && (
                      <span
                        className={cn(
                          "hidden shrink-0 text-sm text-white/50",
                          "tablet:inline tablet:text-base",
                        )}
                      >
                        {group.album.title_en}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {group.songs.map((song) => {
                        const coverSrc = getSongCoverSrc(song);
                        const contextAlbumId = group.album?.id ?? null;
                        const isSelected =
                          selected?.song.id === song.id &&
                          selected?.contextAlbumId === contextAlbumId;
                        const releaseDate = songReleaseDate(song);
                        return (
                          <tr
                            key={song.id}
                            data-song-db-item
                            onClick={() =>
                              setSelected(
                                isSelected ? null : { song, contextAlbumId },
                              )
                            }
                            aria-selected={isSelected}
                            className={cn(
                              "cursor-help border-b border-white/10 transition-colors last:border-0 hover:bg-white/5",
                              isSelected && "bg-white/10",
                            )}
                          >
                            <td className="w-14 py-2 pr-3 align-middle">
                              {coverSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={coverSrc}
                                  alt={song.title}
                                  loading="lazy"
                                  className="size-11 rounded object-cover"
                                />
                              ) : (
                                <div
                                  className="size-11 rounded bg-white/5"
                                  aria-hidden
                                />
                              )}
                            </td>
                            <td className="py-2 pr-3 align-middle">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    "text-base font-medium text-white",
                                    "tablet:text-lg",
                                  )}
                                >
                                  {song.title}
                                </p>
                                {song.music_video_url && (
                                  <a
                                    href={song.music_video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    aria-label={`${song.title} 뮤직비디오`}
                                    className="tablet:hidden inline-flex shrink-0 text-white/50 transition-colors hover:text-white"
                                  >
                                    <YouTubeIcon className="h-5 w-5" />
                                  </a>
                                )}
                              </div>
                              {song.title_ko && (
                                <p
                                  className={cn(
                                    "text-sm text-white/70",
                                    "tablet:text-base",
                                  )}
                                >
                                  {song.title_ko}
                                  {song.title_en && (
                                    <span className="tablet:inline hidden">
                                      {" "}
                                      ({song.title_en})
                                    </span>
                                  )}
                                </p>
                              )}
                            </td>
                            <td className="tablet:table-cell hidden py-2 pl-3 align-middle">
                              {song.music_video_url && (
                                <a
                                  href={song.music_video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  aria-label={`${song.title} 뮤직비디오`}
                                  className="inline-flex text-white/50 transition-colors hover:text-white"
                                >
                                  <YouTubeIcon className="h-5 w-5" />
                                </a>
                              )}
                            </td>
                            {showDateColumn && (
                              <td className="py-2 pl-3 text-right align-middle">
                                {releaseDate && (
                                  <span
                                    className={cn(
                                      "font-mono text-sm text-white/40",
                                      "tablet:text-base",
                                    )}
                                  >
                                    {formatDateShort(releaseDate)}
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <SongDbDrawer
        selected={selected}
        onClose={() => setSelected(null)}
        renderContent={({ song, contextAlbumId }) => {
          const coverSrc = getSongCoverSrc(song);
          const releaseDate = songReleaseDate(song);
          const hasArranger = (song.arranger?.length ?? 0) > 0;
          const hasMovieDirector = (song.movie_director?.length ?? 0) > 0;
          // 어느 앨범 문맥에서 열렸는지(contextAlbumId) 알면 그 앨범 정보를
          // 제목 위에 짧게 보여주고, 하단 "다른 앨범" 목록에서는 그 앨범만
          // 뺀다 — 연도별로 보기 등 문맥 앨범이 없는 경우(null)는 상단에
          // 아무것도 안 보여주고 하단엔 전체 목록을 그대로 "다른 앨범"으로
          // 보여준다(제외할 게 없으므로).
          const contextAlbum = contextAlbumId
            ? (song.albums.find((album) => album.id === contextAlbumId) ?? null)
            : null;
          const otherAlbums = contextAlbum
            ? song.albums.filter((album) => album.id !== contextAlbum.id)
            : song.albums;

          return (
            <>
              <div className="tablet:h-108 relative flex h-80 w-full shrink-0 items-center justify-center">
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverSrc}
                    alt={song.title}
                    className="aspect-square h-6/7 max-h-full w-auto object-contain"
                  />
                ) : (
                  <div className="h-full w-full bg-white/5" />
                )}
              </div>

              <div className="min-w-0 flex-1 p-4 pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {contextAlbum && (
                      <div className="flex flex-row flex-wrap items-baseline gap-1 text-white/40">
                        <p className="tablet:text-sm text-xs">
                          {ALBUM_TYPE_SHORT_LABEL[contextAlbum.album_type]}
                          {contextAlbum.album_number}집 · {contextAlbum.title}
                        </p>
                        <p className="tablet:text-xs text-[10px]">
                          (Track {contextAlbum.track_number})
                        </p>
                      </div>
                    )}
                    <p
                      className={cn(
                        "text-xl font-semibold text-white",
                        "tablet:text-2xl",
                      )}
                    >
                      {song.title}
                    </p>
                    {song.title_ko && (
                      <div
                        className={cn(
                          "flex flex-col gap-0 text-sm text-white/70",
                          "tablet:text-base",
                        )}
                      >
                        <span className="-mt-0.5">{song.title_en}</span>
                        <span className="-mt-1">{song.title_ko}</span>
                      </div>
                    )}
                    {releaseDate && (
                      <p
                        className={cn(
                          "mt-1 font-mono text-sm text-white/50",
                          "tablet:text-base",
                        )}
                      >
                        {releaseDate}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="닫기"
                    className="shrink-0 text-white/60 transition-colors hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {(hasArranger || hasMovieDirector) && (
                  <div
                    className={cn(
                      "bg-ztmy-purple/15 -mx-2 mt-3 flex flex-col px-2 py-1 text-sm text-white/80",
                      "tablet:text-base",
                    )}
                  >
                    {hasArranger && <p>편곡 - {song.arranger!.join(", ")}</p>}
                    {hasMovieDirector && (
                      <p>M/V - {song.movie_director!.join(", ")}</p>
                    )}
                  </div>
                )}

                {song.music_video_url &&
                  (() => {
                    const embedUrl = getYouTubeEmbedUrl(song.music_video_url);
                    if (!embedUrl) return null;
                    return (
                      <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg">
                        <iframe
                          src={embedUrl}
                          title={`${song.title} 뮤직비디오`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    );
                  })()}

                <div className="mt-4">
                  <p
                    className={cn(
                      "text-sm font-semibold tracking-wide text-white/70 uppercase",
                      "tablet:text-base",
                    )}
                  >
                    이 곡이 수록된 다른 앨범
                  </p>
                  {otherAlbums.length === 0 ? (
                    <p
                      className={cn(
                        "mt-2 text-base text-white/40",
                        "tablet:text-lg",
                      )}
                    >
                      수록된 다른 앨범이 없습니다.
                    </p>
                  ) : (
                    <ul className="bg-ztmy-pink/15 -mx-2 mt-2 flex flex-col gap-3 px-2 py-1">
                      {otherAlbums.map((album) => (
                        <li key={album.id}>
                          {formatAlbumCredit(album, album.track_number)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          );
        }}
      />
    </div>
  );
}
