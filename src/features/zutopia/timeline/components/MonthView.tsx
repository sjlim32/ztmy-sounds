import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";
import {
  bucketEvents,
  clusterThumbs,
  type Bucket,
} from "@/features/zutopia/timeline/buckets";
import type { TimelineEvent } from "@/features/zutopia/timeline/events";
import { EventThumb } from "./EventThumb";
import { ATTENDED_CLASS, KIND_CARD_CLASS, KIND_DOT_CLASS } from "./kind-style";
import { visibleNameCount } from "@/features/zutopia/timeline/interaction";
import { Dot, Stem } from "./parts";

/** 축과 카드 사이 — 공연 쪽엔 투어 기간 막대가 이 틈에 들어간다. */
const GAP = 28;

/**
 * 월 단계 — 달마다 공연 묶음(축 위)과 발매 묶음(축 아래) 카드 하나씩. 그림을
 * 겹쳐 쌓고(앨범이 나온 달은 앨범 커버 하나만) 그 달 일정 이름을 전부(한국어 + 일본어 병기). 투어는 축 바로 위 기간 막대. 묶음을 누르면
 * 그 달로 확대(주 단계). 카드가 축 위·아래 자리를 넘으면 이름을 들어가는 만큼만
 * 적고 '외 N개'(넘친 부분이 잘려 닿을 수 없게 되지 않도록).
 */
export function MonthView({
  events,
  x,
  axisY,
  top,
  height,
  attendedCounts,
  onOpen,
}: {
  events: TimelineEvent[];
  x: (date: string) => number;
  axisY: number;
  /** 카드가 들어갈 수 있는 위·아래 끝(시간 눈금 아래 ~ 상자 바닥). */
  top: number;
  height: number;
  attendedCounts: ReadonlyMap<string, number>;
  onOpen: (midDate: string) => void;
}) {
  const lives = bucketEvents(
    events.filter((event) => event.kind === "live"),
    "month",
  );
  const releases = bucketEvents(
    events.filter((event) => event.kind !== "live"),
    "month",
  );
  const tours = events.filter(
    (event) => event.kind === "live" && event.endDate,
  );

  return (
    <>
      {[...lives, ...releases].map((bucket) => (
        <Stem
          key={`stem:${bucket.events[0].kind}:${bucket.key}`}
          left={x(bucket.events[0].date)}
          top={bucket.events[0].kind === "live" ? axisY - GAP : axisY}
          height={GAP}
        />
      ))}
      {tours.map((event) => (
        <span
          key={`bar:${event.id}`}
          aria-hidden
          className={cn("absolute z-10 h-1.5 rounded-sm", "bg-ztmy-purple")}
          style={{
            left: x(event.date),
            width: Math.max(6, x(event.endDate!) - x(event.date)),
            top: axisY - 14,
          }}
        />
      ))}
      {events.map((event) => (
        <Dot
          key={event.id}
          kind={event.kind}
          left={x(event.date)}
          axisY={axisY}
        />
      ))}
      {lives.map((bucket) => (
        <Cluster
          key={`live:${bucket.key}`}
          bucket={bucket}
          x={x}
          style={{ bottom: `calc(100% - ${axisY - GAP}px)` }}
          space={axisY - GAP - top - 4}
          attendedCounts={attendedCounts}
          onOpen={onOpen}
        />
      ))}
      {releases.map((bucket) => (
        <Cluster
          key={`release:${bucket.key}`}
          bucket={bucket}
          x={x}
          style={{ top: axisY + GAP }}
          space={height - (axisY + GAP) - 8}
          attendedCounts={attendedCounts}
          onOpen={onOpen}
        />
      ))}
    </>
  );
}

function Cluster({
  bucket,
  x,
  style,
  space,
  attendedCounts,
  onOpen,
}: {
  bucket: Bucket;
  x: (date: string) => number;
  style: React.CSSProperties;
  /** 카드가 쓸 수 있는 높이 — 넘치면 이름을 줄이고 '외 N개'. */
  space: number;
  attendedCounts: ReadonlyMap<string, number>;
  onOpen: (midDate: string) => void;
}) {
  const left = x(bucket.start);
  const width = x(bucket.end) - left - 6;
  const highlights = clusterThumbs(bucket.events);
  const first = highlights[0];
  const attended = bucket.events.some((event) => attendedCounts.has(event.id));
  const shown = visibleNameCount(bucket.events.length, space);
  const hidden = bucket.events.length - shown;
  return (
    <button
      type="button"
      onClick={() => onOpen(`${bucket.key}-15`)}
      title="눌러서 이 달 확대"
      className={cn(
        "absolute z-20 flex flex-col gap-1.5 rounded-lg p-1.5 text-left shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition-[filter] hover:z-40 hover:brightness-125",
        FOCUS_RING,
        KIND_CARD_CLASS[
          bucket.events.length === 1
            ? first.kind
            : first.kind === "live"
              ? "live"
              : "song"
        ],
        attended && ATTENDED_CLASS,
      )}
      style={{ left: left + 3, width, ...style }}
    >
      <span className="flex">
        {highlights.map((event, index) => (
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
      {/* 이름은 말줄임 없이 전부 — 한국어(진하게) + 일본어 병기 */}
      <span className="flex flex-col gap-1">
        {bucket.events.slice(0, shown).map((event) => (
          <span key={event.id} className="flex min-w-0 items-start gap-1.5">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-2 shrink-0",
                KIND_DOT_CLASS[event.kind],
              )}
            />
            <span className="min-w-0 text-sm leading-snug break-words">
              <span className="font-semibold text-white">{event.label}</span>
              {event.subLabel && (
                <span className="block text-white/55">{event.subLabel}</span>
              )}
              {event.tag && (
                <span className="text-ztmy-sun block">{event.tag}</span>
              )}
            </span>
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
