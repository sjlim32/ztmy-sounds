import Link from "next/link";
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
        <div className="tablet:flex-row tablet:items-center tablet:justify-between flex flex-col gap-3">
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

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="#tour-map"
              className="hover:border-ztmy-pink/60 tablet:text-sm rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:text-white"
            >
              전체 지도 보기
            </Link>
            <SiteLink
              href={TOUR_MAP_URL}
              className="hover:border-ztmy-sky/60 tablet:text-sm rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/20"
            >
              구글 지도에서 보기
            </SiteLink>
          </div>
        </div>
      </div>

      {/* 투어 규모 요약 통계 (일정 번역본 데이터 반영) */}
      <div className="tablet:grid-cols-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 backdrop-blur-xs">
          <p className="text-sm font-medium text-white/55">총 공연 횟수</p>
          <p className="font-mono text-lg font-bold text-white">36회</p>
          <p className="text-xs text-white/40">전국 23개 도시 홀 투어</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 backdrop-blur-xs">
          <p className="text-sm font-medium text-white/55">총 수용 인원</p>
          <p className="text-ztmy-pink font-mono text-lg font-bold">88,236석</p>
          <p className="text-xs text-white/40">36회 합산 기준</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 backdrop-blur-xs">
          <p className="text-sm font-medium text-white/55">단순 정원 합계</p>
          <p className="font-mono text-lg font-bold text-white">53,751석</p>
          <p className="text-xs text-white/40">23개 홀 정원</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 backdrop-blur-xs">
          <p className="text-sm font-medium text-white/55">평균 정원</p>
          <p className="font-mono text-lg font-bold text-white">2,337석</p>
          <p className="text-xs text-white/40">홀당 평균</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 backdrop-blur-xs">
          <p className="text-sm font-medium text-white/55">최대 규모</p>
          <p className="tablet:text-base text-ztmy-sky text-sm font-bold">
            도쿄 가든 시어터
          </p>
          <p className="font-mono text-xs text-white/40">
            6,992석 (최대 8,000명)
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 backdrop-blur-xs">
          <p className="text-sm font-medium text-white/55">최소 규모</p>
          <p className="tablet:text-base text-sm font-bold text-white">
            나라 100년 회관
          </p>
          <p className="font-mono text-xs text-white/40">1,476석 (대홀)</p>
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
                    <span className="rounded bg-white/5 px-2 py-0.5 text-sm font-medium text-white/60">
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
