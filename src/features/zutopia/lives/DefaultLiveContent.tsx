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

// 공연 타입 배지 점 색 — 페스티벌/콘서트/행사를 한눈에 구분하는 용도라
// 텍스트는 항상 흰색으로 고정하고(배경색 대비 걱정 없이) 점 색으로만
// 구분한다.
const LIVE_TYPE_LABEL: Record<Live["type"], string> = {
  FESTIVAL: "페스티벌",
  CONCERT: "콘서트",
  EVENT: "행사",
};
const LIVE_TYPE_DOT: Record<Live["type"], string> = {
  FESTIVAL: "bg-ztmy-pink",
  CONCERT: "bg-ztmy-magenta",
  EVENT: "bg-ztmy-sky",
};

/**
 * CONTENT_BY_KEY에 이 공연 전용 콘텐츠가 없을 때 쓰는 기본 상세 뷰 —
 * 티켓/사진 같은 수동 콘텐츠는 없지만 최소한 공연 정보와 세트리스트는
 * 보여준다. 나중에 이 공연의 content.mdx를 만들면 CONTENT_BY_KEY에
 * 등록해 이 기본 뷰를 덮어쓰면 된다.
 *
 * 레이아웃은 NextEventCard의 "콘서트 티켓 스텁" 모티프(점선 절취선으로
 * 나뉜 DATE/VENUE, accent 그라데이션 띠)를 그대로 확장한다 — 이 사이트가
 * 이미 갖고 있는 시각 언어라 새로 지어내지 않고 재사용한다. 스트리밍
 * 링크는 티켓 아래쪽에 가로 절취선으로 나뉜 "LISTEN" 구간으로 붙인다.
 */
export function DefaultLiveContent({ live }: { live: LiveDetail }) {
  const { variation, spotify, youtubeMusic, appleMusic } = parseLiveMetadata(
    live.metadata,
  );
  const hasStreamingLinks = spotify || youtubeMusic || appleMusic;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      {live.poster_image_url && (
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={live.poster_image_url}
            alt={live.title}
            className="max-h-[60vh] w-full rounded-lg object-contain"
          />
          <span
            className={cn(
              "absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm",
              "font-mono text-[10px] tracking-[0.2em] text-white uppercase",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                LIVE_TYPE_DOT[live.type],
              )}
            />
            {LIVE_TYPE_LABEL[live.type]}
          </span>
        </div>
      )}

      {live.additional_image_urls && live.additional_image_urls.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ZoomableImageGroup
            images={live.additional_image_urls.map((url, i) => ({
              src: url,
              alt: `${live.title} 추가 이미지 ${i + 1}`,
            }))}
            thumbnailWidth={96}
            thumbnailHeight={96}
          />
        </div>
      )}

      <div className="text-center">
        <h1 className="font-rocknroll text-3xl text-white">{live.title_ko}</h1>
        <p className="mt-1 font-mono text-xs tracking-[0.15em] text-white/50 uppercase">
          {live.title}
        </p>
        {variation && <p className="mt-2 text-sm text-white/60">{variation}</p>}
      </div>

      {/* 티켓 스텁 — 상단 accent 띠, DATE/VENUE를 점선으로 나눈 본 티켓,
      스트리밍 링크가 있으면 가로 절취선 아래 LISTEN 구간을 덧붙인다. */}
      <div className="relative w-full overflow-hidden bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="from-ztmy-magenta to-ztmy-purple absolute inset-x-0 top-0 h-0.5 bg-linear-to-r" />

        <div className="flex">
          <div className="flex-1 p-4">
            <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
              Date
            </p>
            <p className="mt-1 font-mono text-base text-white">
              {formatLiveDate(live.live_date)}
            </p>
          </div>

          <div className="border-ztmy-purple/40 w-0 border-l border-dashed" />

          <div className="flex-1 p-4">
            <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
              Venue
            </p>
            <p className="mt-1 text-base break-keep text-white">
              {live.live_venue}
            </p>
          </div>
        </div>

        {hasStreamingLinks && (
          <>
            <div className="border-ztmy-purple/40 border-t border-dashed" />
            <div className="flex items-center justify-between gap-3 p-4">
              <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
                Listen
              </p>
              <div className="flex items-center gap-2">
                {spotify && (
                  <IconLinkButton
                    href={spotify}
                    icon={SpotifyIcon}
                    label="Spotify에서 세트리스트 듣기"
                    tone="spotify"
                    variant="solid"
                    size="md"
                  />
                )}
                {youtubeMusic && (
                  <IconLinkButton
                    href={youtubeMusic}
                    icon={YouTubeIcon}
                    label="YouTube Music에서 세트리스트 듣기"
                    tone="youtube"
                    variant="solid"
                    size="md"
                  />
                )}
                {appleMusic && (
                  <IconLinkButton
                    href={appleMusic}
                    icon={AppleMusicIcon}
                    label="Apple Music에서 세트리스트 듣기"
                    tone="appleMusic"
                    variant="solid"
                    size="md"
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {live.setlist.length > 0 && (
        <section className="w-full">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <p className="text-base font-semibold text-white">세트리스트</p>
            <p className="font-mono text-xs text-white/40">
              {live.setlist.length} songs
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-white/5">
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
