import Link from "next/link";
import { visitEvent } from "@/data/event";
import { ARTIST } from "@/data/artist";
import { Header } from "@/components/home/Header";
import { NextVisit } from "@/components/home/NextVisit";
import { Countdown } from "@/components/home/Countdown";
import { MicIcon } from "@/components/icons/MicIcon";
import { InfoIcon } from "@/components/icons/InfoIcon";

export default function Home() {
  return (
    <>
      <Header artist={ARTIST} />

      <main data-role="hero" className="flex flex-1 flex-col">
        {/* 모바일(540px 미만) 전용: 고정 좌우 배치 대신 세로로 쌓는 구조.
            iPhone SE(375x667) 기준 스크롤 없이 다 보이도록 여백/글자를
            최대한 압축. 버튼은 화면 정중앙(absolute), NextVisit/Countdown은
            화면 하단(mt-auto)에 독립적으로 배치. */}
        <div className="tablet:hidden relative flex flex-1 flex-col">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="flex w-full flex-col gap-1.5">
              <Link
                href="/guide"
                className="group hover:border-ztmy-pink/40 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm transition-colors"
              >
                <MicIcon className="group-hover:text-ztmy-pink h-5 w-5 text-white/60 transition-colors" />
                <span className="group-hover:text-ztmy-pink text-sm font-medium text-white transition-colors">
                  응원 가이드
                </span>
              </Link>

              <Link
                href="/info"
                className="group hover:border-ztmy-pink/40 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm transition-colors"
              >
                <InfoIcon className="group-hover:text-ztmy-pink h-5 w-5 text-white/60 transition-colors" />
                <span className="group-hover:text-ztmy-pink text-sm font-medium text-white transition-colors">
                  공연 정보
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-auto flex flex-col items-center gap-2.5 px-4 py-3">
            <NextVisit event={visitEvent} />

            <Countdown event={visitEvent} />
          </div>
        </div>
        {/* MOBILE END */}

        <section
          id="main-left"
          data-role="visit-info"
          className="tablet:flex fixed top-1/2 left-10 hidden -translate-y-1/2 flex-col gap-6"
        >
          <NextVisit event={visitEvent} />

          <Countdown event={visitEvent} />
        </section>

        <nav
          id="main-right"
          data-role="site-nav"
          className="tablet:flex fixed top-1/2 right-10 hidden -translate-y-1/2 flex-col items-end gap-3"
        >
          <Link
            href="/guide"
            className="group hover:border-ztmy-pink/40 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm transition-colors"
          >
            <MicIcon className="group-hover:text-ztmy-pink h-4 w-4 text-white/60 transition-colors" />
            <span className="group-hover:text-ztmy-pink font-medium text-white transition-colors">
              응원 가이드
            </span>
          </Link>

          <Link
            href="/info"
            className="group hover:border-ztmy-pink/40 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm transition-colors"
          >
            <InfoIcon className="group-hover:text-ztmy-pink h-4 w-4 text-white/60 transition-colors" />
            <span className="group-hover:text-ztmy-pink font-medium text-white transition-colors">
              공연 정보
            </span>
          </Link>
        </nav>
      </main>
    </>
  );
}
