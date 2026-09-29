import { cn } from "@/lib/utils";
import { AppleMusicIcon } from "@/components/icons/AppleMusicIcon";
import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";
import { parseStreamingMetadata } from "@/features/zutopia/lives/live-metadata";
import type { Json } from "@/lib/supabase/database.types";

export interface TicketCell {
  label: string;
  value: string;
  // 날짜처럼 숫자 위주 값은 모노 서체로, 장소명은 괄호 부연설명을 분리해
  // 두 줄로 보여준다.
  mono?: boolean;
}

// 티켓 본문 칸 사이 절취선 — MO는 칸을 세로로 쌓아 가로선, PC는 가로로
// 놓아 세로선이 된다.
const TICKET_DIVIDER_CLASS = cn(
  "border-ztmy-purple/40 border-t border-dashed",
  "tablet:w-0 tablet:border-t-0 tablet:border-l",
);

const TICKET_LABEL_CLASS = cn(
  "font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase",
  "tablet:text-xs",
);

/**
 * "본문 (부연설명)" 형태로 끝에 괄호가 붙어 있으면 분리한다 —
 * NextEventCard의 placeDesc(장소명 아래 회색 보조 텍스트)와 동일한 자리에
 * 쓰기 위함. 괄호가 없으면 그대로 하나의 문자열로 취급한다.
 */
export function splitParenSuffix(text: string): {
  main: string;
  suffix: string | null;
} {
  const match = text.match(/^(.*\S)\s+(\([^()]*\))$/);
  if (!match) return { main: text, suffix: null };
  return { main: match[1], suffix: match[2] };
}

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
}: {
  cells: TicketCell[];
  metadata: Json | null;
}) {
  const { variation, spotify, youtubeMusic, appleMusic } =
    parseStreamingMetadata(metadata);
  const hasStreamingLinks = spotify || youtubeMusic || appleMusic;

  return (
    <div className="relative w-full overflow-hidden bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <div className="from-ztmy-magenta to-ztmy-purple absolute inset-x-0 top-0 h-0.5 bg-linear-to-r" />

      <div className={cn("flex flex-col", "tablet:flex-row")}>
        {cells.map((cell, i) => (
          <TicketCellView key={cell.label} cell={cell} withDivider={i > 0} />
        ))}
      </div>

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

  return (
    <>
      {withDivider && <div className={TICKET_DIVIDER_CLASS} />}
      <div className={cn("flex-1 p-3", "tablet:p-6")}>
        <p className={TICKET_LABEL_CLASS}>{cell.label}</p>
        <p
          className={cn(
            "mt-1 text-sm text-white",
            cell.mono ? "font-mono" : "break-keep",
            "tablet:text-lg",
          )}
        >
          {main}
        </p>
        {suffix && (
          <p
            className={cn("text-xs font-bold text-white/50", "tablet:text-sm")}
          >
            {suffix}
          </p>
        )}
      </div>
    </>
  );
}
