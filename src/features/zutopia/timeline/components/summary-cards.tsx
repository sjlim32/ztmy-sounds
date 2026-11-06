import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";
import {
  clusterThumbs,
  pickHighlights,
} from "@/features/zutopia/timeline/buckets";
import type { TimelineEvent } from "@/features/zutopia/timeline/events";
import { EventThumb } from "./EventThumb";
import {
  ATTENDED_CLASS,
  KIND_CARD_CLASS,
  KIND_DOT_CLASS,
  TAG_TEXT_CLASS,
  UPCOMING_CLASS,
} from "./kind-style";
import { KindCounts } from "./parts";

/**
 * 해 요약 카드(연 단계, PC·모바일 공용) — 종류별 수, 대표 그림 4장(앨범 → 공연 →
 * 곡), 앨범·공연 이름 4개까지. 내가 간 공연이 있는 해는 마젠타 테두리. 누르면
 * 그 해로 확대.
 */
export function YearSummaryCard({
  events,
  attended,
  onOpen,
  className,
}: {
  events: TimelineEvent[];
  attended: boolean;
  onOpen: () => void;
  className?: string;
}) {
  const highlights = pickHighlights(events, 4);
  const names = events.filter((event) => event.kind !== "song");
  return (
    <button
      type="button"
      onClick={onOpen}
      title="눌러서 이 해 확대"
      className={cn(
        "flex w-full flex-col gap-3 overflow-hidden rounded-xl bg-[color-mix(in_oklab,white_7%,var(--color-background))] p-3 text-left shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition-[filter] hover:brightness-125",
        FOCUS_RING,
        attended && ATTENDED_CLASS,
        className,
      )}
    >
      <KindCounts events={events} className="text-sm text-white/80" />
      <span className="grid grid-cols-2 gap-1.5">
        {highlights.map((event) => (
          <EventThumb
            key={event.id}
            src={event.imageUrl}
            displayWidth={160}
            className="aspect-square w-full"
          />
        ))}
      </span>
      {names.length > 0 && (
        <span className="flex flex-col gap-1">
          {names.slice(0, 4).map((event) => (
            <span
              key={event.id}
              className="flex min-w-0 items-center gap-1.5 text-sm text-white/85"
            >
              <span
                aria-hidden
                className={cn("size-2 shrink-0", KIND_DOT_CLASS[event.kind])}
              />
              <span className="truncate">{event.label}</span>
            </span>
          ))}
          {names.length > 4 && (
            <span className="text-sm text-white/50">
              외 {names.length - 4}개
            </span>
          )}
        </span>
      )}
    </button>
  );
}

/**
 * 묶음 카드 겉(월 단계, PC·모바일 공용) — 그림(앨범이 있으면 앨범 커버 하나만,
 * 없으면 겹친 3장) + 이름 목록(한국어 진하게 + 일본어 병기, 분류·예정). 넘치면
 * shown개만 적고 '외 N개'.
 */
export function ClusterCard({
  events,
  shown = events.length,
  compact = false,
  attended,
  onOpen,
  className,
  style,
}: {
  events: TimelineEvent[];
  shown?: number;
  /**
   * 좁은 카드(PC 월 단계, 한 달 폭) — 이름마다 한국어 한 줄 + 병기·분류·예정 한
   * 줄로 줄여(말줄임, 전체는 마우스를 올리면) 높이를 이름당 두 줄로 고정한다.
   * 넘침 어림(visibleNameCount)이 실제 높이와 맞게.
   */
  compact?: boolean;
  attended: boolean;
  onOpen: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const thumbs = clusterThumbs(events);
  const first = thumbs[0];
  const hidden = events.length - shown;
  return (
    <button
      type="button"
      onClick={onOpen}
      title="눌러서 이 달 확대"
      className={cn(
        "flex flex-col gap-1.5 rounded-lg p-1.5 text-left shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition-[filter] hover:brightness-125",
        FOCUS_RING,
        KIND_CARD_CLASS[
          events.length === 1
            ? first.kind
            : first.kind === "live"
              ? "live"
              : "song"
        ],
        attended && ATTENDED_CLASS,
        events.every((event) => event.upcoming) && UPCOMING_CLASS,
        className,
      )}
      style={style}
    >
      <span className="flex">
        {thumbs.map((event, index) => (
          <EventThumb
            key={event.id}
            src={event.imageUrl}
            className={cn(
              "ring-background size-10 ring-2",
              index > 0 && "-ml-4",
            )}
          />
        ))}
      </span>
      <span className="flex flex-col gap-1">
        {events.slice(0, shown).map((event) => (
          <span key={event.id} className="flex min-w-0 items-start gap-1.5">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-2 shrink-0",
                KIND_DOT_CLASS[event.kind],
              )}
            />
            {compact ? (
              <span
                className="min-w-0 text-sm leading-snug"
                title={[event.label, event.subLabel, event.tag]
                  .filter(Boolean)
                  .join(" · ")}
              >
                <span className="block truncate font-semibold text-white">
                  {event.label}
                </span>
                <span className="block truncate text-white/60">
                  {[event.subLabel, event.tag, event.upcoming ? "예정" : null]
                    .filter(Boolean)
                    .join(" · ") || "\u00a0"}
                </span>
              </span>
            ) : (
              <span className="min-w-0 text-sm leading-snug break-words">
                <span className="font-semibold text-white">{event.label}</span>
                {event.subLabel && (
                  <span className="block text-white/60">{event.subLabel}</span>
                )}
                {event.tag && (
                  <span className={cn("block", TAG_TEXT_CLASS[event.kind])}>
                    {event.tag}
                  </span>
                )}
                {event.upcoming && (
                  <span className="block text-white/60">예정</span>
                )}
              </span>
            )}
          </span>
        ))}
        {hidden > 0 && (
          <span className="text-sm text-white/55">
            외 {hidden}개 · 눌러서 보기
          </span>
        )}
      </span>
    </button>
  );
}
