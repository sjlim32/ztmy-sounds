import { cn } from "@/lib/utils";
import { bucketEvents, type Bucket } from "@/features/zutopia/timeline/buckets";
import type { TimelineEvent } from "@/features/zutopia/timeline/events";
import { visibleNameCount } from "@/features/zutopia/timeline/interaction";
import { Dot, Stem } from "./parts";
import { ClusterCard } from "./summary-cards";

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
  return (
    <ClusterCard
      events={bucket.events}
      shown={visibleNameCount(bucket.events.length, space)}
      compact
      attended={bucket.events.some((event) => attendedCounts.has(event.id))}
      onOpen={() => onOpen(`${bucket.key}-15`)}
      className="absolute z-20 hover:z-40"
      style={{ left: left + 3, width: x(bucket.end) - left - 6, ...style }}
    />
  );
}
