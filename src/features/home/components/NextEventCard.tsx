"use client";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { formatEventDate, accentBorder, type Event } from "@/data/event";
import type { Remaining } from "@/features/home/lib/countdown";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { Countdown } from "@/features/home/components/Countdown";

// event.accent(home: 내한 / away: 원정)에 따라 라벨 옆 그라데이션 바 색을 구분.
// 평소엔 짧게 유지해 어떤 이벤트인지 구분하는 색 표식 역할을 하다가, 버튼에
// 호버하면 MainNavLink의 시그니처 스캔라인처럼 옆으로 자라납니다.
const accentBarStyles = cva(
  "h-1 w-4 shrink-0 bg-linear-to-r transition-[width] duration-300 ease-out tablet:w-6 group-hover:w-8 tablet:group-hover:w-12",
  {
    variants: {
      accent: {
        home: "from-ztmy-magenta to-ztmy-pink",
        away: "from-ztmy-sky to-ztmy-sun",
      } satisfies Record<Event["accent"], string>,
    },
  },
);

// 티켓 스텁 상단 띠 색. 라벨 옆 액센트 바와 같은 색 쌍을 재사용합니다.
const ticketAccentGradient = {
  home: "from-ztmy-magenta to-ztmy-pink",
  away: "from-ztmy-sky to-ztmy-sun",
} satisfies Record<Event["accent"], string>;

interface NextEventCardProps {
  event: Event;
  remaining: Remaining | null;
  isEventDay: boolean;
  daysUntilEvent: number;
  isDone: boolean;
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
 */
export function NextEventCard({
  event,
  remaining,
  isEventDay,
  daysUntilEvent,
  isDone,
  isOpen,
  onToggle,
}: NextEventCardProps) {
  return (
    <div data-role="next-event-card" className={cn("w-full", "tablet:w-96")}>
      <div className={cn("space-y-0", "tablet:space-y-4")}>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "group cursor-pointer",
            isDone ? "tablet:flex hidden" : "flex",
            "h-10 w-full items-center justify-center gap-1.5 rounded-t-md bg-black/40 font-mono text-xs tracking-[0.3em] text-white/70 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-colors duration-300 hover:bg-black/55 hover:text-white",
            "tablet:h-auto tablet:bg-transparent tablet:justify-start tablet:text-sm tablet:hover:bg-transparent tablet:font-semibold",
          )}
        >
          <span className={accentBarStyles({ accent: event.accent })} />
          {event.label}
          <ChevronDownIcon
            className={cn(
              "h-2.5 w-2.5 transition-transform",
              !isOpen && "rotate-180",
            )}
          />
        </button>

        {/* 배경(뱃지)이 확장되면서 열리는 느낌을 grid-template-rows 0fr→1fr 트랜지션으로 구현. 모바일/태블릿 이상 공통으로 접고 펼 수 있습니다. */}
        {!isDone && (
          <div
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
              <div
                className={cn(
                  "space-y-1.5 pt-1.5",
                  "tablet:space-y-4 tablet:pt-0",
                )}
              >
                {/* 모바일 - 가로 레이아웃 */}
                <div className={cn("flex gap-3 px-2 pb-1", "tablet:hidden")}>
                  <a
                    href={event.tourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block shrink-0 overflow-hidden rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.tourImg}
                      alt={event.tourName}
                      loading="lazy"
                      className="h-full w-[30dvw] object-cover transition-opacity hover:opacity-80"
                    />
                    {/* 이미지 하단이 카드 배경으로 자연스럽게 이어지도록 스크림 처리 */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/70 to-transparent" />
                  </a>

                  <div className="flex min-w-0 flex-col justify-center gap-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                    <a
                      href={event.tourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <p
                        data-role="title"
                        className="hover:text-ztmy-pink truncate text-xs font-semibold text-white transition-colors"
                      >
                        {event.tourName}
                        <ExternalLinkIcon className="ml-1 inline h-2.5 w-2.5 opacity-70" />
                      </p>
                    </a>

                    <div>
                      <p className="font-mono text-[8px] tracking-[0.2em] text-white/40 uppercase">
                        Date
                      </p>
                      <p
                        data-role="date"
                        className="font-mono text-sm font-bold text-white"
                      >
                        {formatEventDate(event)}
                        <span className="ml-1.5 text-xs font-normal text-white/70">
                          {event.time}
                        </span>
                      </p>
                    </div>

                    <a
                      href={event.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-role="venue"
                      className="group"
                    >
                      <p className="font-mono text-[8px] tracking-[0.2em] text-white/40 uppercase">
                        Venue
                      </p>
                      <span className="group-hover:text-ztmy-pink inline-flex items-center gap-1 text-sm text-white transition-colors group-hover:underline">
                        {event.place}
                        <ExternalLinkIcon className="h-2.5 w-2.5" />
                      </span>
                    </a>
                  </div>
                </div>

                {/* 태블릿 이상 - 세로 레이아웃 */}
                <div className={cn("hidden", "tablet:block")}>
                  <a
                    href={event.tourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <p
                      data-role="title"
                      className="hover:text-ztmy-pink text-xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-colors"
                    >
                      {event.tourName}
                      <ExternalLinkIcon className="ml-1 inline h-3.5 w-3.5 opacity-70" />
                    </p>
                  </a>

                  <a
                    href={event.tourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative mt-4 block overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.tourImg}
                      alt={event.tourName}
                      loading="lazy"
                      className="w-full object-cover transition-opacity hover:opacity-80"
                    />
                    {/* 이미지 하단이 아래 텍스트 영역으로 자연스럽게 이어지도록 스크림 처리 */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/60 to-transparent" />
                  </a>

                  {/* 콘서트 티켓 스텁을 참고한 레이아웃 — DATE/VENUE 두 반쪽을
                  점선 절취선으로 나누고, 절취선과 상단 띠 둘 다 accent 색을
                  씁니다. */}
                  <div className="relative mt-3 flex overflow-hidden bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 h-0.5 bg-linear-to-r",
                        ticketAccentGradient[event.accent],
                      )}
                    />

                    <div className="flex-1 px-4 py-3">
                      <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
                        Date
                      </p>
                      <p
                        data-role="date"
                        className="mt-1 font-mono text-lg font-bold text-white"
                      >
                        {formatEventDate(event)}
                      </p>
                      <p className="font-mono text-xs text-white/50">
                        {event.time}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "w-0 border-l border-dashed",
                        accentBorder[event.accent],
                      )}
                    />

                    <a
                      href={event.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-role="venue"
                      className="group flex-1 px-4 py-3 transition-colors hover:bg-white/5"
                    >
                      <p className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
                        Venue
                      </p>
                      <p className="group-hover:text-ztmy-pink mt-1 inline-flex items-center gap-1 text-lg font-bold text-white transition-colors">
                        {event.place}
                        <ExternalLinkIcon className="h-3 w-3 opacity-70" />
                      </p>
                      {event.placeDesc && (
                        <p className="text-xs text-white/50">
                          {event.placeDesc}
                        </p>
                      )}
                    </a>
                  </div>
                </div>
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
        보여줍니다. */}
        {!isDone && (
          <div className={cn("tablet:mt-0 mt-1.5", !isOpen && "tablet:hidden")}>
            <Countdown
              remaining={remaining}
              isEventDay={isEventDay}
              daysUntilEvent={daysUntilEvent}
              isDone={isDone}
              accent={event.accent}
            />
          </div>
        )}
      </div>
    </div>
  );
}
