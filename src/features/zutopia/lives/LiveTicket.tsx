import { cn } from "@/lib/utils";
import { splitParenSuffix } from "@/features/zutopia/lives/split-paren-suffix";
import { LIVE_SURFACE_CLASS } from "@/features/zutopia/lives/surface";
import {
  LiveTypeBadge,
  type LiveBadgeType,
} from "@/features/zutopia/lives/LiveTypeBadge";
import { VisitBadge } from "@/features/zutopia/lives/VisitBadge";
import { AppleMusicIcon } from "@/components/icons/AppleMusicIcon";
import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { MapPinIcon } from "@/components/icons/MapPinIcon";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";
import { parseStreamingMetadata } from "@/features/zutopia/lives/live-metadata";
import type { Json } from "@/lib/supabase/database.types";

interface TicketCell {
  label: string;
  value: string;
  // 날짜처럼 숫자 위주 값은 모노 서체로, 장소명은 괄호 부연설명을 분리해
  // 두 줄로 보여준다.
  mono?: boolean;
  /**
   * 장소처럼 긴 값 — 다른 칸 아래에 전체 폭 한 줄로 두고, 줄바꿈하지 않는다
   * (그래도 넘치면 말줄임).
   */
  wide?: boolean;
  /** 값을 이 주소로 새 창 링크로 연다(장소 → 지도). */
  href?: string | null;
}

// 티켓 본문 칸 사이 절취선 — MO는 칸을 세로로 쌓아 가로선, PC는 가로로
// 놓아 세로선이 된다.
const TICKET_DIVIDER_CLASS = cn(
  "border-ztmy-purple/40 border-t border-dashed",
  "tablet:w-0 tablet:border-t-0 tablet:border-l",
);

const TICKET_LABEL_CLASS =
  "font-mono text-xs tracking-[0.25em] text-white/60 uppercase";

/**
 * 공연/투어 상세 공용 "콘서트 티켓 스텁" — NextEventCard의 모티프(점선
 * 절취선으로 나뉜 칸, accent 그라데이션 띠)를 확장한다. 본 티켓 칸(cells)
 * 아래로 metadata의 variation 한 줄과 음원 링크(LISTEN) 구간을 각각 값이
 * 있을 때만 가로 절취선으로 덧붙인다. 투어는 소속 공연이 아니라 tours
 * 행의 metadata를 넘긴다.
 */
export function LiveTicket({
  cells,
  metadata,
  type,
  visitOrdinal = null,
}: {
  cells: TicketCell[];
  metadata: Json | null;
  /** 티켓 맨 위 줄 왼쪽의 공연 종류(CONCERT·FESTIVAL…). */
  type: LiveBadgeType;
  /** 내한 공연이면 몇 번째인지 — 맨 위 줄 오른쪽 태그. */
  visitOrdinal?: number | null;
}) {
  const { variation, spotify, youtubeMusic, appleMusic } =
    parseStreamingMetadata(metadata);
  const hasStreamingLinks = spotify || youtubeMusic || appleMusic;

  return (
    <div className={cn(LIVE_SURFACE_CLASS, "relative w-full overflow-hidden")}>
      <div className="from-ztmy-magenta to-ztmy-purple absolute inset-x-0 top-0 h-0.5 bg-linear-to-r" />

      {/* 맨 위 줄: 공연 종류 + 내한 태그 — 티켓 정보와 한 덩어리로 읽히게 안에
      두고, 둘을 왼쪽에 나란히 붙여 "콘서트 · 두 번째 내한"처럼 한 번에 읽히게
      한다(양 끝으로 떨어뜨리면 넓은 화면에서 따로 논다). */}
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5",
          "tablet:px-6 tablet:py-3",
        )}
      >
        <LiveTypeBadge type={type} />
        {visitOrdinal != null && (
          <VisitBadge ordinal={visitOrdinal} size="lg" />
        )}
      </div>
      <div className="border-ztmy-purple/40 border-t border-dashed" />

      <div className={cn("flex flex-col", "tablet:flex-row")}>
        {cells
          .filter((cell) => !cell.wide)
          .map((cell, i) => (
            <TicketCellView key={cell.label} cell={cell} withDivider={i > 0} />
          ))}
      </div>
      {/* 넓은 칸(장소)은 PC에서도 날짜·지역 옆에 끼우지 않고 아래에 전체 폭 한
      줄로 둔다 — 옆에 두면 폭이 모자라 줄바꿈되거나 잘린다. */}
      {cells
        .filter((cell) => cell.wide)
        .map((cell) => (
          <div key={cell.label}>
            <div className="border-ztmy-purple/40 border-t border-dashed" />
            <TicketCellView cell={cell} withDivider={false} />
          </div>
        ))}

      {variation && (
        <>
          <div className="border-ztmy-purple/40 border-t border-dashed" />
          <div
            className={cn(
              "flex items-center justify-between gap-3 p-3",
              "tablet:p-6",
            )}
          >
            <p className={cn("shrink-0", TICKET_LABEL_CLASS)}>Variation</p>
            <p
              className={cn(
                "text-right text-xs break-keep text-white",
                "tablet:text-base",
              )}
            >
              {variation}
            </p>
          </div>
        </>
      )}

      {hasStreamingLinks && (
        <>
          <div className="border-ztmy-purple/40 border-t border-dashed" />
          <div
            className={cn(
              "flex items-center justify-between gap-3 p-3",
              "tablet:p-6",
            )}
          >
            <p className={TICKET_LABEL_CLASS}>Listen</p>
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
  );
}

function TicketCellView({
  cell,
  withDivider,
}: {
  cell: TicketCell;
  withDivider: boolean;
}) {
  const { main, suffix } = cell.mono
    ? { main: cell.value, suffix: null }
    : splitParenSuffix(cell.value);

  const valueClass = cn(
    "mt-1 text-sm text-white",
    cell.mono ? "font-mono" : "break-keep",
    cell.wide && "truncate",
    "tablet:text-lg",
  );

  return (
    <>
      {withDivider && <div className={TICKET_DIVIDER_CLASS} />}
      <div className={cn("min-w-0 flex-1 p-3", "tablet:p-6")}>
        <p className={TICKET_LABEL_CLASS}>{cell.label}</p>
        {cell.href ? (
          <a
            href={cell.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`${cell.value} — 지도에서 보기`}
            className={cn(
              "group hover:text-ztmy-pink flex items-center gap-1.5 transition-colors",
              valueClass,
            )}
          >
            <span className="truncate">{main}</span>
            <MapPinIcon
              className={cn(
                "group-hover:text-ztmy-pink h-3.5 w-3.5 shrink-0 text-white/50 transition-colors",
                "tablet:h-4 tablet:w-4",
              )}
            />
          </a>
        ) : (
          <p className={valueClass} title={cell.wide ? cell.value : undefined}>
            {main}
          </p>
        )}
        {suffix && (
          <p
            className={cn(
              "text-xs font-bold text-white/50",
              cell.wide && "truncate",
              "tablet:text-sm",
            )}
          >
            {suffix}
          </p>
        )}
      </div>
    </>
  );
}
