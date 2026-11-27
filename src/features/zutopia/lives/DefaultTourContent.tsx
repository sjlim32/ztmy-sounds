import { ARTIST } from "@/data/artist";
import { cn } from "@/lib/utils";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { SectionHeader } from "@/components/SectionHeader";
import { parseStreamingMetadata } from "@/features/zutopia/lives/live-metadata";
import { LIVE_SURFACE_CLASS } from "@/features/zutopia/lives/surface";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";
import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { AppleMusicIcon } from "@/components/icons/AppleMusicIcon";
import { XIcon } from "@/components/icons/XIcon";
import { PlaneIcon } from "@/components/icons/PlaneIcon";
import { countTourShows } from "@/features/zutopia/lives/tour-shows";
import { formatTourPeriod } from "@/features/zutopia/lives/tour-period";
import { TourOverview } from "@/features/zutopia/lives/TourOverview";
import { TourPoster } from "@/features/zutopia/lives/TourPoster";
import type { TourDetail } from "@/features/zutopia/lives/types";
import {
  formatVisitLabel,
  parseVisitOrdinal,
} from "@/features/zutopia/lives/visit";
import { rocknrollOne } from "@/features/zutopia/lives/rocknroll-font";

/**
 * 투어(콘서트) 상세 페이지 — 높이가 늘 같은 머리(3:4 고정 포스터 + 제목 — 특별 정보(첫 번째
 * 내한 등)는 제목 위 분홍 굵은 글자, 같은 줄 오른쪽에 기간·공연 횟수·음원/X 링크를 담은 정보
 * 카드 — 모바일은 그 아래) 아래에 목록-상세
 * 2단(TourOverview: 왼쪽 공연 일정 고르는 목록, 오른쪽 투어 세트리스트 또는 그날 세트리스트).
 * Variation·추가 이미지는 맨 아래 "공연 정보"(둘 다 없으면 없음). 아직 공연일 데이터가 없는
 * 투어(dates가 빈 배열)는 안내 문구만 — DB에는 투어만 먼저 등록하고 개별 공연일은 나중에
 * 채우는 흐름이다.
 */
export function DefaultTourContent({ tour }: { tour: TourDetail }) {
  const visitOrdinal = parseVisitOrdinal(tour.metadata);
  const posterUrl = tour.poster_image_url;
  const { variation, spotify, youtubeMusic, appleMusic, twit } =
    parseStreamingMetadata(tour.metadata);
  const images = tour.additional_image_urls ?? [];
  const held = tour.dates.filter((date) => !date.canceled);
  const period = formatTourPeriod(tour.start_date, tour.end_date);
  const links = [
    spotify && {
      href: spotify,
      icon: SpotifyIcon,
      label: "Spotify에서 세트리스트 듣기",
      tone: "spotify" as const,
    },
    youtubeMusic && {
      href: youtubeMusic,
      icon: YouTubeIcon,
      label: "YouTube Music에서 세트리스트 듣기",
      tone: "youtube" as const,
    },
    appleMusic && {
      href: appleMusic,
      icon: AppleMusicIcon,
      label: "Apple Music에서 세트리스트 듣기",
      tone: "appleMusic" as const,
    },
    twit && {
      href: twit,
      icon: XIcon,
      label: "X에서 공연 게시물 보기",
      tone: "x" as const,
    },
  ].filter((link) => !!link);
  const fact = (label: string, value: string) => (
    <div className="flex items-baseline gap-2">
      <dt className="w-8 shrink-0 text-sm text-white/55">{label}</dt>
      <dd className="font-mono text-sm text-white">{value}</dd>
    </div>
  );

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col gap-6",
        "tablet:max-w-2xl tablet:gap-8",
        // PC는 목록(최대 1440px)에서 들어왔을 때 폭이 확 줄어 보이지 않게 한 단계 넓힌다.
        "pc:max-w-6xl",
      )}
    >
      {/* 머리 — 포스터·제목과 같은 줄 오른쪽(모바일은 그 아래)에 공연 정보 카드 */}
      <header
        className={cn(
          "flex w-full flex-col gap-3",
          "pc:flex-row pc:items-center pc:gap-6",
        )}
      >
        <div
          className={cn("flex min-w-0 flex-1 items-center gap-4", "pc:gap-6")}
        >
          {posterUrl && (
            <TourPoster
              src={posterUrl}
              alt={tour.title}
              slug={tour.slug ?? ""}
            />
          )}
          <div className="min-w-0">
            {/* 특별 정보(첫 번째 내한 등)는 제목 바로 위 분홍 굵은 글자 — 눈이 먼저 가는 자리. */}
            {visitOrdinal != null && (
              <p className="text-ztmy-pink mb-0.5 flex items-center gap-1.5 text-sm font-bold">
                <PlaneIcon className="size-4 shrink-0" />
                {formatVisitLabel(visitOrdinal)}
              </p>
            )}
            <h1
              title={tour.title_ko ?? undefined}
              className={cn(
                rocknrollOne.className,
                "line-clamp-2 text-lg leading-snug text-white",
                "pc:text-2xl",
              )}
            >
              {tour.title_ko}
            </h1>
            {/* 누구의 공연인지 본문에도 적는다 — 구조화 데이터(MusicEvent performer)와 맞추고,
            "즛토마요 + 공연명" 검색에 걸리게. */}
            <p className="truncate text-sm text-white/50">
              <span className="font-mono tracking-[0.15em] uppercase">
                {tour.title}
              </span>
              <span className="mx-1.5 text-white/30">·</span>
              {ARTIST.name.jp}
            </p>
          </div>
        </div>
        <dl
          className={cn(
            LIVE_SURFACE_CLASS,
            // 항목은 한 줄씩, 글자는 줄바꿈 없이 — PC는 기본 폭을 넉넉히(20rem) 주고 글자가
            // 길면 카드가 그만큼 넓어진다(제목 칸이 줄어든다). 모바일은 전체 폭.
            "rounded-card flex flex-col gap-1.5 px-4 py-3 whitespace-nowrap",
            "pc:w-auto pc:min-w-80 pc:shrink-0",
          )}
        >
          {fact("기간", period)}
          {held.length > 0 && fact("공연", `${countTourShows(held)}회`)}
          {links.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <dt className="sr-only">링크</dt>
              {links.map((link) => (
                <dd key={link.label}>
                  <IconLinkButton
                    href={link.href}
                    icon={link.icon}
                    label={link.label}
                    tone={link.tone}
                    variant="solid"
                    size="sm"
                  />
                </dd>
              ))}
            </div>
          )}
        </dl>
      </header>

      <TourOverview tour={tour} />

      {(variation || images.length > 0) && (
        <section className="flex w-full flex-col gap-3">
          <SectionHeader title="공연 정보" />
          {variation && (
            <p className="text-sm break-keep text-white/80">
              <span className="mr-2 font-mono text-sm tracking-[0.2em] text-white/50 uppercase">
                Variation
              </span>
              {variation}
            </p>
          )}
          {images.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <ZoomableImageGroup
                images={images.map((url, i) => ({
                  src: url,
                  alt: `${tour.title} 추가 이미지 ${i + 1}`,
                }))}
                thumbnailWidth={96}
                thumbnailHeight={96}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
