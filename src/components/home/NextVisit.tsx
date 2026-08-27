"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { VisitEvent } from "@/data/event";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import {
  DONE_AFTER_HOURS,
  useEventCountdown,
} from "@/features/home/lib/event-countdown";

export function NextVisit({ event }: { event: VisitEvent }) {
  const { remaining, hoursSincePast } = useEventCountdown(event);
  const [isOpen, setIsOpen] = useState(false); // 모바일에서만 접힘 / 펼침 컨트롤용

  const isDone = !!remaining?.isPast && hoursSincePast >= DONE_AFTER_HOURS;

  return (
    <div data-role="next-visit" className={cn("w-full", "tablet:w-80")}>
      <div className={cn("space-y-0", "tablet:space-y-4")}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            isDone ? "tablet:flex hidden" : "flex",
            "h-10 w-full items-center justify-center gap-1.5 rounded-t-md bg-black/40 font-mono text-[9px] tracking-[0.3em] text-white/70 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]",
            "tablet:h-auto tablet:bg-transparent tablet:pointer-events-none tablet:justify-start tablet:text-xs",
          )}
        >
          <span
            className={cn(
              "from-ztmy-magenta to-ztmy-pink h-1 w-4 shrink-0 bg-linear-to-r",
              "tablet:w-6",
            )}
          />
          Next Visit
          <ChevronDownIcon
            className={cn(
              "h-2.5 w-2.5 transition-transform",
              !isOpen && "rotate-180",
              "tablet:hidden",
            )}
          />
        </button>

        {/* 배경(뱃지)이 확장되면서 열리는 느낌을 grid-template-rows 0fr→1fr 트랜지션으로 구현. 태블릿 이상은 항상 펼침. */}
        {!isDone && (
          <div
            className={cn(
              "grid rounded-b-md bg-black/40 transition-[grid-template-rows] duration-300 ease-out",
              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              "tablet:grid-rows-[1fr] tablet:bg-transparent",
            )}
          >
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
                    className="block shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.tourImg}
                      alt={event.tourName}
                      loading="lazy"
                      className="h-16 w-16 rounded-lg object-cover shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-opacity hover:opacity-80"
                    />
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

                    <p
                      data-role="date"
                      className="font-mono text-sm font-bold text-white"
                    >
                      {event.date}
                      <span className="ml-1.5 text-xs font-normal text-white/70">
                        {event.time}
                      </span>
                    </p>

                    <a
                      href={event.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-role="venue"
                      className="hover:text-ztmy-pink inline-flex items-center gap-1 text-sm text-white transition-colors hover:underline"
                    >
                      {event.place}
                      <ExternalLinkIcon className="h-2.5 w-2.5" />
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
                      className="hover:text-ztmy-pink text-center text-xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-colors"
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.tourImg}
                      alt={event.tourName}
                      loading="lazy"
                      className="w-full rounded-xl object-cover shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-opacity hover:opacity-80"
                    />
                  </a>

                  <div className="mt-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                    <span className="relative mb-2 block h-px w-full overflow-hidden bg-white/15">
                      <span className="from-ztmy-magenta to-ztmy-purple absolute inset-y-0 left-0 w-full bg-linear-to-r" />
                    </span>

                    <p
                      data-role="date"
                      className="font-mono text-2xl font-normal text-white"
                    >
                      {event.date}
                      <span className="ml-2 text-xl font-normal text-white/80">
                        {event.time}
                      </span>
                    </p>

                    <a
                      href={event.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-role="venue"
                      className="hover:text-ztmy-pink inline-flex items-center gap-1 text-xl text-white transition-colors hover:underline"
                    >
                      {event.place}
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
