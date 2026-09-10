"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { MicIcon } from "@/components/icons/MicIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { ALBUM_TYPE_SHORT_LABEL } from "../labels";
import { IconLinkButton } from "./IconLinkButton";
import { SongDbDrawer } from "./SongDbDrawer";
import { SortFilterBar } from "./SortFilterBar";
import { applySortDirection, DIRECTION_OPTIONS } from "../sort";
import type {
  Album,
  SongAlbumRef,
  SongGroupBy,
  SongWithAlbums,
  SortDirection,
} from "../types";

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

function songYear(song: SongWithAlbums): string {
  return song.release_date.slice(0, 4);
}

// songs/albums.release_date 모두 DB 제약상 date 타입 NOT NULL이라 항상
// "YYYY-MM-DD" 형식으로 온다.
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

// 드로어의 "앨범 수록 정보" 한 줄 — "(미니 1집 · 正しい偽りからの起床)" 형태.
// album_type/album_number/title_ko/title_en 모두 NOT NULL이라 항상 있다.
function formatAlbumCredit(
  album: Album,
  trackNumber: SongAlbumRef["track_number"],
) {
  const albumInfo = `${ALBUM_TYPE_SHORT_LABEL[album.album_type]} ${album.album_number}집`;
  const localized = `${album.title_ko} · ${album.title_en}`;
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
 * 위) 정렬한다. 각 연도 그룹 내부는 실제 발매일(release_date) 오름차순으로
 * 정렬한다. release_date는 NOT NULL이라 모든 곡이 연도를 가진다 — "기타"
 * 버킷은 필요 없다.
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

const SORT_OPTIONS: { value: SongGroupBy; label: string }[] = [
  { value: "album", label: "앨범" },
  { value: "year", label: "발매일" },
];

export function SongListView({ songs }: { songs: SongWithAlbums[] }) {
  const [groupBy, setGroupBy] = useState<SongGroupBy>("album");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selected, setSelected] = useState<SelectedSong | null>(null);
  // 드로어에 매번 새 화살표 함수를 넘기면 SongDbDrawer의 포커스 관리
  // effect가 참조 동일성 때문에 열려 있는 동안에도 매 렌더마다 다시
  // 실행돼(포커스가 튀는 등) 불필요하게 흔들린다 — setSelected는 useState가
  // 보장하는 안정적인 참조라 이 콜백도 항상 같은 참조를 유지한다.
  const closeDrawer = useCallback(() => setSelected(null), []);
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
            const albumSubtitle = group.album
              ? `${ALBUM_TYPE_SHORT_LABEL[group.album.album_type]} ${group.album.album_number}집 · ${group.album.title_ko}`
              : "";

            return (
              <section key={group.key}>
                <div className="bg-ztmy-dark/60 flex items-baseline justify-between gap-3 px-2 pt-1">
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

                {group.album && (
                  <div className="bg-ztmy-dark/60 flex items-baseline justify-between gap-3 px-2 pb-1">
                    <p
                      className={cn(
                        "min-w-0 truncate text-sm font-normal tracking-normal text-white/50 normal-case",
                        "tablet:text-base",
                      )}
                    >
                      {albumSubtitle}
                    </p>
                    <span
                      className={cn(
                        "hidden shrink-0 text-sm text-white/50",
                        "tablet:inline tablet:text-base",
                      )}
                    >
                      {group.album.title_en}
                    </span>
                  </div>
                )}

                <div>
                  <table className="w-full">
                    <caption className="sr-only">{group.label} 수록곡</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="sr-only">
                          커버
                        </th>
                        <th scope="col" className="sr-only">
                          제목
                        </th>
                        {showDateColumn && (
                          <th scope="col" className="sr-only">
                            발매일
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {group.songs.map((song) => {
                        const coverSrc = getSongCoverSrc(song);
                        const contextAlbumId = group.album?.id ?? null;
                        const isSelected =
                          selected?.song.id === song.id &&
                          selected?.contextAlbumId === contextAlbumId;
                        const openSong = () =>
                          setSelected(
                            isSelected ? null : { song, contextAlbumId },
                          );
                        return (
                          <tr
                            key={song.id}
                            data-song-db-item
                            tabIndex={0}
                            onClick={openSong}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ")
                                return;
                              event.preventDefault();
                              openSong();
                            }}
                            aria-selected={isSelected}
                            aria-label={`${song.title} 상세 정보 보기`}
                            className={cn(
                              "flex cursor-help items-center gap-1 border-b border-white/10 px-2 transition-colors last:border-0 hover:bg-white/5",
                              "tablet:gap-3",
                              "focus-visible:outline-ztmy-magenta focus-visible:outline-2 focus-visible:-outline-offset-2",
                              isSelected && "bg-white/10",
                            )}
                          >
                            <td>
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
                            <td className="flex-1 py-2 align-middle">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={cn(
                                    "min-w-0 text-base font-medium text-white",
                                    "tablet:text-lg",
                                  )}
                                >
                                  {song.title}
                                </p>
                                <div className="ml-auto flex shrink-0 items-center gap-2">
                                  {song.music_video_url && (
                                    <IconLinkButton
                                      href={song.music_video_url}
                                      icon={YouTubeIcon}
                                      label="뮤직비디오 보기"
                                      tone="youtube"
                                      size="md"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                    />
                                  )}
                                  {song.guideHref && (
                                    <IconLinkButton
                                      href={song.guideHref}
                                      icon={MicIcon}
                                      label="샤모지 호응 가이드 이동"
                                      tone="guide"
                                      size="md"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                              <p
                                className={cn(
                                  "text-sm text-white/70",
                                  "tablet:text-base",
                                )}
                              >
                                {song.title_ko}
                                <span className="tablet:inline hidden">
                                  {" "}
                                  ({song.title_en})
                                </span>
                              </p>
                            </td>
                            {showDateColumn && (
                              <td className="py-2 pl-3 text-right align-middle">
                                <span
                                  className={cn(
                                    "font-mono text-sm text-white/60",
                                    "tablet:text-base",
                                  )}
                                >
                                  {formatDateShort(song.release_date)}
                                </span>
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
        onClose={closeDrawer}
        ariaLabel={selected ? `${selected.song.title} 상세 정보` : undefined}
        renderContent={({ song, contextAlbumId }) => {
          const coverSrc = getSongCoverSrc(song);
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
                      <div className="flex flex-row flex-wrap items-baseline gap-1 text-white/60">
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
                        "mt-2 text-xl font-semibold text-white",
                        "tablet:text-2xl",
                      )}
                    >
                      {song.title}
                    </p>
                    <div
                      className={cn(
                        "flex flex-col text-sm leading-tight text-white/70",
                        "tablet:text-base",
                      )}
                    >
                      <span>{song.title_en}</span>
                      <span>{song.title_ko}</span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 font-mono text-sm text-white/50",
                        "tablet:text-base",
                      )}
                    >
                      {song.release_date}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeDrawer}
                    aria-label="닫기"
                    className="-m-2 shrink-0 p-2 text-white/60 transition-colors hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {(hasArranger || hasMovieDirector) && (
                  <div
                    className={cn(
                      "-mx-2 mt-3 flex flex-col bg-white/8 px-2 py-1 text-sm text-white/80",
                      "tablet:text-base",
                    )}
                  >
                    {hasArranger && <p>편곡 - {song.arranger!.join(", ")}</p>}
                    {hasMovieDirector && (
                      <p>M/V - {song.movie_director!.join(", ")}</p>
                    )}
                  </div>
                )}

                {song.guideHref && (
                  <a
                    href={song.guideHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "border-ztmy-purple/40 bg-ztmy-purple/15 hover:bg-ztmy-purple/25 mt-3 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-white transition-colors",
                      "tablet:text-base",
                    )}
                  >
                    <MicIcon className="h-4 w-4" />
                    샤모지 호응 가이드 이동
                  </a>
                )}

                {song.music_video_url &&
                  (() => {
                    const embedUrl = getYouTubeEmbedUrl(song.music_video_url);
                    if (!embedUrl) {
                      return (
                        <a
                          href={song.music_video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "mt-3 inline-flex text-sm text-white/60 underline transition-colors hover:text-white",
                            "tablet:text-base",
                          )}
                        >
                          MV 링크로 보기 ↗
                        </a>
                      );
                    }
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
                        "mt-2 text-base text-white/60",
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
