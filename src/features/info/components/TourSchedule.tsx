import Link from "next/link";
import { SiteLink } from "@/components/SiteLink";
import { MapPinIcon } from "@/components/icons/MapPinIcon";
import {
  TOUR_MAP_URL,
  TOUR_FOOTNOTES,
} from "@/features/info/data/tour-schedule";
import { LiveTourScheduleTable } from "@/features/info/components/TourScheduleTable";

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

      {/* 전체 일정 목록 */}
      <div className="rounded-lg border border-white/10 bg-black/30 px-3 pb-1 backdrop-blur-xs">
        <LiveTourScheduleTable showTime />
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
