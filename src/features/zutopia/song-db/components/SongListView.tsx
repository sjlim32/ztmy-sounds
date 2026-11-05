"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useKoreaToday } from "@/lib/use-korea-today";
import { MicIcon } from "@/components/icons/MicIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import {
  getSongCoverSrc,
  groupSongs,
  LAST_LIVE_KEY,
} from "@/features/zutopia/song-db/song-album-grouping";
import {
  formatDaysAgo,
  type SongLiveSummary,
} from "@/features/zutopia/live-history/summary";
import { LiveLink } from "@/features/zutopia/live-history/components/LiveLink";
import { DIRECTION_OPTIONS } from "@/features/zutopia/song-db/sort";
import { parseSongMetadata } from "@/features/zutopia/song-db/song-metadata";
import { secondaryTitle } from "@/features/zutopia/song-db/song-title";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";
import { SongDbDrawer } from "@/features/zutopia/song-db/components/SongDbDrawer";
import { SongDetailPanel } from "@/features/zutopia/song-db/components/SongDetailPanel";
import { UnreleasedBadge } from "@/features/zutopia/song-db/components/UnreleasedBadge";
import {
  SORT_FILTER_CARD_CLASS,
  SortFilterBar,
} from "@/features/zutopia/components/SortFilterBar";
import { FilterChip, FilterRow } from "@/components/FilterChips";
import type {
  SongGroupBy,
  SongWithAlbums,
  SortDirection,
} from "@/features/zutopia/song-db/types";

interface SongListViewProps {
  songs: SongWithAlbums[];
  /** 정렬 카드 오른쪽 위에 작게 보여줄 개수 문구(예: "전체 75곡 · 미공개 5곡"). */
  summary?: string;
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

const SORT_OPTIONS: { value: SongGroupBy; label: string }[] = [
  { value: "album", label: "앨범" },
  { value: "year", label: "발매일" },
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

export function SongListView({
  songs,
  summary,
  liveSummaries,
}: SongListViewProps) {
  const [chosenGroupBy, setGroupBy] = useState<SongGroupBy>("album");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hideUnreleased, setHideUnreleased] = useState(false);
  const hasUnreleased = songs.some(
    (song) => parseSongMetadata(song.metadata).isUnreleased,
  );
  // 드로어 선택 조회는 전체 songs로 한다 — 필터를 켜도 URL로 열린 미공개곡
  // 드로어가 갑자기 닫히지 않게.
  const visibleSongs = hideUnreleased
    ? songs.filter((song) => !parseSongMetadata(song.metadata).isUnreleased)
    : songs;

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
  const showDateColumn = groupBy === "year";

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(SORT_FILTER_CARD_CLASS, "relative")}>
        {summary && (
          <p className="tablet:absolute tablet:top-3 tablet:right-4 text-sm text-white/50">
            {summary}
          </p>
        )}
        <SortFilterBar
          options={showLastLive ? SORT_OPTIONS_WITH_LAST_LIVE : SORT_OPTIONS}
          value={groupBy}
          onChange={setGroupBy}
        />
        <SortFilterBar
          label="순서"
          options={DIRECTION_OPTIONS}
          value={sortDirection}
          onChange={setSortDirection}
        />
        {/* 다른 줄과 같은 필터 칩 — 누를 때마다 켜고 끈다. */}
        <FilterRow label="보기">
          {hasUnreleased && (
            <FilterChip
              active={hideUnreleased}
              onClick={() => setHideUnreleased(!hideUnreleased)}
            >
              미공개곡 제외
            </FilterChip>
          )}
          <FilterChip active={showLastLive} onClick={toggleLastLive}>
            마지막 라이브
          </FilterChip>
        </FilterRow>
      </div>

      {visibleSongs.length === 0 ? (
        <p className={cn("text-base text-white/50", "tablet:text-lg")}>
          아직 등록된 곡이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groupSongs(visibleSongs, groupBy, sortDirection, liveSummaries).map(
            (group) => {
              const albumNumberLabel = group.album
                ? `${ALBUM_TYPE_SHORT_LABEL[group.album.album_type]} ${group.album.album_number}집`
                : "";

              return (
                <section key={group.key}>
                  {/* 마지막 라이브 정렬은 그룹이 하나뿐이라 헤더를 그리지 않는다. */}
                  {group.key !== LAST_LIVE_KEY && (
                    <div className="bg-ztmy-dark/60 flex flex-col px-2 py-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p
                          className={cn(
                            "min-w-0 truncate font-mono text-base leading-tight font-semibold tracking-[0.2em] uppercase",
                            "tablet:text-xl",
                          )}
                        >
                          {group.label}
                        </p>
                        {group.album && (
                          <span
                            className={cn(
                              "shrink-0 font-mono text-xs text-white/70",
                              "tablet:text-sm",
                            )}
                          >
                            {formatDateShort(group.album.release_date)}
                          </span>
                        )}
                      </div>

                      {group.album && (
                        <div className="flex items-baseline justify-between gap-3">
                          <p
                            className={cn(
                              "min-w-0 truncate text-xs font-normal tracking-normal text-white/50 normal-case",
                              "tablet:text-sm",
                            )}
                          >
                            <span className={cn("hidden", "tablet:inline")}>
                              {albumNumberLabel} ·{" "}
                            </span>
                            {group.album.title_ko}
                          </p>
                          {/* MO는 앨범 번호를 날짜 밑에, PC는 번호를 왼쪽 부제로
                      돌리고 이 자리에 영어 제목을 둔다. */}
                          <span
                            className={cn(
                              "shrink-0 text-xs text-white/50",
                              "tablet:hidden",
                            )}
                          >
                            {albumNumberLabel}
                          </span>
                          <span
                            className={cn(
                              "hidden shrink-0 text-sm text-white/50",
                              "tablet:inline tablet:text-base",
                            )}
                          >
                            {group.album.title_en}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 넓은 화면(1440px~)은 두 열 — 수록 순서대로 위→아래로 흐르게
                      columns. 곡 상세(오른쪽 드로어)가 열려 있으면 오른쪽 열을
                      덮으므로 한 열로 돌아간다. */}
                  <div
                    className={cn(!selected && "wide:columns-2 wide:gap-x-8")}
                  >
                    {/* 행 하나가 실제로는 Enter/Space/클릭으로 여닫는 토글
                  버튼이지 테이블 셀 탐색 단위가 아니라 table 구조와 안
                  맞아 div로 바꿨다(div는 지울 암묵적 role이 없다).

                  유튜브/가이드 IconLinkButton(<a>)을 <button> 자식으로
                  두면 안 된다(HTML도 button 안 a를 불허, ARIA도 위젯
                  중첩을 금지) — <button>은 커버+제목만 감싸고 아이콘/
                  발매일은 형제로 둔다. hover/선택 배경은 바깥 div에 둬서
                  행 전체가 강조되는 시각은 유지한다. 발매일은 형제
                  텍스트라 스크린 리더가 자연스럽게 읽어 aria-label에
                  따로 넣을 필요가 없다. */}
                    {group.songs.map((song) => {
                      const coverSrc = getSongCoverSrc(song);
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
                      const hasIcons = song.music_video_url || song.guideHref;
                      const { isUnreleased } = parseSongMetadata(song.metadata);
                      const liveSummary = liveSummaries[song.id];

                      return (
                        <div
                          key={song.id}
                          data-song-db-item
                          className={cn(
                            "cursor-help break-inside-avoid border-b border-white/10 px-2 transition-colors last:border-0 hover:bg-white/5",
                            isSelected && "bg-white/10",
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              "tablet:gap-3",
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
                              <span className="shrink-0 rounded bg-black/40">
                                {coverSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={coverSrc}
                                    alt=""
                                    loading="lazy"
                                    className="size-11 rounded object-cover"
                                  />
                                ) : (
                                  <span
                                    className="block size-11 rounded bg-white/5"
                                    aria-hidden
                                  />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex min-w-0 items-center gap-2">
                                  <span
                                    className={cn(
                                      "min-w-0 truncate text-base leading-tight font-medium text-white",
                                      "tablet:text-lg",
                                    )}
                                  >
                                    {song.title}
                                  </span>
                                  {isUnreleased && <UnreleasedBadge />}
                                </span>
                                {/* 세트리스트와 같은 둘째 줄 — "한국어 · 영어", 길면 영어 쪽부터 잘린다. */}
                                <span
                                  className={cn(
                                    "block truncate text-sm text-white/70",
                                    "tablet:text-base",
                                  )}
                                >
                                  {secondaryTitle({
                                    title: song.title,
                                    titleKo: song.title_ko,
                                    titleEn: song.title_en,
                                  })}
                                </span>
                              </span>
                            </button>

                            {hasIcons && (
                              <span className="flex shrink-0 items-center gap-2">
                                {song.music_video_url && (
                                  <IconLinkButton
                                    href={song.music_video_url}
                                    icon={YouTubeIcon}
                                    label="뮤직비디오 보기"
                                    tone="youtube"
                                    size="md"
                                  />
                                )}
                                {song.guideHref && (
                                  <IconLinkButton
                                    href={song.guideHref}
                                    icon={MicIcon}
                                    label="응원 가이드 이동"
                                    tone="guide"
                                    size="md"
                                  />
                                )}
                              </span>
                            )}

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
                          둔다(button 안 a 금지). 커버 폭만큼 들여 제목과 맞춘다.
                          자세한 기록(날짜·횟수·첫 라이브)은 곡 상세 패널에서. */}
                          {showLastLive && (
                            <p
                              className={cn(
                                "-mt-1 flex min-w-0 items-center gap-2 pb-2 pl-12 text-sm",
                                "tablet:pl-14",
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
            },
          )}
        </div>
      )}

      <SongDbDrawer
        selected={selected}
        onClose={closeDrawer}
        ariaLabel={selected ? `${selected.song.title} 상세 정보` : undefined}
        renderContent={({ song, contextAlbumSlug }) => (
          <SongDetailPanel
            song={song}
            contextAlbumSlug={contextAlbumSlug}
            onClose={closeDrawer}
            liveSummary={liveSummaries[song.id]}
            today={today}
          />
        )}
      />
    </div>
  );
}
