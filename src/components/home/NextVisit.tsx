"use client";

import { useState } from "react";
import clsx from "clsx";
import type { VisitEvent } from "@/data/event";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import {
  DONE_AFTER_HOURS,
  useEventCountdown,
} from "@/lib/guide/event-countdown";

export function NextVisit({ event }: { event: VisitEvent }) {
  const { remaining, hoursSincePast } = useEventCountdown(event);
  const isDone = !!remaining?.isPast && hoursSincePast >= DONE_AFTER_HOURS;
  // 모바일 기본값은 접힌 상태(뱃지만) — 태블릿 이상에서는 이 값과 무관하게
  // 항상 펼쳐진 상태로 강제 표시(className의 tablet: 오버라이드).
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      data-role="next-visit"
      className="tablet:w-80 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md"
    >
      <div className="tablet:space-y-4 tablet:p-5 p-3">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="border-ztmy-pink/40 bg-ztmy-purple/20 tablet:pointer-events-none tablet:w-auto tablet:border-2 tablet:px-3 tablet:py-1 tablet:text-[10px] tablet:tracking-[0.3em] flex w-full items-center justify-center gap-1.5 rounded-full border py-1 text-[8px] tracking-[0.2em] text-white/80"
        >
          NEXT VISIT
          <ChevronDownIcon
            className={clsx(
              "tablet:hidden h-2.5 w-2.5 transition-transform",
              !isOpen && "rotate-180",
            )}
          />
        </button>

        {/* 배경(뱃지)이 확장되면서 열리는 느낌을 grid-template-rows
            0fr→1fr 트랜지션으로 구현 (height:auto는 애니메이션이 안 돼서
            흔히 쓰는 방식). 태블릿 이상은 항상 펼침. */}
        <div
          className={clsx(
            "tablet:grid-rows-[1fr] grid transition-[grid-template-rows] duration-300 ease-out",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="tablet:space-y-4 tablet:pt-0 space-y-1.5 pt-1.5">
              {isDone ? (
                <div className="tablet:gap-3 tablet:px-6 tablet:py-10 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-4 text-center">
                  <CalendarIcon className="tablet:h-8 tablet:w-8 h-5 w-5 text-white/30" />
                  <p className="tablet:text-sm text-xs text-white/60">
                    다음 내한을 기다려주세요 !
                  </p>
                </div>
              ) : (
                <>
                  {/* 모바일: 이미지 + 타이틀/시간/장소를 좌우로 배치 */}
                  <div className="tablet:hidden flex gap-3">
                    <a
                      href={event.tourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block shrink-0"
                    >
                      <img
                        src={event.tourImg}
                        alt={event.tourName}
                        loading="lazy"
                        className="h-16 w-16 rounded-lg object-cover transition-opacity hover:opacity-80"
                      />
                    </a>

                    <div className="flex min-w-0 flex-col justify-center gap-1">
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

                      <p
                        data-role="date"
                        className="font-mono text-sm font-bold text-white"
                      >
                        {event.date}
                        <span className="ml-1.5 text-[10px] font-normal text-white/50">
                          {event.time}
                        </span>
                      </p>

                      <a
                        href={event.placeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-role="venue"
                        className="hover:text-ztmy-pink inline-flex items-center gap-1 text-[10px] text-white/70 transition-colors hover:underline"
                      >
                        {event.place}
                        <ExternalLinkIcon className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* 태블릿 이상: 기존처럼 세로로 쌓는 구조 */}
                  <div className="tablet:block hidden">
                    <a
                      href={event.tourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <p
                        data-role="title"
                        className="hover:text-ztmy-pink text-center text-xl font-semibold text-white transition-colors"
                      >
                        {event.tourName}
                        <ExternalLinkIcon className="ml-1 inline h-3.5 w-3.5 opacity-70" />
                      </p>
                    </a>

                    <a
                      href={event.tourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block"
                    >
                      <img
                        src={event.tourImg}
                        alt={event.tourName}
                        loading="lazy"
                        className="w-full rounded-xl object-cover transition-opacity hover:opacity-80"
                      />
                    </a>

                    <div className="mt-4 space-y-1 border-t border-white/10 pt-3">
                      <p
                        data-role="date"
                        className="font-mono text-2xl font-bold text-white"
                      >
                        {event.date}
                        <span className="ml-2 text-base font-normal text-white/50">
                          {event.time}
                        </span>
                      </p>

                      <a
                        href={event.placeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-role="venue"
                        className="hover:text-ztmy-pink inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:underline"
                      >
                        {event.place}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
