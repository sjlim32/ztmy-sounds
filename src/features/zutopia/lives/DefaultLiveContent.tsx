import { cn } from "@/lib/utils";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { formatLiveDate } from "@/features/zutopia/lives/data";
import { LiveTicket } from "@/features/zutopia/lives/LiveTicket";
import { LiveTypeBadge } from "@/features/zutopia/lives/LiveTypeBadge";
import { Setlist } from "@/features/zutopia/lives/Setlist";
import type { LiveDetail } from "@/features/zutopia/lives/types";
import { VisitBadge } from "@/features/zutopia/lives/VisitBadge";
import { parseVisitOrdinal } from "@/features/zutopia/lives/visit";

/**
 * CONTENT_BY_KEY에 이 공연 전용 콘텐츠가 없을 때 쓰는 기본 상세 뷰 —
 * 티켓/사진 같은 수동 콘텐츠는 없지만 최소한 공연 정보와 세트리스트는
 * 보여준다. 나중에 이 공연의 content.mdx를 만들면 CONTENT_BY_KEY에
 * 등록해 이 기본 뷰를 덮어쓰면 된다.
 *
 * 감싸는 ZutopiaScrollArea는 tablet 이상에서 max-w-4xl까지 넓어지는데
 * (credits 페이지와 동일한 폭 컨벤션은 max-w-2xl), 이 카드가 모바일 폭에
 * 고정돼 있으면 그 여유 공간을 전혀 못 써서 넓은 화면에서 휑해 보인다 —
 * 컨테이너 폭과 텍스트/여백을 tablet 기준으로 함께 키운다.
 */
export function DefaultLiveContent({ live }: { live: LiveDetail }) {
  const visitOrdinal = parseVisitOrdinal(live.metadata);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-6",
        "tablet:max-w-2xl tablet:gap-8",
      )}
    >
      {live.poster_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={live.poster_image_url}
          alt={live.title}
          className={cn(
            "max-h-[60vh] max-w-full rounded-lg object-contain",
            "tablet:max-h-[65vh]",
          )}
        />
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

      <div className="flex flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <LiveTypeBadge type={live.type} />
          {visitOrdinal !== null && <VisitBadge ordinal={visitOrdinal} />}
        </div>
        <h1
          className={cn(
            "font-rocknroll mt-3 text-xl text-white",
            "tablet:mt-4 tablet:text-3xl",
          )}
        >
          {live.title_ko ?? live.title}
        </h1>
        <p
          className={cn(
            "mt-1 font-mono text-xs tracking-[0.15em] text-white/50 uppercase",
            "tablet:text-base",
          )}
        >
          {live.title}
        </p>
      </div>

      <LiveTicket
        cells={[
          {
            label: "Date",
            value: live.live_date
              ? formatLiveDate(live.live_date)
              : live.end_date && live.end_date !== live.start_date
                ? `${formatLiveDate(live.start_date)} ~ ${formatLiveDate(live.end_date)}`
                : formatLiveDate(live.start_date),
            mono: true,
          },
          ...(live.region ? [{ label: "Region", value: live.region }] : []),
          { label: "Venue", value: live.live_venue },
        ]}
        metadata={live.metadata}
      />

      {live.setlist.length > 0 && <Setlist entries={live.setlist} />}
    </div>
  );
}
