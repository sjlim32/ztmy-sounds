"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";
import {
  addDays,
  timeTicks,
  viewLabel,
  type ZoomLevel,
} from "@/features/zutopia/timeline/buckets";
import {
  dateToOffset,
  latestDate,
  type TimelineEvent,
} from "@/features/zutopia/timeline/events";
import { wheelIntent } from "@/features/zutopia/timeline/interaction";
import { useDragScroll } from "@/features/zutopia/timeline/useDragScroll";
import {
  daysAt,
  DEFAULT_ZOOM_LEVEL,
  MONTH_PX_PER_DAY,
  scrollLeftFor,
  stepZoom,
  WEEK_PX_PER_DAY,
  yearPxPerDay,
  ZOOM_LABEL,
  ZOOM_ORDER,
} from "@/features/zutopia/timeline/zoom";
import { MonthView } from "./MonthView";
import { TimelineScrollbar } from "./TimelineScrollbar";
import { STEM_GAP, WEEK_CARD_WIDTH, WeekView, weekLayout } from "./WeekView";
import { YearView } from "./YearView";

const PAD = 24;
/** 위쪽 시간 눈금 자리(연도 + 달) — 카드는 이 아래에서 시작한다. */
const TIME_BAND = 72;
/** 아래 스크롤 막대(36) + 틈(10). */
const SCROLLBAR_SPACE = 46;
const MIN_HEIGHT = 360;
/** 처음 열 때 가장 늦은 일정과 오른쪽 끝 사이 여백(카드 하나 + 조금). */
const INITIAL_RIGHT_MARGIN = 280;
/** Ctrl/⌘ + 휠(트랙패드 핀치)을 이만큼 굴리면 한 단계. */
const WHEEL_STEP = 60;

/** 바깥 스크롤 상자(main)가 휠 방향으로 더 움직일 수 있는지. */
function pageCanMove(el: HTMLElement, deltaY: number): boolean {
  const main = el.closest("main");
  if (!main) return false;
  return deltaY > 0
    ? main.scrollTop < main.scrollHeight - main.clientHeight - 1
    : main.scrollTop > 0;
}

/**
 * 가로 축(태블릿 이상) — 연·월·주 세 단계로 확대·축소한다.
 * 연: 해마다 요약 카드 / 월: 달마다 묶음 카드 / 주: 일정 하나하나 카드.
 * 화면에 남은 높이를 꽉 채우고(페이지 세로 스크롤 없음), 좌우 이동은 배경
 * 끌기·휠·아래 스크롤 막대로. Ctrl/⌘ + 휠(핀치)이나 위 줄 단계 버튼으로
 * 단계를 바꾸고, 요약·묶음 카드를 누르면 그 시기로 한 단계 확대한다 — 어느
 * 쪽이든 기준점 아래 날짜는 제자리. 처음엔 월 단계, 가장 최근 쪽.
 */
export function HorizontalTimeline({
  events,
  range,
  attendedCounts,
}: {
  events: TimelineEvent[];
  range: { start: string; end: string; years: string[] };
  attendedCounts: ReadonlyMap<string, number>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollerId = useId();
  const [level, setLevel] = useState<ZoomLevel>(DEFAULT_ZOOM_LEVEL);
  const [size, setSize] = useState({ width: 0, height: MIN_HEIGHT });
  // 단계를 바꾼 뒤 맞출 자리 — 이 날짜(시작일부터 며칠째)가 화면 x에 오게.
  const pendingRef = useRef<{ days: number; screenX: number } | null>(null);
  const startedRef = useRef(false);

  const totalDays = dateToOffset(range.end, range.start, 1);
  const pxPerDay =
    level === "year"
      ? yearPxPerDay(Math.max(1, size.width - PAD * 2), totalDays)
      : level === "month"
        ? MONTH_PX_PER_DAY
        : WEEK_PX_PER_DAY;
  const x = (date: string) => PAD + dateToOffset(date, range.start, pxPerDay);
  const contentWidth =
    x(range.end) + (level === "week" ? WEEK_CARD_WIDTH : PAD);

  // 지금 보고 있는 시기("2026년 3월") — 스크롤·단계·크기가 바뀔 때마다 다시 센다.
  const [viewText, setViewText] = useState("");
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame = 0;
    const clamp = (days: number) =>
      addDays(
        range.start,
        Math.round(Math.min(totalDays - 1, Math.max(0, days))),
      );
    const update = () => {
      frame = 0;
      const at = (screenX: number) =>
        clamp(daysAt(el.scrollLeft, screenX, pxPerDay, PAD));
      setViewText(
        viewLabel(level, at(el.clientWidth / 2), at(0), at(el.clientWidth)),
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [level, pxPerDay, range.start, totalDays, size.width]);

  const week = useMemo(
    () => (level === "week" ? weekLayout(events, WEEK_PX_PER_DAY) : null),
    [events, level],
  );

  useDragScroll(scrollRef);

  // 화면에 남은 높이 채우기 — 바깥 스크롤 상자(main)의 보이는 높이에서 이 상자
  // 위쪽 내용, 페이지 아래 여백, 푸터 높이를 뺀다(늘어나는 빈칸은 세지 않는다).
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const scroller = scrollRef.current;
    const main = wrapper?.closest("main");
    // 페이지 본문·푸터는 PageScrollBody가 단 표시로 찾는다(구조에 기대지 않게).
    const inner = wrapper?.closest<HTMLElement>("[data-page-body]");
    const footer = main?.querySelector<HTMLElement>("[data-page-footer]");
    if (!wrapper || !scroller || !main || !inner) return;
    const measure = () => {
      // 스크롤 상자 위쪽(위 도구 줄 아래)부터 잰다.
      const top =
        scroller.getBoundingClientRect().top -
        main.getBoundingClientRect().top +
        main.scrollTop;
      const padBottom = parseFloat(getComputedStyle(inner).paddingBottom) || 0;
      const footerHeight = footer?.getBoundingClientRect().height ?? 0;
      const available =
        main.clientHeight - top - padBottom - footerHeight - SCROLLBAR_SPACE;
      setSize({
        width: scroller.clientWidth,
        height: Math.max(MIN_HEIGHT, Math.floor(available)),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    observer.observe(wrapper);
    // 위쪽 내용(범례 줄 등) 높이가 바뀌어 상자가 밀려나도 다시 잰다.
    observer.observe(inner);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // 처음(크기를 잰 뒤) 한 번 — 가장 늦은 일정(예정 포함)이 오른쪽 끝 조금 안에
  // 오게(축 끝의 빈 달에서 시작하지 않게).
  const latest = useMemo(() => latestDate(events), [events]);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || startedRef.current || size.width === 0) return;
    startedRef.current = true;
    el.scrollLeft = latest
      ? scrollLeftFor(
          dateToOffset(latest, range.start, 1),
          el.clientWidth - INITIAL_RIGHT_MARGIN,
          pxPerDay,
          PAD,
        )
      : el.scrollWidth;
    // 처음 한 번만 — 단계·폭이 바뀐 뒤엔 사용자가 보던 자리를 지킨다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width]);

  // 단계를 바꾼 뒤 기준 날짜를 제자리로
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const pending = pendingRef.current;
    if (!el || !pending) return;
    pendingRef.current = null;
    el.scrollLeft = scrollLeftFor(pending.days, pending.screenX, pxPerDay, PAD);
  }, [pxPerDay]);

  const changeLevel = (next: ZoomLevel, days: number, screenX: number) => {
    if (next === level) {
      pendingRef.current = null;
      return;
    }
    pendingRef.current = { days, screenX };
    setLevel(next);
  };
  const changeLevelAtCenter = (next: ZoomLevel) => {
    const el = scrollRef.current;
    if (!el) return;
    const screenX = el.clientWidth / 2;
    changeLevel(next, daysAt(el.scrollLeft, screenX, pxPerDay, PAD), screenX);
  };
  const openAt = (midDate: string) => {
    const el = scrollRef.current;
    if (!el) return;
    changeLevel(
      stepZoom(level, 1),
      dateToOffset(midDate, range.start, 1),
      el.clientWidth / 2,
    );
  };

  // 휠: Ctrl/⌘(트랙패드 핀치)면 단계 바꾸기, 세로로 넘친 내용이 없으면 세로
  // 휠을 좌우 이동으로(넘쳤으면 세로 스크롤 그대로 — wheelIntent).
  // 브라우저 전체 확대·세로 스크롤을 막아야 해서 passive가 아닌 리스너로 단다.
  const wheelRef = useRef({ level, pxPerDay, cramped: false, accumulated: 0 });
  // 렌더 직후(같은 프레임) 맞춘다 — 늦으면 바뀐 단계를 모르고 같은 단계로 "바꾸려다"
  // 기준점만 남는다.
  useLayoutEffect(() => {
    wheelRef.current.level = level;
    wheelRef.current.pxPerDay = pxPerDay;
    wheelRef.current.cramped = size.height <= MIN_HEIGHT;
  }, [level, pxPerDay, size.height]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const state = wheelRef.current;
      const max = el.scrollWidth - el.clientWidth;
      const intent = wheelIntent(event, {
        // 상자 안이 세로로 넘쳤거나, 화면이 낮아 최소 높이로 줄인 경우(페이지가
        // 세로로 움직여야 한다)
        canScrollY:
          el.scrollHeight > el.clientHeight + 1 ||
          (state.cramped && pageCanMove(el, event.deltaY)),
        atEdge:
          (event.deltaY < 0 && el.scrollLeft <= 0) ||
          (event.deltaY > 0 && el.scrollLeft >= max - 1),
      });
      if (intent === "native") return;
      event.preventDefault();
      if (intent === "horizontal") {
        el.scrollLeft += event.deltaY;
        return;
      }
      state.accumulated += event.deltaY;
      if (Math.abs(state.accumulated) < WHEEL_STEP) return;
      const direction = state.accumulated < 0 ? 1 : -1;
      state.accumulated = 0;
      const next = stepZoom(state.level, direction);
      if (next === state.level) {
        pendingRef.current = null;
        return;
      }
      const screenX = event.clientX - el.getBoundingClientRect().left;
      pendingRef.current = {
        days: daysAt(el.scrollLeft, screenX, state.pxPerDay, PAD),
        screenX,
      };
      setLevel(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const height = size.height;
  // 주 단계는 줄 수만큼 높이가 필요하다 — 남은 높이 안에서 축을 가운데 쪽으로.
  const weekContent = week
    ? week.liveBand + 2 * STEM_GAP + 4 + week.releaseBand
    : 0;
  const axisY =
    level === "week" && week
      ? TIME_BAND +
        Math.max(0, (height - TIME_BAND - weekContent) / 2) +
        week.liveBand +
        STEM_GAP
      : TIME_BAND + (height - TIME_BAND) / 2;

  // 주 단계에서 줄이 너무 많아 남은 높이를 넘으면 그때만 상자 안에서 세로 스크롤.
  const contentHeight = Math.max(height, TIME_BAND + weekContent + 12);
  const monthTicks = level === "year" ? [] : timeTicks(range, "month");
  const weekTicks = level === "week" ? timeTicks(range, "week") : [];

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2.5">
      {/* 지금 보는 시기 + 단계 버튼 — 연혁 위 한 줄(연혁 안의 연도·달 눈금을
          가리지 않게 상자 밖에 둔다) */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-white tabular-nums">
          {viewText || "\u00a0"}
        </p>
        <div
          role="group"
          aria-label="확대 단계"
          className="flex items-center gap-1 rounded-lg bg-white/5 p-1"
        >
          {ZOOM_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={level === item}
              onClick={() => changeLevelAtCenter(item)}
              className={cn(
                "h-8 min-w-9 rounded-md px-2.5 text-sm font-medium transition-colors",
                FOCUS_RING,
                level === item
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
              )}
            >
              {ZOOM_LABEL[item]}
            </button>
          ))}
          <span className="wide:inline hidden px-1.5 text-sm text-white/45">
            Ctrl + 휠
          </span>
        </div>
      </div>
      <div
        id={scrollerId}
        ref={scrollRef}
        className={cn(
          "relative cursor-grab overflow-x-auto overflow-y-auto rounded-xl bg-white/[0.02] select-none data-[dragging]:cursor-grabbing",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        style={{ height }}
      >
        <div
          className="relative"
          style={{ width: contentWidth, height: contentHeight }}
        >
          {/* 시간 눈금 — 해(진한 선 + 연도), 달(옅은 선 + "3월"), 주(아주 옅은 선) */}
          {weekTicks.map((tick) => (
            <div
              key={`w:${tick.date}`}
              aria-hidden
              className="absolute bottom-0 w-px bg-white/[0.035]"
              style={{ left: x(tick.date), top: TIME_BAND - 8 }}
            />
          ))}
          {monthTicks.map((tick) => (
            <div
              key={`m:${tick.date}`}
              className="absolute bottom-0 border-l border-white/[0.07]"
              style={{ left: x(tick.date), top: 40 }}
            >
              <span className="absolute top-0 left-1.5 text-sm whitespace-nowrap text-white/55">
                {Number(tick.date.slice(5, 7))}월
              </span>
            </div>
          ))}
          {range.years.map((year, index) => {
            const left = x(`${year}-01-01`);
            return (
              <div
                key={year}
                className={cn(
                  "absolute top-0 bottom-0 border-l border-white/15",
                  index % 2 === 1 && "bg-white/[0.025]",
                )}
                style={{ left, width: x(`${Number(year) + 1}-01-01`) - left }}
              >
                <span className="bg-background/60 absolute top-2 left-2 z-30 rounded-md px-2 py-0.5 font-mono text-xl font-semibold tracking-wider text-white/90 backdrop-blur-sm">
                  {year}
                </span>
              </div>
            );
          })}
          {level !== "year" && (
            <div
              aria-hidden
              className="absolute h-0.5 bg-white/25"
              style={{ left: 0, right: 0, top: axisY - 1 }}
            />
          )}

          {level === "year" && (
            <YearView
              events={events}
              years={range.years}
              x={x}
              top={TIME_BAND - 20}
              height={height - TIME_BAND + 8}
              attendedCounts={attendedCounts}
              onOpen={openAt}
            />
          )}
          {level === "month" && (
            <MonthView
              events={events}
              x={x}
              axisY={axisY}
              top={TIME_BAND}
              height={height}
              attendedCounts={attendedCounts}
              onOpen={openAt}
            />
          )}
          {level === "week" && week && (
            <WeekView
              layout={week}
              x={x}
              axisY={axisY}
              attendedCounts={attendedCounts}
            />
          )}
        </div>
      </div>

      <TimelineScrollbar
        scrollRef={scrollRef}
        contentWidth={contentWidth}
        controlsId={scrollerId}
        marks={range.years.map((year) => ({
          key: year,
          label: year,
          ratio: x(`${year}-01-01`) / contentWidth,
        }))}
      />
    </div>
  );
}
