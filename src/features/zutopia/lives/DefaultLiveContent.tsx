import { cn } from "@/lib/utils";
import { AppleMusicIcon } from "@/components/icons/AppleMusicIcon";
import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";
import { formatLiveDate } from "./data";
import { LiveTypeBadge } from "./LiveTypeBadge";
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
 * live_venue 끝에 "장소명 (부연설명)" 형태로 괄호가 붙어 있으면 분리한다 —
 * NextEventCard의 placeDesc(장소명 아래 회색 보조 텍스트)와 동일한 자리에
 * 쓰기 위함. 괄호가 없으면 그대로 하나의 문자열로 취급한다.
 */
function splitVenue(venue: string): { main: string; suffix: string | null } {
  const match = venue.match(/^(.*\S)\s+(\([^()]*\))$/);
  if (!match) return { main: venue, suffix: null };
  return { main: match[1], suffix: match[2] };
}

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
 *
 * 감싸는 ZutopiaScrollArea는 tablet 이상에서 max-w-4xl까지 넓어지는데
 * (credits 페이지와 동일한 폭 컨벤션은 max-w-2xl), 이 카드가 모바일 폭에
 * 고정돼 있으면 그 여유 공간을 전혀 못 써서 넓은 화면에서 휑해 보인다 —
 * 컨테이너 폭과 텍스트/여백을 tablet 기준으로 함께 키운다.
 */
export function DefaultLiveContent({ live }: { live: LiveDetail }) {
  const { variation, spotify, youtubeMusic, appleMusic } = parseLiveMetadata(
    live.metadata,
  );
  const hasStreamingLinks = spotify || youtubeMusic || appleMusic;
  const venue = splitVenue(live.live_venue);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-6",
        "tablet:max-w-2xl tablet:gap-8",
      )}
    >
      {live.poster_image_url && (
        <div className="relative">
          {/* w-full로 박스를 강제하면 세로가 긴 포스터에서 max-h가 높이만
          줄여 object-contain이 여백(레터박스)을 만들고, 뱃지는 그 박스
          모서리에 고정돼 실제 이미지 밖 여백에 떠 보인다. 박스를 이미지의
          실제 렌더 크기(auto 폭 + max-h)에 맞춰야 뱃지가 항상 이미지
          모서리에 붙는다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={live.poster_image_url}
            alt={live.title}
            className={cn(
              "max-h-[60vh] max-w-full rounded-lg object-contain",
              "tablet:max-h-[65vh]",
            )}
          />
          <LiveTypeBadge type={live.type} />
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
        <h1
          className={cn("font-rocknroll text-xl text-white", "tablet:text-3xl")}
        >
          {live.title_ko}
        </h1>
        <p
          className={cn(
            "mt-1 font-mono text-xs tracking-[0.15em] text-white/50 uppercase",
            "tablet:text-base",
          )}
        >
          {live.title}
        </p>
        {variation && (
          <p className={cn("mt-2 text-sm text-white/60", "tablet:text-base")}>
            {variation}
          </p>
        )}
      </div>

      {/* 티켓 스텁 — 상단 accent 띠, DATE/VENUE를 점선으로 나눈 본 티켓,
      스트리밍 링크가 있으면 가로 절취선 아래 LISTEN 구간을 덧붙인다. */}
      <div className="relative w-full overflow-hidden bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="from-ztmy-magenta to-ztmy-purple absolute inset-x-0 top-0 h-0.5 bg-linear-to-r" />

        <div className="flex">
          <div className={cn("flex-1 p-4", "tablet:p-6")}>
            <p
              className={cn(
                "font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase",
                "tablet:text-xs",
              )}
            >
              Date
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-base text-white",
                "tablet:text-lg",
              )}
            >
              {formatLiveDate(live.live_date)}
            </p>
          </div>

          <div className="border-ztmy-purple/40 w-0 border-l border-dashed" />

          <div className={cn("flex-1 p-4", "tablet:p-6")}>
            <p
              className={cn(
                "font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase",
                "tablet:text-xs",
              )}
            >
              Venue
            </p>
            <p
              className={cn(
                "mt-1 text-base break-keep text-white",
                "tablet:text-lg",
              )}
            >
              {venue.main}
            </p>
            {venue.suffix && (
              <p
                className={cn(
                  "text-xs font-bold text-white/50",
                  "tablet:text-sm",
                )}
              >
                {venue.suffix}
              </p>
            )}
          </div>
        </div>

        {hasStreamingLinks && (
          <>
            <div className="border-ztmy-purple/40 border-t border-dashed" />
            <div
              className={cn(
                "flex items-center justify-between gap-3 p-4",
                "tablet:p-6",
              )}
            >
              <p
                className={cn(
                  "font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase",
                  "tablet:text-xs",
                )}
              >
                Listen
              </p>
              <div className={cn("flex items-center gap-2", "tablet:gap-3")}>
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
          <div
            className={cn(
              "flex items-baseline justify-between border-b border-white/10 pb-2",
              "tablet:pb-3",
            )}
          >
            <p
              className={cn(
                "text-base font-semibold text-white",
                "tablet:text-lg",
              )}
            >
              세트리스트
            </p>
            <p
              className={cn(
                "font-mono text-xs text-white/40",
                "tablet:text-sm",
              )}
            >
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
