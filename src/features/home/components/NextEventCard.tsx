"use client";

import { memo, useId, type ReactNode } from "react";
import Link from "next/link";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { formatEventDate, type Event } from "@/data/event";
import type { TourPerformanceItem } from "@/data/tour-performances";
import type { Remaining } from "@/features/home/lib/countdown";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { Countdown } from "@/features/home/components/Countdown";

// 티켓 스텁 상단 띠 색(내한/원정).
// 티켓 절취선·항목 이름 색, 바탕에 옅게 비치는 색(내한/원정).
const accentPerforation = {
  home: "border-ztmy-magenta/45",
  away: "border-ztmy-sky/45",
} satisfies Record<Event["accent"], string>;
const accentLabel = {
  home: "text-ztmy-pink/80",
  away: "text-ztmy-sky/80",
} satisfies Record<Event["accent"], string>;
const accentTint = {
  home: "from-ztmy-magenta/15",
  away: "from-ztmy-sky/12",
} satisfies Record<Event["accent"], string>;

const ticketAccentGradient = {
  home: "from-ztmy-magenta to-ztmy-pink",
  away: "from-ztmy-sky to-ztmy-sun",
} satisfies Record<Event["accent"], string>;

// event.accent(home: 내한 / away: 원정)를 라벨 앞 작은 색 점으로 구분 — 막대
// 장식 대신 점 하나로 간결하게(docs/CONVENTIONS.md 디자인 방향).
const accentDotStyles = cva("h-2 w-2 shrink-0 rounded-full", {
  variants: {
    accent: {
      home: "bg-ztmy-magenta",
      away: "bg-ztmy-sky",
    } satisfies Record<Event["accent"], string>,
  },
});

/**
 * 포스터 클릭 시 이동 위치 — 내한/원정 둘 다 외부 투어 링크 대신 사이트
 * 자체 공연 정보 페이지(/info)로 보낸다.
 */
function PosterLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href="/info" className={className}>
      {children}
    </Link>
  );
}

interface NextEventCardProps {
  event: Event;
  remaining: Remaining | null;
  isEventDay: boolean;
  daysUntilEvent: number;
  isDone: boolean;
  activePerformance?: TourPerformanceItem;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * 홈 화면의 "다음 이벤트" 카드 — 내한(Next Visit)/원정(Next Stage) 등 이벤트
 * 종류에 관계없이 event 하나를 받아 공용으로 렌더링합니다.
 *
 * remaining 등을 event가 아니라 미리 계산된 값으로 직접 받습니다 — 여러
 * 이벤트를 동시에, 때로는 같은 이벤트를 모바일/태블릿 두 곳에 동시에
 * 렌더링할 수 있는데, 각자 useEventCountdown을 부르면 그만큼 1초 타이머가
 * 따로 돌게 되므로, 부모(page.tsx)에서 이벤트당 한 번만 계산해 내려받습니다.
 * 카운트다운(Countdown)도 이 안에서 함께 접고 펼쳐지도록 렌더링해서,
 * 이벤트마다 자기 자신의 타이머를 갖도록 합니다.
 *
 * isOpen/onToggle도 내부 state가 아니라 부모에게서 받습니다 — 태블릿 이상에서
 * 내한/원정 카드가 동시에 보일 때 한쪽을 열면 다른 쪽이 닫히도록(상호 배타)
 * 부모가 "어느 accent가 열려 있는지" 하나만 기억해야 하기 때문입니다.
 *
 * memo로 감쌉니다 — 내한/원정 두 이벤트가 각자 독립된 1초 타이머를 돌리는데,
 * 한쪽 타이머가 틱해서 page.tsx가 리렌더돼도 다른 쪽 이벤트의 remaining은
 * (그 틱에서 안 바뀌었으니) 참조가 그대로라 얕은 비교로 걸러집니다 — 안
 * 그러면 매초 두 카드가 다 다시 그려짐. onToggle은 반드시 page.tsx에서
 * useCallback으로 참조를 고정해서 내려줘야 이 memo가 실제로 효과가 있습니다.
 */
function NextEventCardComponent({
  event,
  remaining,
  isEventDay,
  daysUntilEvent,
  isDone,
  activePerformance,
  isOpen,
  onToggle,
}: NextEventCardProps) {
  const contentId = useId();

  return (
    <div
      data-role="next-event-card"
      className="tablet:max-w-80 pc:max-w-96 wide:max-w-104"
    >
      <div className={cn("flex flex-col gap-2", !isOpen && "gap-0")}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className={cn(
            "group cursor-pointer",
            isDone ? "tablet:flex hidden" : "flex",
            "h-10 w-full items-center justify-center gap-1.5 rounded-t-md bg-black/40 font-mono text-xs tracking-[0.3em] text-white/70 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-colors duration-300 hover:bg-black/55 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
            "tablet:h-auto tablet:bg-transparent tablet:justify-start tablet:text-sm tablet:hover:bg-transparent tablet:font-semibold",
          )}
        >
          <span className={accentDotStyles({ accent: event.accent })} />
          {event.label}
          <ChevronDownIcon
            className={cn(
              "h-2.5 w-2.5 transition-transform",
              !isOpen && "rotate-180",
            )}
          />
        </button>

        {/* 배경(뱃지)이 확장되면서 열리는 느낌을 grid-template-rows 0fr→1fr 트랜지션으로 구현. 모바일/태블릿 이상 공통으로 접고 펼 수 있습니다.
        투어 이미지/날짜/장소는 isDone이면(날짜가 지나면) 아예 렌더링하지
        않습니다 — 지난 공연의 예매/오시는 길 정보는 더 이상 의미가 없어서.
        대신 아래 Countdown이 "다음 내한/원정을 기다려주세요" 종료 상태를 보여주고,
        토글 버튼 자체는 PC에서 계속 보여서 그 Countdown을 여닫을 수 있습니다. */}
        {!isDone && (
          <div
            id={contentId}
            inert={!isOpen}
            className={cn(
              "grid rounded-b-md bg-black/40 transition-[grid-template-rows] duration-300 ease-out",
              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              "tablet:bg-transparent",
            )}
          >
            {/* overflow-hidden이 있어야 0fr일 때 내용이 실제로 안 보입니다(높이만
            0이고 콘텐츠는 자기 높이대로 그려지는데, clip이 없으면 그대로
            새어나와 "닫혀도 열린 것처럼" 보입니다). MoonPhase의 밤안개는 이
            박스 밖(아래 Countdown)에 따로 그려서 이 클리핑에 걸리지 않게 합니다. */}
            <div className="overflow-hidden">
              <div className={cn("pt-1.5", "tablet:pt-0")}>
                <BoardingTicket
                  event={event}
                  activePerformance={activePerformance}
                  className={cn("mx-2 mb-2", "tablet:mx-0 tablet:mb-0")}
                />
              </div>
            </div>
          </div>
        )}
        {/* Countdown(물풍선/달)은 접힘 애니메이션 박스 밖에서 단순 표시/숨김으로
        렌더링합니다. 위 overflow-hidden 안에 있으면 grid-rows 트랜지션 때문에
        MoonPhase의 밤안개(overflow-visible로 살짝 벗어나는 장식)가 잘리고,
        그렇다고 클리핑을 풀면 접힘 상태에서 콘텐츠가 새어나오는 문제와
        정면으로 부딪혀서(둘 다 만족 불가) 아예 분리했습니다.
        모바일에서는 카드 펼침 여부와 관계없이 항상 보여주고(가장 눈에 띄는
        요소라 접힌 상태에도 노출), 태블릿 이상에서는 기존처럼 열린 카드에서만
        보여줍니다. isDone이어도 렌더링합니다 — Countdown이 내부적으로
        "다음 내한/원정을 기다려주세요" + 빈 풍선/달 같은 종료 상태를 직접
        그려주므로, 여기서 숨기면 그 표시가 아예 안 나옵니다. */}
        <div className={cn("tablet:mt-0 mt-1.5", !isOpen && "tablet:hidden")}>
          <Countdown
            remaining={remaining}
            isEventDay={isEventDay}
            daysUntilEvent={daysUntilEvent}
            isDone={isDone}
            accent={event.accent}
          />
        </div>
      </div>
    </div>
  );
}

export const NextEventCard = memo(NextEventCardComponent);

/**
 * NEXT VISIT / NEXT STAGE의 보딩 티켓 — 맨 위에 공연명, 그 아래 줄에 포스터와
 * DATE ┆ VENUE(점선 절취선으로 나눔). 위쪽에 내한/원정 색 띠를 두고 모서리는
 * 각지게(콘서트 티켓 모양을 살리는 예외 — docs/CONVENTIONS.md). 모바일·태블릿
 * 이상 공용으로 크기만 다르다.
 */
function BoardingTicket({
  event,
  activePerformance,
  className,
}: {
  event: Event;
  activePerformance?: TourPerformanceItem;
  className?: string;
}) {
  const time = activePerformance
    ? `${activePerformance.datesLabel} ${activePerformance.time}`
    : event.time;
  const venue = activePerformance ? activePerformance.venue : event.place;
  const venueDetail = activePerformance
    ? `${activePerformance.pref} · 전국 23개 도시`
    : event.placeDesc;

  return (
    <div
      className={cn(
        // 위는 각지게(색 띠가 붙는 쪽), 아래만 둥글게.
        "relative flex flex-col gap-2.5 overflow-hidden rounded-b-lg border border-white/10 bg-black/45 bg-linear-to-br to-transparent p-3 shadow-[0_4px_16px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        accentTint[event.accent],
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 bg-linear-to-r",
          ticketAccentGradient[event.accent],
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <Link
          data-role="title"
          href="/info"
          className={cn(
            "hover:text-ztmy-pink text-sm leading-snug font-semibold break-keep text-white transition-colors",
            "pc:text-base",
          )}
        >
          {event.tourName}
        </Link>
        <span
          aria-hidden
          className={cn(
            "mt-0.5 shrink-0 font-mono text-xs tracking-[0.25em] uppercase",
            accentLabel[event.accent],
          )}
        >
          {event.tourType ?? "CONCERT"}
        </span>
      </div>

      {/* 제목과 본문 사이 가로 점선 — 티켓 상단 조각처럼 */}
      <div
        aria-hidden
        className="-mx-3 border-t border-dashed border-white/15"
      />

      <div className="flex gap-3">
        <PosterLink className="block shrink-0 self-start">
          {event.tourImg !== "" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.tourImg}
              alt={event.tourName}
              loading="lazy"
              className={cn(
                "aspect-3/4 w-20 object-cover shadow-[0_2px_10px_rgba(0,0,0,0.55)] ring-1 ring-white/15 transition-opacity hover:opacity-80",
                "pc:w-24",
                // 낮은 화면(700px 이하)에선 홈 왼쪽 열이 넘치지 않게 작게.
                "tablet:xlow:w-16 pc:xlow:w-20",
              )}
            />
          ) : (
            <div
              className={cn(
                "aspect-3/4 w-20 bg-white/5",
                "pc:w-24 tablet:xlow:w-16 pc:xlow:w-20",
              )}
            />
          )}
        </PosterLink>

        {/* DATE ┆ VENUE — 콘서트 티켓처럼 점선 절취선으로 나눈다 */}
        <dl className="flex min-w-0 flex-1 text-sm leading-snug">
          <div className="min-w-0 flex-1 pr-3">
            <dt
              className={cn(
                "font-mono text-xs tracking-[0.25em] uppercase",
                accentLabel[event.accent],
              )}
            >
              Date
            </dt>
            <dd data-role="date" className="mt-1 break-keep text-white">
              {formatEventDate(event)}
            </dd>
            <dd className="mt-0.5 font-mono text-xs text-white/55">{time}</dd>
          </div>
          <div
            aria-hidden
            className={cn(
              "w-0 border-l-2 border-dashed",
              accentPerforation[event.accent],
            )}
          />
          <div className="min-w-0 flex-1 pl-3">
            <dt
              className={cn(
                "font-mono text-xs tracking-[0.25em] uppercase",
                accentLabel[event.accent],
              )}
            >
              Venue
            </dt>
            <dd className="mt-1 break-keep text-white">{venue}</dd>
            {venueDetail && (
              <dd className="mt-0.5 text-xs break-keep text-white/55">
                {venueDetail}
              </dd>
            )}
          </div>
        </dl>
      </div>
    </div>
  );
}
