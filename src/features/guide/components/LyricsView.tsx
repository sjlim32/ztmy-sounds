"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Song } from "@/features/guide/lib/types";
import { LyricLine } from "@/features/guide/components/LyricLine";
import { AutoScrollToggle } from "@/features/guide/components/AutoScrollToggle";
import { useAutoScrollPreference } from "@/features/guide/lib/auto-scroll";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import {
  SongDescriptionPanel,
  hasSongDescription,
} from "@/features/guide/components/SongDescriptionPanel";
import { getSong } from "@/features/guide/data/songs";
import { SongReportLink } from "@/features/guide/components/SongReportLink";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getTagRunPositions } from "@/features/guide/lib/line-tag";

// 자동 스크롤 한 번의 길이(easeInOutCubic 곡선).
const SCROLL_MS = 450;
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function LyricsView({
  song,
  visible,
  activeLineIndex,
  seekTo,
}: {
  song: Song | null;
  visible: boolean;
  activeLineIndex: number;
  seekTo: (seconds: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const bottomSentinelRef = useRef<HTMLLIElement>(null);
  // 목록 맨 아래 sentinel이 아직 안 보이면(교차 안 함) 더 스크롤할 게 남은 것.
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [autoScroll] = useAutoScrollPreference();
  const { visibleTags } = useGuideMode();
  // 모바일 가사 맨 위 곡 설명 카드. 설명은 정식(live) 데이터에만 있을 수 있어
  // 음원 버전이어도 정식 데이터에서 읽는다. 카드가 목록의 첫 항목이라 가사 줄의
  // 목록 순번은 그만큼 밀린다(lineOffset).
  const descriptionSong = song ? (getSong(song.id) ?? song) : null;
  const showDescription =
    !!descriptionSong && hasSongDescription(descriptionSong);
  const lineOffset = showDescription ? 1 : 0;
  // 곡·모드가 바뀔 때만 계산 — 재생 중 매 tick 다시 만들면 각 줄의 memo가 깨진다.
  const runPositions = useMemo(
    () => (song ? getTagRunPositions(song.lyrics, visibleTags) : []),
    [song, visibleTags],
  );

  useEffect(() => {
    const list = listRef.current;
    const sentinel = bottomSentinelRef.current;
    if (!list || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCanScrollDown(!entry.isIntersecting),
      { root: list },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // song이 바뀌면 가사 줄 수/높이가 달라지므로 다시 관찰합니다.
  }, [song]);

  const lastSongRef = useRef<Song | null>(null);

  useEffect(() => {
    // song은 SongPanel에서 모듈 싱글턴 데이터로 계산되므로, 같은 id라도
    // 음원/라이브 버전이 다르면 참조가 달라져 아래 비교로 정상 감지됩니다.
    const songChanged = lastSongRef.current !== song;
    lastSongRef.current = song;

    if (songChanged) {
      // 이전곡/다음곡·목록 선택 등으로 곡이 바뀌면, 이전 곡에서 남은 스크롤
      // 위치가 아니라 항상 맨 위에서부터 보이도록 리셋합니다. 이 시점의
      // activeLineIndex는 아직 이전 곡의 currentTime 기준으로 계산된 낡은
      // 값일 수 있어서(영상이 아직 새 곡의 시간을 보고하기 전), 곧장
      // 자동 스크롤로 넘어가면 엉뚱한 줄로 튀었다가 되돌아오는 깜빡임이
      // 생깁니다. 그래서 곡이 바뀐 프레임에는 top 리셋만 하고 자동
      // 스크롤은 건너뜁니다 — 진짜 activeLineIndex는 다음 갱신(같은 곡
      // 내에서의 재생 진행)에서 반영됩니다.
      listRef.current?.scrollTo({ top: 0 });
      return;
    }

    if (!autoScroll) return;

    const list = listRef.current;
    const activeEl = list?.children[activeLineIndex + lineOffset] as
      HTMLElement | undefined;
    if (!list || !activeEl) return;

    // 목록 중앙에 오도록 스크롤. 브라우저 기본 부드러운 스크롤(behavior:
    // "smooth")은 짧고(약 0.15초) 줄이 바뀌는 순간 프레임이 빠지면 한 번에
    // 크게 건너뛰어, 재생 중인 줄이 덜컥거리며 흔들려 보였다. 시간 기준으로
    // 직접 움직여서 프레임이 빠져도 같은 곡선을 따라가게 한다. 손으로
    // 스크롤하기 시작하면 바로 멈춘다.
    //
    // 스크롤 위치(끝 위치 포함)는 기기 픽셀 단위로 끊는다 — 소수점 위치로
    // 움직이면 브라우저가 형광펜·줄 배경 같은 상자는 그 위치 그대로, 글자는
    // 픽셀 격자에 맞춰 그려서 둘이 프레임마다 0~1px씩 어긋나 응원 태그가 있는
    // 줄(글자 뒤에 상자가 있는 줄)이 떨려 보였다.
    const dpr = window.devicePixelRatio || 1;
    const snap = (value: number) => Math.round(value * dpr) / dpr;

    const maxScroll = list.scrollHeight - list.clientHeight;
    const to = snap(
      Math.min(
        Math.max(
          activeEl.offsetTop -
            list.clientHeight / 2 +
            activeEl.clientHeight / 2,
          0,
        ),
        maxScroll,
      ),
    );
    const from = list.scrollTop;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || Math.abs(to - from) < 1) {
      list.scrollTop = to;
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / SCROLL_MS, 1);
      list.scrollTop = snap(from + (to - from) * easeInOutCubic(progress));
      if (progress < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);

    const stop = () => cancelAnimationFrame(frameId);
    list.addEventListener("wheel", stop, { passive: true });
    list.addEventListener("touchstart", stop, { passive: true });
    return () => {
      stop();
      list.removeEventListener("wheel", stop);
      list.removeEventListener("touchstart", stop);
    };
  }, [song, activeLineIndex, autoScroll, lineOffset]);

  if (!song) return null;

  return (
    <div
      className={cn(
        // mb-4: 하단 도구막대가 없는 아이폰 인앱 브라우저에선 화면 맨 아래에
        // 홈 표시줄이 겹쳐서, 맨 아래 버튼(Auto Scroll)이 가려지지 않게 띄운다
        // (docs/RULES.md 참고).
        "relative order-3 mb-4 min-h-0 flex-1",
        "tablet:order-0 tablet:mb-0",
        // 가사 뒤 사이트 배경(보라 계열 사진)을 흐리고 살짝 어둡게 — 재생 중인
        // 줄의 보라 배경이 배경 사진과 섞이지 않고 또렷하게 보이도록.
        "bg-black/20 backdrop-blur-md",
      )}
    >
      <ol
        ref={listRef}
        data-role="lyric-list"
        data-playing={activeLineIndex >= 0 || undefined}
        className={cn(
          // bottom-12 = 스크롤 화살표 영역 확보
          "absolute inset-x-0 top-0 bottom-0 scrollbar-none overflow-x-hidden overflow-y-auto pt-6 pb-10 [&::-webkit-scrollbar]:hidden",
          // 스크롤 영역을 처음부터 별도 합성 레이어로 — 안 그러면 브라우저(특히
          // 1배율 모니터)가 자동 스크롤 중 매 프레임 글자를 다시 그리며 픽셀
          // 격자에 맞춰 재생 중이던 줄 글자가 떨려 보인다.
          "will-change-scroll",
          // 재생 중인 줄이 있을 때만 나머지 줄 글자를 흐리게 — 재생 전에는
          // 전부 또렷하게 두고, 재생 중엔 지금 줄이 확 드러나게.
          // (:has 대신 data-playing — :has는 줄이 바뀔 때마다 모든 줄의
          // 스타일을 다시 계산해서, 마침 시작되는 자동 스크롤의 프레임을 빼먹게 한다)
          "[&[data-playing]>li:not([data-active])]:text-white/55",
          "tablet:bottom-12 tablet:pt-5 tablet:pb-7",
          // 사라질 땐 트랜지션 없이 즉시, 나타날 때만 fade-in — 그래야 곡이
          // 빠르게 연달아 바뀌어도 이미 교체된 다음 곡 내용이 fade-out
          // 되는 것처럼 보이는 깜빡임이 생기지 않습니다.
          visible ? "opacity-100 transition-opacity duration-500" : "opacity-0",
        )}
      >
        {/* 모바일: 재생 전에 읽고, 재생하면 자동 스크롤로 지나가는 곡 설명
            (태블릿 이상은 영상 아래에 따로 있다) */}
        {showDescription && descriptionSong && (
          <li className={cn("px-3 pb-3", "tablet:hidden")}>
            <SongDescriptionPanel song={descriptionSong} />
          </li>
        )}
        {song.lyrics.map((line, index) => (
          <LyricLine
            key={line.time}
            line={line}
            isActive={index === activeLineIndex}
            runPosition={runPositions[index]}
            onSeek={seekTo}
          />
        ))}

        <li ref={bottomSentinelRef} aria-hidden className="h-px" />
      </ol>

      {visible && canScrollDown && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 flex h-8 w-8 -translate-x-1/2 animate-bounce items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
        >
          <ChevronDownIcon className="h-4 w-4 text-white" />
        </div>
      )}

      {/* 가사 fade 전환(곡 변경, 버전 토글)과 무관하게 항상 화면에 유지 */}
      {/* 가사 영역 오른쪽 아래(태블릿 이상은 스크롤 화살표 줄 오른쪽 끝) */}
      {/* 태블릿 이상: 곡별 오류 제보 — 가사 영역 왼쪽 아래에 늘 떠 있게(오른쪽
      아래 자동 스크롤과 마주 보는 자리). 모바일은 영상 바로 아래(GuidePlayerArea). */}
      <SongReportLink
        song={song}
        variant="floating"
        className="tablet:inline-flex absolute bottom-2 left-3 hidden"
      />
      <AutoScrollToggle
        className={cn(
          "absolute right-0 bottom-1",
          "tablet:right-3 tablet:bottom-2",
        )}
      />
    </div>
  );
}
