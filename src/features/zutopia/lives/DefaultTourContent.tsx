import { ThumbImage } from "@/components/ThumbImage";
import { ViewTransition } from "react";
import { posterTransitionName } from "@/features/zutopia/lives/poster-transition";
import { cn } from "@/lib/utils";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { formatLiveDate } from "@/features/zutopia/lives/data";
import { LiveTicket } from "@/features/zutopia/lives/LiveTicket";
import { countTourShows } from "@/features/zutopia/lives/tour-shows";
import {
  LiveSchedule,
  TourCommonSetlist,
} from "@/features/zutopia/lives/TourDateList";
import type { TourDetail } from "@/features/zutopia/lives/types";
import { parseVisitOrdinal } from "@/features/zutopia/lives/visit";
import { rocknrollOne } from "@/features/zutopia/lives/rocknroll-font";

/**
 * 투어(콘서트) 상세 페이지 — DefaultLiveContent와 같은 시각 언어(포스터
 * + 뱃지, 로고 서체 제목, 티켓 스텁)를 쓴다. 티켓(기간·variation·음원
 * 링크)은 tours 행의 컬럼으로 그리고, 투어에 묶인 개별 공연일(dates)은
 * 자기 페이지 없이 아래 일정 목록에서 펼쳐 세트리스트를 보여준다(공통 곡은
 * 그 위 투어 공통 세트리스트에 한 번만, 공연일 행엔 그날의 선택곡만). 아직
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
        // PC는 목록(최대 1440px)에서 들어왔을 때 폭이 확 줄어 보이지 않게 한 단계 넓힌다.
        "pc:max-w-4xl",
      )}
    >
      {tour.poster_image_url && (
        // 목록 카드 그림과 같은 이름 — 목록에서 들어올 때 그 그림이 이 자리로 이어진다.
        <ViewTransition
          name={posterTransitionName(tour.slug ?? "")}
          share="morph"
          default="none"
        >
          {/* 화면 폭별로 줄인 포스터(srcset) — 원본보다 큰 후보는 원본 크기로 온다. */}
          <ThumbImage
            src={tour.poster_image_url}
            displayWidth={800}
            sizes={"(max-width: 49.99rem) 100vw, 800px"}
            loading="eager"
            alt={tour.title}
            className={cn(
              "max-h-[60vh] max-w-full rounded-lg object-contain",
              "tablet:max-h-[65vh]",
            )}
          />
        </ViewTransition>
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
        <h1
          className={cn(
            rocknrollOne.className,
            "text-xl text-white",
            "tablet:text-3xl",
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
        type="TOUR"
        visitOrdinal={visitOrdinal}
        cells={[
          {
            label: "Tour Period",
            value:
              tour.end_date && tour.end_date !== tour.start_date
                ? `${formatLiveDate(tour.start_date)} ~ ${formatLiveDate(tour.end_date)}`
                : formatLiveDate(tour.start_date),
            mono: true,
          },
          // 취소되지 않은 공연일이 있으면 총 공연 횟수(이틀 공연은 2회)
          ...(tour.dates.some((date) => !date.canceled)
            ? [
                {
                  label: "Total Shows",
                  // 취소된 공연일은 빼고 센다.
                  value: `${countTourShows(tour.dates.filter((date) => !date.canceled))}회`,
                  mono: true,
                },
              ]
            : []),
        ]}
        metadata={tour.metadata}
      />

      <TourCommonSetlist entries={tour.setlist} dates={tour.dates} />

      <LiveSchedule dates={tour.dates} />
    </div>
  );
}
