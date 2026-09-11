import { cn } from "@/lib/utils";
import { MicIcon } from "@/components/icons/MicIcon";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import { getSongCoverSrc } from "@/features/zutopia/song-db/song-album-grouping";
import { DrawerCloseButton } from "@/features/zutopia/song-db/components/DrawerCloseButton";
import type {
  Album,
  SongAlbumRef,
  SongWithAlbums,
} from "@/features/zutopia/song-db/types";

/**
 * SongDbDrawer가 곡 상세로 여는 내용 — 커버, 제목/가사 크레딧, 응원 가이드/MV
 * 링크, 이 곡이 실린 다른 앨범 목록.
 */
export function SongDetailPanel({
  song,
  contextAlbumId,
  onClose,
}: SongDetailPanelProps) {
  const coverSrc = getSongCoverSrc(song);
  const hasArranger = (song.arranger?.length ?? 0) > 0;
  const hasMovieDirector = (song.movie_director?.length ?? 0) > 0;

  const contextAlbum = contextAlbumId
    ? (song.albums.find((album) => album.id === contextAlbumId) ?? null)
    : null;
  const otherAlbums = contextAlbum
    ? song.albums.filter((album) => album.id !== contextAlbum.id)
    : song.albums;

  return (
    <>
      <div
        className={cn(
          "relative flex h-80 w-full shrink-0 items-center justify-center",
          "tablet:h-108",
        )}
      >
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
                <p className={cn("text-xs", "tablet:text-sm")}>
                  {ALBUM_TYPE_SHORT_LABEL[contextAlbum.album_type]}
                  {contextAlbum.album_number}집 · {contextAlbum.title}
                </p>
                <p className={cn("text-[10px]", "tablet:text-xs")}>
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

          <DrawerCloseButton onClick={onClose} />
        </div>

        {(hasArranger || hasMovieDirector) && (
          <div
            className={cn(
              "-mx-2 mt-3 flex flex-col bg-white/8 px-2 py-1 text-sm text-white/80",
              "tablet:text-base",
            )}
          >
            {hasArranger && <p>편곡 - {song.arranger!.join(", ")}</p>}
            {hasMovieDirector && <p>M/V - {song.movie_director!.join(", ")}</p>}
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
            <p className={cn("mt-2 text-base text-white/60", "tablet:text-lg")}>
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
}

interface SongDetailPanelProps {
  song: SongWithAlbums;
  contextAlbumId: string | null;
  onClose: () => void;
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

/** 드로어의 "앨범 수록 정보" 한 줄 — "(미니 1집 · 正しい偽りからの起床)" 형태. */
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
        <span className={cn("text-sm", "tablet:text-base")}>{album.title}</span>

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
