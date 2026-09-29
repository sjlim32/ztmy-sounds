import { cn } from "@/lib/utils";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { formatLiveDate } from "@/features/zutopia/lives/data";
import { LiveTicket } from "@/features/zutopia/lives/LiveTicket";
import { LiveTypeBadge } from "@/features/zutopia/lives/LiveTypeBadge";
import { TourDateList } from "@/features/zutopia/lives/TourDateList";
import type { TourDetail } from "@/features/zutopia/lives/types";
import { VisitBadge } from "@/features/zutopia/lives/VisitBadge";
import { parseVisitOrdinal } from "@/features/zutopia/lives/visit";

/**
 * 투어(단독 공연) 상세 페이지 — DefaultLiveContent와 같은 시각 언어(포스터
 * + 뱃지, 로고 서체 제목, 티켓 스텁)를 쓴다. 티켓(기간·variation·음원
 * 링크)은 tours 행의 컬럼으로 그리고, 투어에 묶인 개별 공연일(dates)은
 * 자기 페이지 없이 아래 일정 목록에서 펼쳐 세트리스트를 보여준다. 아직
 * 공연일 데이터가 없는 투어(dates가 빈 배열)는 안내 문구만 보여준다 —
 * DB에는 투어만 먼저 등록하고 개별 공연일은 나중에 채우는 흐름이다.
 */
export function DefaultTourContent({ tour }: { tour: TourDetail }) {
  const visitOrdinal = parseVisitOrdinal(tour.metadata);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-6",
        "tablet:max-w-2xl tablet:gap-8",
      )}
    >
      {tour.poster_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tour.poster_image_url}
          alt={tour.title}
          className={cn(
            "max-h-[60vh] max-w-full rounded-lg object-contain",
            "tablet:max-h-[65vh]",
          )}
        />
      )}

      {tour.additional_image_urls && tour.additional_image_urls.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ZoomableImageGroup
            images={tour.additional_image_urls.map((url, i) => ({
              src: url,
              alt: `${tour.title} 추가 이미지 ${i + 1}`,
            }))}
            thumbnailWidth={96}
            thumbnailHeight={96}
          />
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <LiveTypeBadge type="TOUR" />
          {visitOrdinal !== null && <VisitBadge ordinal={visitOrdinal} />}
        </div>
        <h1
          className={cn(
            "font-rocknroll mt-3 text-xl text-white",
            "tablet:mt-4 tablet:text-3xl",
          )}
        >
          {tour.title_ko}
        </h1>
        <p
          className={cn(
            "mt-1 font-mono text-xs tracking-[0.15em] text-white/50 uppercase",
            "tablet:text-base",
          )}
        >
          {tour.title}
        </p>
      </div>

      <LiveTicket
        cells={[
          {
            label: "Tour Period",
            value:
              tour.end_date && tour.end_date !== tour.start_date
                ? `${formatLiveDate(tour.start_date)} ~ ${formatLiveDate(tour.end_date)}`
                : formatLiveDate(tour.start_date),
            mono: true,
          },
        ]}
        metadata={tour.metadata}
      />

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
            공연 일정
          </p>
          <p
            className={cn("font-mono text-xs text-white/40", "tablet:text-sm")}
          >
            {tour.dates.length} dates
          </p>
        </div>

        {tour.dates.length > 0 ? (
          <TourDateList dates={tour.dates} />
        ) : (
          <p className={cn("pt-3 text-sm text-white/50", "tablet:text-base")}>
            세부 공연 일정이 곧 업데이트됩니다.
          </p>
        )}
      </section>
    </div>
  );
}
