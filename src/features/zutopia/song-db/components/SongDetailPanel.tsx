import Link from "next/link";
import { ThumbImage } from "@/components/ThumbImage";
import { cn } from "@/lib/utils";
import { formatDotDate } from "@/lib/ymd";
import { MicIcon } from "@/components/icons/MicIcon";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import { getSongCoverSrc } from "@/features/zutopia/song-db/song-album-grouping";
import { parseSongMetadata } from "@/features/zutopia/song-db/song-metadata";
import { UnreleasedBadge } from "@/features/zutopia/song-db/components/UnreleasedBadge";
import {
  formatDaysAgo,
  type LiveRef,
  type SongLiveSummary,
} from "@/features/zutopia/live-history/summary";
import { LiveLink } from "@/features/zutopia/live-history/components/LiveLink";
import type {
  SongAlbumRef,
  SongWithAlbums,
} from "@/features/zutopia/song-db/types";

/**
 * SongDbDrawer가 곡 상세로 여는 내용 — 커버, 제목, 발매일·크레딧 표, 수록 앨범
 * 목록, 라이브 기록, 곡 설명, 응원 가이드/MV 링크.
 */
export function SongDetailPanel({
  song,
  contextAlbumSlug,
  liveSummary,
  today,
}: SongDetailPanelProps) {
  const coverSrc = getSongCoverSrc(song);
  const hasArranger = (song.arranger?.length ?? 0) > 0;
  const hasMovieDirector = (song.movie_director?.length ?? 0) > 0;
  const { description, isUnreleased } = parseSongMetadata(song.metadata);

  return (
    <>
      <div
        className={cn(
          "relative flex h-80 w-full shrink-0 items-center justify-center",
          "tablet:h-108",
        )}
      >
        {coverSrc ? (
          // 보이는 크기(PC 약 370px)의 2배로 줄인 커버 — 원본이 그보다 작으면 원본 그대로 온다.
          <ThumbImage
            src={coverSrc}
            displayWidth={400}
            loading="eager"
            alt={song.title}
            className="aspect-square h-6/7 max-h-full w-auto bg-black/40 object-contain"
          />
        ) : (
          <div className="h-full w-full bg-white/5" />
        )}
      </div>

      <div className="min-w-0 flex-1 p-4 pt-0">
        <div className="flex items-start justify-between gap-4">
          {/* 제목은 원어 → 한국어 → 영어 순으로, 아래로 갈수록 흐리게. */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "text-xl font-semibold text-white",
                  "tablet:text-2xl",
                )}
              >
                {song.title}
              </p>
              {isUnreleased && <UnreleasedBadge />}
            </div>
            <p
              className={cn("mt-0.5 text-base text-white/80", "tablet:text-lg")}
            >
              {song.title_ko}
            </p>
            <p className={cn("text-sm text-white/50", "tablet:text-base")}>
              {song.title_en}
            </p>
          </div>
        </div>

        <DetailTable
          className="mt-3"
          rows={[
            { label: "발매일", value: formatDotDate(song.release_date) },
            ...(hasArranger
              ? [{ label: "편곡", value: song.arranger!.join(", ") }]
              : []),
            ...(hasMovieDirector
              ? [{ label: "M/V", value: song.movie_director!.join(", ") }]
              : []),
          ]}
        />

        <AlbumList albums={song.albums} contextAlbumSlug={contextAlbumSlug} />

        {/* 라이브 기록은 목록의 "마지막 라이브" 보기와 상관없이 항상 보여준다. */}
        <LiveRecord summary={liveSummary} today={today} />

        {description && (
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed whitespace-pre-line text-white/80",
              "tablet:text-base",
            )}
          >
            {description}
          </p>
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
            응원 가이드 이동
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
      </div>
    </>
  );
}

/**
 * 이 곡이 실린 앨범 전부(발매일 순) — 커버 + 앨범명 + "정규 1집 · Track 3 · 2019".
 * 목록에서 누른 행의 앨범(contextAlbumSlug)에는 "보는 중"을 붙인다. 누르면
 * 앨범 목록 페이지의 그 앨범 상세로 이동한다.
 */
function AlbumList({
  albums,
  contextAlbumSlug,
}: {
  albums: SongAlbumRef[];
  contextAlbumSlug: string | null;
}) {
  return (
    <div className="mt-4">
      <p
        className={cn(
          "text-sm font-semibold tracking-wide text-white/70",
          "tablet:text-base",
        )}
      >
        수록 앨범{" "}
        <span className="font-normal text-white/50">{albums.length}</span>
      </p>
      {albums.length === 0 ? (
        <p className={cn("mt-2 text-sm text-white/60", "tablet:text-base")}>
          수록된 앨범이 없습니다.
        </p>
      ) : (
        <ul className="-mx-2 mt-1 flex flex-col">
          {albums.map((album) => {
            const isContext = album.slug === contextAlbumSlug;
            return (
              <li key={album.id}>
                <Link
                  href={`/zutopia/albums?album=${album.slug}`}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/5",
                    "focus-visible:outline-ztmy-magenta focus-visible:outline-2",
                  )}
                >
                  {album.cover_image_url ? (
                    <ThumbImage
                      src={album.cover_image_url}
                      displayWidth={44}
                      className="size-11 shrink-0 rounded bg-black/40 object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="block size-11 shrink-0 rounded bg-white/5"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm text-white",
                        "tablet:text-base",
                      )}
                    >
                      {album.title}
                    </span>
                    <span className="block truncate text-sm text-white/50">
                      {ALBUM_TYPE_SHORT_LABEL[album.album_type]}{" "}
                      {album.album_number}집
                      {album.track_number
                        ? ` · Track ${album.track_number}`
                        : ""}{" "}
                      · {album.release_date.slice(0, 4)}
                    </span>
                  </span>
                  {isContext ? (
                    <span className="text-ztmy-magenta shrink-0 text-sm">
                      보는 중
                    </span>
                  ) : (
                    <ChevronLeftIcon className="size-4 shrink-0 rotate-180 text-white/40" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface DetailRow {
  label: string;
  value: React.ReactNode;
}

/** 곡 상세의 라벨 - 값 표(크레딧, 라이브 기록). 왼쪽 흐린 라벨, 오른쪽 값. */
function DetailTable({
  rows,
  className,
}: {
  rows: DetailRow[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "-mx-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 bg-white/8 px-2 py-2 text-sm",
        "tablet:text-base",
        className,
      )}
    >
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-white/50">{row.label}</dt>
          <dd className="min-w-0 text-white/90">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 라이브 기록 표의 공연 값 — 첫 줄 공연명(새 창 링크), 둘째 줄 흐린 "도시 DAY N · 날짜". */
function LiveValue({ live }: { live: LiveRef }) {
  return (
    <span className="flex flex-col">
      <LiveLink live={live} wrap />
      <span className="text-sm text-white/50">
        {[live.detail, formatDotDate(live.date)].filter(Boolean).join(" · ")}
      </span>
    </span>
  );
}

/**
 * 곡 상세의 라이브 기록 — 왼쪽 라벨, 오른쪽 값의 표. 한 번만 부른 곡은
 * 첫 공연이 마지막 공연과 같아서 첫 공연 줄을 뺀다.
 */
function LiveRecord({
  summary,
  today,
}: {
  summary: SongLiveSummary | undefined;
  today: string | null;
}) {
  const rows: DetailRow[] = summary
    ? [
        { label: "총 횟수", value: `${summary.count}회` },
        { label: "마지막 공연", value: <LiveValue live={summary.last} /> },
        ...(today
          ? [
              {
                label: "지난 기간",
                value: formatDaysAgo(summary.last.date, today),
              },
            ]
          : []),
        ...(summary.count > 1
          ? [{ label: "첫 공연", value: <LiveValue live={summary.first} /> }]
          : []),
      ]
    : [];

  return (
    <div className="mt-4">
      <p
        className={cn(
          "text-sm font-semibold tracking-wide text-white/70",
          "tablet:text-base",
        )}
      >
        라이브 기록
      </p>
      {summary ? (
        <DetailTable className="mt-2" rows={rows} />
      ) : (
        <p className={cn("mt-2 text-sm text-white/60", "tablet:text-base")}>
          라이브 기록이 없습니다.
        </p>
      )}
    </div>
  );
}

interface SongDetailPanelProps {
  song: SongWithAlbums;
  contextAlbumSlug: string | null;
  liveSummary: SongLiveSummary | undefined;
  /** 보는 날("YYYY-MM-DD"). 하이드레이션 전엔 null — "N일 전"을 생략한다. */
  today: string | null;
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
