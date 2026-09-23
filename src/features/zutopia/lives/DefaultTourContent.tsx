import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatLiveDate } from "./data";
import { LiveTypeBadge } from "./LiveTypeBadge";
import type { TourDetail } from "./types";

/**
 * 투어(단독 공연) 상세 페이지 — DefaultLiveContent와 같은 시각 언어(포스터
 * + 뱃지, 로고 서체 제목, 티켓 스텁)를 쓰되, 투어 자체엔 장소/세트리스트가
 * 없고 대신 그 투어에 묶인 개별 공연일(dates)이 있을 수 있다. 아직 공연일
 * 데이터가 없는 투어(dates가 빈 배열)는 안내 문구만 보여준다 — DB에는
 * 투어만 먼저 등록하고 개별 공연일은 나중에 채우는 흐름이라 항상 있을
 * 수 있는 상태다.
 */
export function DefaultTourContent({ tour }: { tour: TourDetail }) {
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

      <div className="flex flex-col items-center text-center">
        <LiveTypeBadge type="TOUR" />
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

      <div className="relative w-full overflow-hidden bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="from-ztmy-magenta to-ztmy-purple absolute inset-x-0 top-0 h-0.5 bg-linear-to-r" />
        <div className={cn("p-4", "tablet:p-6")}>
          <p
            className={cn(
              "font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase",
              "tablet:text-xs",
            )}
          >
            Tour Period
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-base text-white",
              "tablet:text-lg",
            )}
          >
            {formatLiveDate(tour.start_date)}
            {tour.end_date &&
              tour.end_date !== tour.start_date &&
              ` ~ ${formatLiveDate(tour.end_date)}`}
          </p>
        </div>
      </div>

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
          <ul className="flex flex-col divide-y divide-white/5">
            {tour.dates.map((date, i) => (
              <li key={date.slug}>
                <Link
                  href={`/zutopia/lives/${date.slug}`}
                  className={cn(
                    "hover:text-ztmy-pink flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/80 transition-colors",
                    "tablet:text-base",
                  )}
                >
                  <span className="w-6 shrink-0 font-mono text-xs text-white/30 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {date.date} · {date.venue}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("pt-3 text-sm text-white/50", "tablet:text-base")}>
            세부 공연 일정이 곧 업데이트됩니다.
          </p>
        )}
      </section>
    </div>
  );
}
