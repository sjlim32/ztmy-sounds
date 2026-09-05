"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { visitEvent, originEvent, type Event } from "@/data/event";
import { ARTIST } from "@/data/artist";
import { Header } from "@/features/home/components/Header";
import { NextEventCard } from "@/features/home/components/NextEventCard";
import { MainNavLink } from "@/features/home/components/MainNavLink";
import { MicIcon } from "@/components/icons/MicIcon";
import { InfoIcon } from "@/components/icons/InfoIcon";
import { FlagIcon } from "@/components/icons/FlagIcon";
import { useEventCountdown } from "@/features/home/lib/event-countdown";

export default function Home() {
  // 모바일/데스크톱용으로 NextEventCard가 아래에서 여러 번 렌더링되는데(같은
  // 이벤트가 모바일 영역과 태블릿 이상 영역에 동시에 마운트될 수 있음), 타이머가
  // 이벤트마다 여러 개 따로 돌지 않도록 이벤트당 한 번만 계산해서 내려줍니다.
  // NextEventCard가 각자 자기 이벤트의 Countdown도 안에서 함께 렌더링합니다.
  const visit = useEventCountdown(visitEvent);
  const origin = useEventCountdown(originEvent);

  // 모바일은 카드 1개만 보여줄 수 있어서, 내한을 항상 우선 노출하고 내한이
  // 종료된 뒤에만 원정을 기본으로 보여줍니다. 태블릿 이상은 둘 다 노출합니다.
  const isVisitAvailable = !visit.isDone;
  const mobileEvent = isVisitAvailable ? visitEvent : originEvent;
  const mobile = isVisitAvailable ? visit : origin;

  // 모바일은 카드가 1개뿐이라 독립적으로 접고 펼 수 있습니다(기본은 접힘).
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 태블릿 이상은 내한/원정 카드가 동시에 보이는데, 이 중 하나는 항상
  // 펼쳐져 있어야 해서 "몇 번째가 열려 있는지"만 값으로 갖습니다(null 없음).
  // 이미 열려 있는 쪽을 다시 클릭하면 같은 값으로 다시 set되어 사실상
  // no-op이 되고, 닫혀 있던 쪽을 클릭하면 그쪽으로 전환됩니다.
  const [tabletOpenAccent, setTabletOpenAccent] = useState<Event["accent"]>(
    mobileEvent.accent,
  );
  // 열려 있던 쪽이 종료(isDone)되면 펼침 콘텐츠 자체가 사라져서 "항상 하나는
  // 펼쳐짐" 보장이 깨지므로, 렌더링 중에 나머지 한쪽으로 대체해서 씁니다.
  // (state를 직접 고치는 대신 파생시켜서, effect 안에서 setState하는 걸 피합니다.)
  const effectiveTabletOpenAccent =
    tabletOpenAccent === visitEvent.accent && visit.isDone
      ? originEvent.accent
      : tabletOpenAccent === originEvent.accent && origin.isDone
        ? visitEvent.accent
        : tabletOpenAccent;

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
                href="/slam"
                eyebrow="Slam"
                label="슬램 가이드"
                icon={FlagIcon}
                accent="magenta"
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
            <NextEventCard
              event={mobileEvent}
              remaining={mobile.remaining}
              isEventDay={mobile.isEventDay}
              daysUntilEvent={mobile.daysUntilEvent}
              isDone={mobile.isDone}
              isOpen={isMobileOpen}
              onToggle={() => setIsMobileOpen((open) => !open)}
            />
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
          <NextEventCard
            event={visitEvent}
            remaining={visit.remaining}
            isEventDay={visit.isEventDay}
            daysUntilEvent={visit.daysUntilEvent}
            isDone={visit.isDone}
            isOpen={effectiveTabletOpenAccent === visitEvent.accent}
            onToggle={() => setTabletOpenAccent(visitEvent.accent)}
          />

          {/* 태블릿 이상에서는 내한/원정 둘 다 각자의 타이머와 함께 노출.
          effectiveTabletOpenAccent가 null을 허용하지 않는 값이라 둘 중
          하나는 항상 펼쳐져 있습니다. */}
          <NextEventCard
            event={originEvent}
            remaining={origin.remaining}
            isEventDay={origin.isEventDay}
            daysUntilEvent={origin.daysUntilEvent}
            isDone={origin.isDone}
            isOpen={effectiveTabletOpenAccent === originEvent.accent}
            onToggle={() => setTabletOpenAccent(originEvent.accent)}
          />
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
            href="/slam"
            eyebrow="Slam"
            label="슬램 가이드"
            icon={FlagIcon}
            accent="magenta"
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
