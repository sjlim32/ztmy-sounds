"use client";

import { useCallback, useState } from "react";
import { ThumbImage } from "@/components/ThumbImage";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useKoreaToday } from "@/lib/use-korea-today";
import { MicIcon } from "@/components/icons/MicIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import {
  albumTrackLabels,
  getSongCoverSrc,
  groupSongs,
  LAST_LIVE_KEY,
  type SongGroup,
} from "@/features/zutopia/song-db/song-album-grouping";
import {
  formatDaysAgo,
  type SongLiveSummary,
} from "@/features/zutopia/live-history/summary";
import { LiveLink } from "@/features/zutopia/live-history/components/LiveLink";
import { DIRECTION_OPTIONS } from "@/features/zutopia/song-db/sort";
import { parseSongMetadata } from "@/features/zutopia/song-db/song-metadata";
import { setlistTitles } from "@/features/zutopia/song-db/song-title";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";
import { SongDbDrawer } from "@/features/zutopia/song-db/components/SongDbDrawer";
import { SongDetailPanel } from "@/features/zutopia/song-db/components/SongDetailPanel";
import {
  CollabBadge,
  UnreleasedBadge,
} from "@/features/zutopia/song-db/components/SongBadges";
import {
  FilterPanel,
  FilterToggleRow,
  SortFilterBar,
  type SortFilterOption,
} from "@/features/zutopia/components/SortFilterBar";
import {
  FilterToolbar,
  ToolbarSelect,
} from "@/features/zutopia/components/FilterToolbar";
import { ZUTOPIA_SCROLL_CONTAINER_ID } from "@/features/zutopia/components/ZutopiaScrollArea";
import { useActiveSection } from "@/features/zutopia/song-db/components/use-active-section";
import { FILTER_CHIP_CLASS, FOCUS_RING } from "@/components/button-styles";
import type {
  SongGroupBy,
  SongWithAlbums,
  SortDirection,
} from "@/features/zutopia/song-db/types";

interface SongListViewProps {
  songs: SongWithAlbums[];
  /** 곡 id → 마지막 라이브 요약(라이브 기록 없는 곡은 키 없음). */
  liveSummaries: Record<string, SongLiveSummary>;
}

/**
 * 곡이 여러 앨범에 실릴 수 있어(다대다) "이 곡"만으론 드로어가 어느 앨범
 * 그룹에서 열렸는지 알 수 없다 — contextAlbumSlug로 클릭한 행의 앨범을
 * 같이 들고 다녀 드로어 상단 표시/"다른 앨범" 제외에 쓴다.
 * 연도별 보기처럼 특정 앨범이 없으면 null.
 */
interface SelectedSong {
  song: SongWithAlbums;
  contextAlbumSlug: string | null;
}

/** release_date는 DB에서 NOT NULL "YYYY-MM-DD"로 온다. */
function formatDateShort(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year.slice(2)}.${month}.${day}`;
}

/** "2023-06-07" → "2023.06.07" */
function formatDateFull(date: string): string {
  return date.replaceAll("-", ".");
}

/**
 * 묶음 띠 — 면 없이 아래 밑줄만(카드 최소화). 앨범 묶음은 커버 한 번(56px
 * 정사각형, 띠 높이 기준 — 제목이 길어 띠가 높아지면 세로 가운데) + 왼쪽 제목(한국어 / 원제 ·
 * 영어, 줄바꿈, 잘리지 않음), 오른쪽 앨범 정보(발매일 / 정규 n집 · 곡 수). 곡 줄엔 커버 대신
 * 수록 번호.
 * 연도·편곡·MV 감독 묶음은 이름 + 곡 수.
 */
function SongGroupBand({ group }: { group: SongGroup }) {
  const album = group.album;
  const count = `${group.songs.length}곡`;
  const titles = album
    ? setlistTitles({
        title: album.title,
        titleKo: album.title_ko,
        titleEn: album.title_en,
      })
    : null;
  return (
    // 면 없이 아래 밑줄만(구역 제목 줄처럼) — 카드를 겹쳐 쌓지 않는다. 높이는 커버(56px)가
    // 기준이고 제목이 줄바꿈돼 높아지면 커버는 세로 가운데(고정 정사각형이라 잘리지 않음).
    // 배경 그림 위에서도 읽히게 글자에 그림자.
    <div
      className={cn(
        "flex items-center gap-3 border-b border-white/15 pb-2",
        album ? "min-h-16" : "min-h-10",
      )}
    >
      {album &&
        (album.cover_image_url ? (
          <ThumbImage
            src={album.cover_image_url}
            displayWidth={56}
            className="size-14 shrink-0 object-cover"
          />
        ) : (
          <span aria-hidden className="size-14 shrink-0 bg-white/5" />
        ))}
      <div className="drop-shadow-legible-sm min-w-0 flex-1">
        <h2
          className={cn(
            "text-base leading-snug font-semibold break-keep text-white",
            "tablet:text-lg",
          )}
        >
          {titles?.primary ?? group.label}
        </h2>
        {titles?.secondary && (
          <p className="text-sm leading-snug break-keep text-white/60">
            {titles.secondary}
          </p>
        )}
      </div>
      {/* 오른쪽 — 앨범 정보만(발매일 / n집 · 곡 수), 제목 줄과 섞지 않는다. */}
      {album && (
        <div className="drop-shadow-legible-sm shrink-0 text-right font-mono text-sm leading-snug text-white/60 tabular-nums">
          <p>{formatDateFull(album.release_date)}</p>
          <p className="font-sans">
            {ALBUM_TYPE_SHORT_LABEL[album.album_type]} {album.album_number}집
            <span className="mx-1 text-white/30">·</span>
            {count}
          </p>
        </div>
      )}
      {!album && (
        <span className="shrink-0 self-center font-mono text-sm text-white/60 tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

type ReleaseFilter = "all" | "released" | "unreleased";

const SORT_OPTIONS: { value: SongGroupBy; label: string }[] = [
  { value: "album", label: "앨범" },
  { value: "year", label: "발매일" },
  // 편곡(songs.arranger)·MV 감독(songs.movie_director)별 묶음 — 사람마다 한 묶음.
  { value: "arranger", label: "편곡" },
  { value: "director", label: "MV 감독" },
];
// "마지막 라이브" 보기를 켰을 때만 정렬 옵션에 붙는다.
const SORT_OPTIONS_WITH_LAST_LIVE: { value: SongGroupBy; label: string }[] = [
  ...SORT_OPTIONS,
  { value: "lastLive", label: "최근 공연일" },
];

/** URL에서 "마지막 라이브" 보기를 켜는 쿼리(참전 기록가 새 창으로 연다). */
const LAST_LIVE_PARAM = "lastLive";

// "N일 전"은 보는 날(한국 날짜) 기준이라 클라이언트에서만 계산한다 — 정적
// HTML과 첫 렌더가 어긋나지 않도록 그동안은 일수를 생략한다(useKoreaToday).
const useToday = useKoreaToday;

export function SongListView({ songs, liveSummaries }: SongListViewProps) {
  const [chosenGroupBy, setGroupBy] = useState<SongGroupBy>("album");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  // 곡 범위 — 전체 / 발매곡만 / 미공개곡만(예전 "미공개곡 제외" 칩을 한 줄로 합침).
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>("all");
  // MV 있는 곡만(songs.music_video_url) — 켜면 곡 범위 개수도 MV 있는 곡만 센다.
  const [mvOnly, setMvOnly] = useState(false);
  // 협업곡(metadata.collab) 빼기 — 기본은 보여 준다. 켜면 다른 줄 개수도 협업곡을 뺀다.
  const [hideCollab, setHideCollab] = useState(false);
  const hasMv = (song: SongWithAlbums) => !!song.music_video_url?.trim();
  const isCollab = (song: SongWithAlbums) =>
    parseSongMetadata(song.metadata).collab !== null;
  const isMvMatch = (song: SongWithAlbums) => !mvOnly || hasMv(song);
  const isCollabMatch = (song: SongWithAlbums) =>
    !hideCollab || !isCollab(song);
  const pool = songs.filter((song) => isMvMatch(song) && isCollabMatch(song));
  const isReleaseMatch = (song: SongWithAlbums) =>
    releaseFilter === "all" ||
    parseSongMetadata(song.metadata).isUnreleased ===
      (releaseFilter === "unreleased");
  // 칩 개수 = 그 칩을 켰을 때 보이는 곡 수(나머지 필터는 지금 상태 그대로).
  const mvCount = songs.filter(
    (song) => hasMv(song) && isCollabMatch(song) && isReleaseMatch(song),
  ).length;
  const nonCollabCount = songs.filter(
    (song) => !isCollab(song) && isMvMatch(song) && isReleaseMatch(song),
  ).length;
  const hasCollab = songs.some(isCollab);
  const unreleasedCount = pool.filter(
    (song) => parseSongMetadata(song.metadata).isUnreleased,
  ).length;
  // 줄을 보일지는 전체 곡 기준 — MV 필터를 켜도 고른 범위 줄이 사라지지 않게.
  const hasUnreleased = songs.some(
    (song) => parseSongMetadata(song.metadata).isUnreleased,
  );
  const releaseOptions: SortFilterOption<ReleaseFilter>[] = [
    { value: "all", label: "전체", count: pool.length },
    {
      value: "released",
      label: "발매곡",
      count: pool.length - unreleasedCount,
    },
    { value: "unreleased", label: "미공개곡", count: unreleasedCount },
  ];
  // 드로어 선택 조회는 전체 songs로 한다 — 필터를 바꿔도 URL로 열린 곡의
  // 드로어가 갑자기 닫히지 않게.
  const visibleSongs = pool.filter(isReleaseMatch);

  /**
   * 드로어 열림 상태를 로컬 state가 아니라 URL 쿼리스트링(?song=&album=)
   * 으로 들고 있는다 — 진짜 히스토리 엔트리가 되어 브라우저 뒤로가기가
   * 저절로 닫힘으로 이어지고, 드로어가 열린 채로 다른 페이지로 실제
   * 이동해도(예: 즛토피아 상단 뒤로가기 링크) 무해한 "더미" 엔트리가
   * 남는 문제 자체가 생기지 않는다. SongDbDrawer는 이 사실을 몰라도
   * 되고 selected/onClose만 받는 원래 인터페이스 그대로 쓴다.
   */
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSong = songs.find((s) => s.slug === searchParams.get("song"));
  const selected: SelectedSong | null = selectedSong
    ? { song: selectedSong, contextAlbumSlug: searchParams.get("album") }
    : null;

  /**
   * 매번 새 함수를 넘기면 SongDbDrawer 포커스 관리 effect가 참조 동일성
   * 때문에 열려있는 동안도 매 렌더 재실행돼 포커스가 튄다 — router는
   * Next가 항상 같은 참조를 보장하므로 이 콜백도 항상 동일하다.
   */
  const closeDrawer = useCallback(() => {
    router.back();
  }, [router]);

  const showLastLive = searchParams.get(LAST_LIVE_PARAM) === "1";
  // 보기를 끄면 "최근 공연일" 정렬도 같이 사라지므로 앨범 정렬로 돌아간다.
  const groupBy: SongGroupBy =
    !showLastLive && chosenGroupBy === "lastLive" ? "album" : chosenGroupBy;
  const today = useToday();
  const toggleLastLive = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (showLastLive) params.delete(LAST_LIVE_PARAM);
    else params.set(LAST_LIVE_PARAM, "1");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };
  const directionLabel =
    DIRECTION_OPTIONS.find((option) => option.value === sortDirection)?.label ??
    "";
  // 앨범 묶음이 아니면 발매일을 줄마다 보여 준다(연도·편곡·MV 감독).
  const isPeopleGroup = groupBy === "arranger" || groupBy === "director";
  const showDateColumn = groupBy === "year" || isPeopleGroup;

  const groups = groupSongs(
    visibleSongs,
    groupBy,
    sortDirection,
    liveSummaries,
  );
  const showToc = groupBy !== "lastLive" && groups.length > 1;
  const sectionId = (index: number) => `song-group-${index}`;
  const activeSection = useActiveSection(
    showToc ? groups.map((_, index) => sectionId(index)) : [],
    ZUTOPIA_SCROLL_CONTAINER_ID,
  );
  const changedCount =
    Number(releaseFilter !== "all") +
    Number(mvOnly) +
    Number(hideCollab) +
    Number(showLastLive);

  return (
    <div className="flex flex-col gap-6">
      <FilterToolbar
        controls={
          <>
            <ToolbarSelect
              label="그룹 기준"
              value={groupBy}
              options={
                showLastLive ? SORT_OPTIONS_WITH_LAST_LIVE : SORT_OPTIONS
              }
              onChange={setGroupBy}
            />
            <button
              type="button"
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              aria-label={`순서: ${directionLabel} (누르면 바뀜)`}
              className={FILTER_CHIP_CLASS}
            >
              {sortDirection === "asc" ? "↑" : "↓"} {directionLabel}
            </button>
          </>
        }
        changedCount={changedCount}
        summary={`${visibleSongs.length}곡`}
        panel={
          <FilterPanel
            onReset={
              changedCount > 0
                ? () => {
                    setReleaseFilter("all");
                    setMvOnly(false);
                    setHideCollab(false);
                    if (showLastLive) toggleLastLive();
                  }
                : undefined
            }
            filters={
              <>
                {hasUnreleased && (
                  <SortFilterBar
                    label="곡"
                    groupLabel="곡 범위 고르기"
                    options={releaseOptions}
                    value={releaseFilter}
                    onChange={setReleaseFilter}
                  />
                )}
                <FilterToggleRow
                  label="MV"
                  toggles={[
                    {
                      label: "있는 곡만",
                      active: mvOnly,
                      onToggle: () => setMvOnly(!mvOnly),
                      count: mvCount,
                    },
                  ]}
                />
                {hasCollab && (
                  <FilterToggleRow
                    label="협업"
                    toggles={[
                      {
                        label: "협업곡 빼기",
                        active: hideCollab,
                        onToggle: () => setHideCollab(!hideCollab),
                        count: nonCollabCount,
                      },
                    ]}
                  />
                )}
              </>
            }
            display={
              // 결과는 그대로, 줄마다 마지막 라이브를 덧붙여 보여 주는 보기 옵션
              <FilterToggleRow
                label="보기"
                toggles={[
                  {
                    label: "마지막 라이브",
                    active: showLastLive,
                    onToggle: toggleLastLive,
                  },
                ]}
              />
            }
          />
        }
      />

      {visibleSongs.length === 0 ? (
        <p className={cn("text-base text-white/50", "tablet:text-lg")}>
          {changedCount > 0
            ? "조건에 맞는 곡이 없습니다."
            : "아직 등록된 곡이 없습니다."}
        </p>
      ) : (
        // PC는 왼쪽에 묶음 목차(화면에 고정, 지금 보는 묶음 강조) + 오른쪽 목록. 정렬·보기를
        // 바꾸면 key가 바뀌어 새 결과가 살짝 올라오며 나타난다.
        <div
          key={`${groupBy}-${sortDirection}-${releaseFilter}-${mvOnly}-${hideCollab}-${showLastLive}`}
          className={cn(
            "animate-content-in",
            showToc &&
              "pc:grid pc:grid-cols-[14rem_minmax(0,1fr)] pc:items-start pc:gap-8",
          )}
        >
          {showToc && (
            <nav
              aria-label="목차"
              className={cn(
                "surface pc:sticky pc:top-4 pc:flex hidden flex-col gap-0.5 overflow-y-auto p-1.5",
                "max-h-[calc(100dvh-12rem)]",
              )}
            >
              {groups.map((group, index) => {
                const id = sectionId(index);
                const active = activeSection === id;
                const cover = group.album?.cover_image_url ?? null;
                return (
                  <button
                    key={group.key}
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() =>
                      document
                        .getElementById(id)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className={cn(
                      "rounded-control flex items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors",
                      FOCUS_RING,
                      active
                        ? "bg-ztmy-magenta/20 text-ztmy-pink"
                        : "text-white/80 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {group.album &&
                      (cover ? (
                        <ThumbImage
                          src={cover}
                          displayWidth={28}
                          className="rounded-card size-7 shrink-0 object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="rounded-card size-7 shrink-0 bg-white/5"
                        />
                      ))}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {group.album?.title_ko || group.label}
                      </span>
                      <span
                        className={cn(
                          "block font-mono text-xs tabular-nums",
                          active ? "text-ztmy-pink/80" : "text-white/45",
                        )}
                      >
                        {group.album
                          ? group.album.release_date.slice(0, 4)
                          : `${group.songs.length}곡`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          <div className="flex min-w-0 flex-col gap-8">
            {groups.map((group, index) => {
              const trackLabels = group.album
                ? albumTrackLabels(group.songs, group.album.id)
                : null;
              return (
                <section
                  key={group.key}
                  id={sectionId(index)}
                  className="flex scroll-mt-2 flex-col gap-2"
                >
                  {/* 마지막 라이브 정렬은 묶음이 하나뿐이라 띠를 그리지 않는다. */}
                  {group.key !== LAST_LIVE_KEY && (
                    <SongGroupBand group={group} />
                  )}

                  {/* 묶음마다 카드를 씌우지 않는다(카드 최소화) — 띠 아래 곡 줄은
                      구분선만. 한 열 — 두 열로 나누면 줄 높이가 달라 열 끝이 어긋나고
                      첫 열 끝에 구분선이 남는다. */}
                  <div>
                    {/* 행 하나가 실제로는 Enter/Space/클릭으로 여닫는 토글
                  버튼이지 테이블 셀 탐색 단위가 아니라 table 구조와 안
                  맞아 div로 바꿨다(div는 지울 암묵적 role이 없다).

                  유튜브/가이드 IconLinkButton(<a>)을 <button> 자식으로
                  두면 안 된다(HTML도 button 안 a를 불허, ARIA도 위젯
                  중첩을 금지) — <button>은 앞칸+제목만 감싸고 아이콘/
                  발매일은 형제로 둔다. hover/선택 배경은 바깥 div에 둬서
                  행 전체가 강조되는 시각은 유지한다. 발매일은 형제
                  텍스트라 스크린 리더가 자연스럽게 읽어 aria-label에
                  따로 넣을 필요가 없다. */}
                    {group.songs.map((song) => {
                      const coverSrc = getSongCoverSrc(song);
                      const trackLabel = trackLabels?.get(song.id) ?? null;
                      const contextAlbumSlug = group.album?.slug ?? null;
                      const isSelected =
                        selected?.song.slug === song.slug &&
                        selected?.contextAlbumSlug === contextAlbumSlug;
                      const openSong = () => {
                        if (isSelected) {
                          router.back();
                          return;
                        }
                        const params = new URLSearchParams();
                        // 드로어를 열어도 "마지막 라이브" 보기는 유지한다.
                        if (showLastLive) params.set(LAST_LIVE_PARAM, "1");
                        params.set("song", song.slug);
                        if (contextAlbumSlug)
                          params.set("album", contextAlbumSlug);
                        const url = `${pathname}?${params.toString()}`;
                        // 닫힌 상태에서 처음 열 때만 push한다(뒤로가기 한
                        // 번에 닫힘). 이미 열린 채로 다른 곡으로 바꿀 때는
                        // replace로 같은 엔트리를 갱신해 엔트리가 안 쌓인다.
                        if (selected === null) {
                          router.push(url, { scroll: false });
                        } else {
                          router.replace(url, { scroll: false });
                        }
                      };
                      const { isUnreleased, collab } = parseSongMetadata(
                        song.metadata,
                      );
                      const liveSummary = liveSummaries[song.id];
                      const titles = setlistTitles({
                        title: song.title,
                        titleKo: song.title_ko,
                        titleEn: song.title_en,
                      });

                      return (
                        <div
                          key={song.id}
                          data-song-db-item
                          className={cn(
                            "rounded-control cursor-help break-inside-avoid border-b border-white/10 px-2 transition-colors last:border-0 hover:bg-white/5",
                            isSelected && "bg-white/10",
                          )}
                        >
                          <div
                            className={cn(
                              // 줄 높이를 맞춘다 — 둘째 줄이 없는 곡도 두 줄짜리 곡과 같게.
                              "flex min-h-14 items-center gap-1",
                              "tablet:min-h-16 tablet:gap-3",
                            )}
                          >
                            <button
                              type="button"
                              onClick={openSong}
                              aria-pressed={isSelected}
                              aria-label={`${song.title} 상세 정보 보기`}
                              className={cn(
                                "flex min-w-0 flex-1 cursor-help items-center gap-1 py-2 text-left",
                                "tablet:gap-3",
                                "focus-visible:outline-ztmy-magenta focus-visible:outline-2 focus-visible:-outline-offset-2",
                              )}
                            >
                              {/* 앨범으로 묶으면 커버는 띠에 한 번 — 줄엔 수록 번호 */}
                              {trackLabel ? (
                                <span
                                  className={cn(
                                    "w-7 shrink-0 font-mono text-sm text-white/45 tabular-nums",
                                    "tablet:w-8",
                                  )}
                                >
                                  {trackLabel}
                                </span>
                              ) : (
                                <span className="rounded-card shrink-0 bg-black/40">
                                  {coverSrc ? (
                                    <ThumbImage
                                      src={coverSrc}
                                      displayWidth={44}
                                      className="rounded-card size-11 object-cover"
                                    />
                                  ) : (
                                    <span
                                      className="rounded-card block size-11 bg-white/5"
                                      aria-hidden
                                    />
                                  )}
                                </span>
                              )}
                              {/* 한국어 제목이 첫 줄(가장 굵게), 원제 · 영어가 둘째 줄 —
                              세트리스트와 같은 순서(setlistTitles). 둘 다 자르지 않고 줄을
                              바꾼다. 미공개·협업 배지는 둘째 줄 앞. PC는 폭이 남으면 둘째 줄을
                              첫 줄 옆에, 모자라면 아래로. */}
                              <span
                                className={cn(
                                  // 글자 그림자는 제목에만 — 줄 전체에 걸면 아이콘 버튼 툴팁이
                                  // 다음 줄 아래로 깔린다(filter가 쌓임 맥락을 만든다).
                                  "drop-shadow-legible-sm min-w-0 flex-1",
                                  "pc:flex pc:flex-wrap pc:items-baseline pc:gap-x-3",
                                )}
                              >
                                <span
                                  className={cn(
                                    "block text-base leading-snug font-semibold break-keep text-white",
                                    "tablet:text-lg",
                                  )}
                                >
                                  {titles.primary}
                                </span>
                                {(titles.secondary ||
                                  isUnreleased ||
                                  collab) && (
                                  <span
                                    className={cn(
                                      "flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm leading-snug break-keep text-white/60",
                                      "tablet:text-base",
                                    )}
                                  >
                                    {isUnreleased && <UnreleasedBadge />}
                                    {collab && <CollabBadge />}
                                    {titles.secondary}
                                  </span>
                                )}
                              </span>
                            </button>

                            {/* MV·가이드 자리는 없어도 비워 둔다 — 줄마다 아이콘 열이 맞게. */}
                            <span className="flex shrink-0 items-center gap-2">
                              {song.music_video_url ? (
                                <IconLinkButton
                                  href={song.music_video_url}
                                  icon={YouTubeIcon}
                                  label="뮤직비디오 보기"
                                  tone="youtube"
                                  size="md"
                                />
                              ) : (
                                <span aria-hidden className="size-7" />
                              )}
                              {song.guideHref ? (
                                <IconLinkButton
                                  href={song.guideHref}
                                  icon={MicIcon}
                                  label="응원 가이드 이동"
                                  tone="guide"
                                  size="md"
                                />
                              ) : (
                                <span aria-hidden className="size-7" />
                              )}
                            </span>

                            {showDateColumn && (
                              <span
                                className={cn(
                                  "shrink-0 py-2 pl-3 text-right font-mono text-sm text-white/60",
                                  "tablet:text-base",
                                )}
                              >
                                {formatDateShort(song.release_date)}
                              </span>
                            )}
                          </div>

                          {/* 마지막 라이브 줄 — 공연명이 링크라 행의 button 밖에
                          둔다(button 안 a 금지). 앞칸(커버·번호) 폭만큼 들여 제목과
                          맞춘다. 자세한 기록(날짜·횟수·첫 라이브)은 곡 상세 패널에서. */}
                          {showLastLive && (
                            <p
                              className={cn(
                                "-mt-1 flex min-w-0 items-center gap-2 pb-2 text-sm",
                                trackLabel
                                  ? "tablet:pl-11 pl-8"
                                  : "tablet:pl-14 pl-12",
                              )}
                            >
                              {liveSummary ? (
                                <>
                                  <LiveLink
                                    live={liveSummary.last}
                                    className="min-w-0"
                                  />
                                  {today && (
                                    <span className="shrink-0 text-white/50">
                                      {formatDaysAgo(
                                        liveSummary.last.date,
                                        today,
                                      )}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-white/40">
                                  라이브 기록 없음
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <SongDbDrawer
        selected={selected}
        onClose={closeDrawer}
        ariaLabel={selected ? `${selected.song.title} 상세 정보` : undefined}
        contentKey={({ song }) => song.slug}
        renderContent={({ song, contextAlbumSlug }) => (
          <SongDetailPanel
            song={song}
            contextAlbumSlug={contextAlbumSlug}
            liveSummary={liveSummaries[song.id]}
            today={today}
          />
        )}
      />
    </div>
  );
}
