"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";

/**
 * 연혁 아래 스크롤 막대 — 브라우저 기본 가로 스크롤바 대신. 막대 위에 연도를
 * 적어 "지금 어디쯤 보고 있는지"를 보여 주고, 손잡이(보이는 구간)를 끌거나 막대를
 * 눌러 그 시기로 옮긴다. 손잡이에 포커스하고 ←/→로도 옮긴다.
 */
export function TimelineScrollbar({
  scrollRef,
  contentWidth,
  marks,
  controlsId,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  contentWidth: number;
  /** 막대 위 눈금 — 위치는 내용 폭 대비 비율(0~1). */
  marks: { key: string; label: string; ratio: number }[];
  controlsId: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ left: 0, width: 1 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const total = el.scrollWidth || 1;
      const left = el.scrollLeft / total;
      const width = Math.min(1, el.clientWidth / total);
      // 값이 같으면 다시 그리지 않는다.
      setView((current) =>
        current.left === left && current.width === width
          ? current
          : { left, width },
      );
    };
    // 스크롤 이벤트는 프레임당 한 번으로 묶는다.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(onScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [scrollRef, contentWidth]);

  const scrollToRatio = (ratio: number, smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: ratio * el.scrollWidth - el.clientWidth / 2,
      behavior: smooth ? "smooth" : "instant",
    });
  };

  const onThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const thumb = event.currentTarget;
    thumb.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startLeft = el.scrollLeft;
    const scale = el.scrollWidth / track.clientWidth;
    const onMove = (move: PointerEvent) => {
      el.scrollLeft = startLeft + (move.clientX - startX) * scale;
    };
    const onUp = () => {
      thumb.removeEventListener("pointermove", onMove);
      thumb.removeEventListener("pointerup", onUp);
      thumb.removeEventListener("pointercancel", onUp);
    };
    thumb.addEventListener("pointermove", onMove);
    thumb.addEventListener("pointerup", onUp);
    thumb.addEventListener("pointercancel", onUp);
  };

  const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || event.button !== 0) return;
    const rect = track.getBoundingClientRect();
    scrollToRatio((event.clientX - rect.left) / rect.width, true);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.5;
    if (event.key === "ArrowRight")
      el.scrollBy({ left: step, behavior: "smooth" });
    else if (event.key === "ArrowLeft")
      el.scrollBy({ left: -step, behavior: "smooth" });
    else if (event.key === "Home") el.scrollTo({ left: 0, behavior: "smooth" });
    else if (event.key === "End")
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else return;
    event.preventDefault();
  };

  const fits = view.width >= 0.999;

  return (
    <div
      ref={trackRef}
      onPointerDown={onTrackPointerDown}
      className="relative h-9 cursor-pointer overflow-hidden rounded-lg bg-white/5 select-none"
    >
      {marks.map((mark) => (
        <span
          key={mark.key}
          className="pointer-events-none absolute top-0 bottom-0 flex items-center border-l border-white/10 pl-1.5 font-mono text-sm text-white/45"
          style={{ left: `${mark.ratio * 100}%` }}
        >
          {mark.label}
        </span>
      ))}
      {!fits && (
        <div
          role="scrollbar"
          aria-controls={controlsId}
          aria-orientation="horizontal"
          aria-label="연혁 시기 옮기기"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((view.left / (1 - view.width)) * 100)}
          tabIndex={0}
          onPointerDown={onThumbPointerDown}
          onKeyDown={onKeyDown}
          className={cn(
            "absolute top-1 bottom-1 cursor-grab rounded-md border border-white/30 bg-white/15 transition-colors hover:bg-white/25 active:cursor-grabbing",
            FOCUS_RING,
          )}
          style={{
            left: `${view.left * 100}%`,
            width: `${view.width * 100}%`,
          }}
        />
      )}
    </div>
  );
}
