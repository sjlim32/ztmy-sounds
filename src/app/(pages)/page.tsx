import { cn } from "@/lib/utils";
import { visitEvent } from "@/data/event";
import { ARTIST } from "@/data/artist";
import { Header } from "@/features/home/components/Header";
import { NextVisit } from "@/features/home/components/NextVisit";
import { Countdown } from "@/features/home/components/Countdown";
import { MainNavLink } from "@/features/home/components/MainNavLink";
import { MicIcon } from "@/components/icons/MicIcon";
import { InfoIcon } from "@/components/icons/InfoIcon";

export default function Home() {
  return (
    <>
      <Header artist={ARTIST} />

      <main data-role="hero" className="flex flex-1 flex-col">
        {/* 모바일(640px): 세로 레이아웃 */}
        <div className={cn("relative flex flex-1 flex-col", "tablet:hidden")}>
          {/* 높이 680px 기준 - 이상 absolute, 이하 flex */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center px-4",
              "short:static short:flex-1 short:justify-end short:pb-6",
            )}
          >
            <div className="flex w-full flex-col gap-2">
              <MainNavLink
                href="/guide"
                eyebrow="Guide"
                label="응원 가이드"
                icon={MicIcon}
                accent="purple"
              />
              <MainNavLink
                href="/info"
                eyebrow="Info"
                label="공연 정보"
                icon={InfoIcon}
                accent="pink"
              />
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
          className={cn(
            "fixed top-1/2 left-10 hidden -translate-y-1/2 flex-col gap-6",
            "tablet:flex",
          )}
        >
          <NextVisit event={visitEvent} />

          <Countdown event={visitEvent} />
        </section>

        <nav
          id="main-right"
          data-role="site-nav"
          className={cn(
            "fixed top-1/2 right-20 hidden -translate-y-1/2 flex-col items-end gap-3",
            "tablet:flex",
          )}
        >
          <MainNavLink
            href="/guide"
            eyebrow="Guide"
            label="응원 가이드"
            icon={MicIcon}
            accent="purple"
          />
          <MainNavLink
            href="/info"
            eyebrow="Info"
            label="공연 정보"
            icon={InfoIcon}
            accent="pink"
          />
        </nav>
      </main>
    </>
  );
}
