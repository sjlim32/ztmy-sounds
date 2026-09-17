import { cn } from "@/lib/utils";
import { AppleMusicIcon } from "@/components/icons/AppleMusicIcon";
import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";
import { formatLiveDate } from "./data";
import { SongLink } from "./SongLink";
import type { Live, LiveDetail } from "./types";

interface LiveStreamingLinks {
  variation?: string;
  spotify?: string;
  youtubeMusic?: string;
  appleMusic?: string;
}

/**
 * lives.metadata는 비정형 jsonb라 런타임에 형태를 확인해야 한다
 * (AlbumDetailPanel의 getAlbumImageSource와 동일한 패턴). 아직 실데이터에
 * youtube_music/apple_music 키가 없어 정확한 키 이름은 spotify 키의
 * snake_case 관례를 따라 추정했다 — 실제 값이 다르면 이 함수만 고치면 된다.
 */
function parseLiveMetadata(metadata: Live["metadata"]): LiveStreamingLinks {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  const m = metadata as Record<string, unknown>;
  const asString = (value: unknown) =>
    typeof value === "string" && value.length > 0 ? value : undefined;

  return {
    variation: asString(m.variation),
    spotify: asString(m.spotify),
    youtubeMusic: asString(m.youtube_music),
    appleMusic: asString(m.apple_music),
  };
}

/**
 * CONTENT_BY_KEY에 이 공연 전용 콘텐츠가 없을 때 쓰는 기본 상세 뷰 —
 * 티켓/사진 같은 수동 콘텐츠는 없지만 최소한 공연 정보와 세트리스트는
 * 보여준다. 나중에 이 공연의 content.mdx를 만들면 CONTENT_BY_KEY에
 * 등록해 이 기본 뷰를 덮어쓰면 된다.
 */
export function DefaultLiveContent({ live }: { live: LiveDetail }) {
  const { variation, spotify, youtubeMusic, appleMusic } = parseLiveMetadata(
    live.metadata,
  );
  const hasStreamingLinks = spotify || youtubeMusic || appleMusic;

  return (
    <div className="flex flex-col items-center gap-6">
      {live.poster_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={live.poster_image_url}
          alt={live.title}
          className="max-h-[60vh] w-auto rounded-lg object-contain"
        />
      ) : null}

      {live.additional_image_urls && live.additional_image_urls.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ZoomableImageGroup
            images={live.additional_image_urls.map((url, i) => ({
              src: url,
              alt: `${live.title} 추가 이미지 ${i + 1}`,
            }))}
            thumbnailWidth={200}
            thumbnailCrop="top"
          />
        </div>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">{live.title_ko}</h1>
        <p className="mt-1 text-sm text-white/60">{live.title}</p>
        {variation && (
          <p className="mt-1 text-sm text-white/50 italic">{variation}</p>
        )}
        <p className="mt-2 text-sm text-white/70">
          {formatLiveDate(live.live_date)} · {live.live_venue}
        </p>
        {hasStreamingLinks && (
          <div className="mt-2 flex items-center justify-center gap-2">
            {spotify && (
              <IconLinkButton
                href={spotify}
                icon={SpotifyIcon}
                label="Spotify에서 세트리스트 듣기"
                tone="spotify"
                size="md"
              />
            )}
            {youtubeMusic && (
              <IconLinkButton
                href={youtubeMusic}
                icon={YouTubeIcon}
                label="YouTube Music에서 세트리스트 듣기"
                tone="youtube"
                size="md"
              />
            )}
            {appleMusic && (
              <IconLinkButton
                href={appleMusic}
                icon={AppleMusicIcon}
                label="Apple Music에서 세트리스트 듣기"
                tone="appleMusic"
                size="md"
              />
            )}
          </div>
        )}
      </div>

      {live.setlist.length > 0 && (
        <section className="w-full">
          <h2 className="mb-2 text-center text-sm font-semibold tracking-wide text-white/70 uppercase">
            세트리스트 ({live.setlist.length}곡)
          </h2>
          <ul
            className={cn(
              "mx-auto flex w-full max-w-md flex-col divide-y divide-white/5 overflow-hidden rounded-lg bg-black/20",
            )}
          >
            {live.setlist.map((entry, i) => (
              <li key={entry.songId}>
                <SongLink href={entry.guideHref} index={i + 1}>
                  {entry.title} ({entry.titleKo})
                </SongLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
