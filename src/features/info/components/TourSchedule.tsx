import { SiteLink } from "@/components/SiteLink";
import { MapPinIcon } from "@/components/icons/MapPinIcon";
import {
  TOUR_SCHEDULE,
  TOUR_MAP_URL,
  TOUR_FOOTNOTES,
} from "@/features/info/data/tour-schedule";

export function TourSchedule() {
  return (
    <div className="flex flex-col gap-5">
      {/* 구글 지도 배너 */}
      <div className="from-ztmy-sky/15 to-ztmy-magenta/15 relative overflow-hidden rounded-xl border border-white/15 bg-linear-to-r via-black/40 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="tablet:flex-row tablet:items-center tablet:justify-between flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-ztmy-sky/20 text-ztmy-sky flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <MapPinIcon className="h-5 w-5" />
            </span>
            <div>
              <h4 className="tablet:text-base text-sm font-bold text-white">
                전체 공연장 위치 (Google Maps)
              </h4>
              <p className="text-xs text-white/60">
                전국 23개 도시 공연장을 지도에서 한눈에 확인하세요
              </p>
            </div>
          </div>

          <SiteLink
            href={TOUR_MAP_URL}
            className="hover:border-ztmy-sky/60 tablet:self-auto tablet:text-sm self-start rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/20"
          >
            구글 지도에서 보기
          </SiteLink>
        </div>
      </div>

      {/* 월별 일정 목록 */}
      <div className="flex flex-col gap-6">
        {TOUR_SCHEDULE.map((group) => (
          <section key={group.month} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-1.5">
              <h3 className="tablet:text-lg flex items-center gap-2 text-base font-bold text-white">
                <span className="bg-ztmy-pink h-2 w-2 rounded-full" />
                {group.label}
              </h3>
              <span className="font-mono text-xs text-white/50">
                {group.shows.length}회차
              </span>
            </div>

            <div className="tablet:grid-cols-2 grid grid-cols-1 gap-2">
              {group.shows.map((show) => (
                <div
                  key={`${show.dates}-${show.venue}`}
                  className="group flex flex-col justify-between gap-2 rounded-lg border border-white/10 bg-black/35 p-3 backdrop-blur-xs transition-colors hover:border-white/25 hover:bg-black/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="border-ztmy-pink/30 bg-ztmy-pink/15 text-ztmy-pink shrink-0 rounded-md border px-2.5 py-0.5 font-mono text-xs font-bold">
                      {show.dates}
                    </span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/60">
                      {show.pref}
                    </span>
                  </div>

                  <div>
                    <p className="tablet:text-base text-sm font-semibold break-keep text-white">
                      {show.venue}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-1.5 text-xs text-white/65">
                    <span className="font-mono">
                      <span className="mr-1 text-white/40">시작</span>
                      {show.time}
                    </span>
                    <span className="font-mono font-medium text-white/80">
                      {show.capacity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 각주 안내 */}
      <div className="space-y-1 rounded-lg bg-black/20 p-3 text-xs text-white/55">
        {TOUR_FOOTNOTES.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </div>
  );
}
