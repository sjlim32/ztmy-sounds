"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MicIcon } from "@/components/icons/MicIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import {
  getSongCoverSrc,
  groupSongs,
} from "@/features/zutopia/song-db/song-album-grouping";
import { DIRECTION_OPTIONS } from "@/features/zutopia/song-db/sort";
import { IconLinkButton } from "@/features/zutopia/song-db/components/IconLinkButton";
import { SongDbDrawer } from "@/features/zutopia/song-db/components/SongDbDrawer";
import { SongDetailPanel } from "@/features/zutopia/song-db/components/SongDetailPanel";
import { SortFilterBar } from "@/features/zutopia/song-db/components/SortFilterBar";
import type {
  SongGroupBy,
  SongWithAlbums,
  SortDirection,
} from "@/features/zutopia/song-db/types";

interface SongListViewProps {
  songs: SongWithAlbums[];
}

/**
 * 곡이 여러 앨범에 실릴 수 있어(다대다) "이 곡"만으론 드로어가 어느 앨범
 * 그룹에서 열렸는지 알 수 없다 — contextAlbumId로 클릭한 행의 앨범을
 * 같이 들고 다녀 드로어 상단 표시/"다른 앨범" 제외에 쓴다.
 * 연도별 보기처럼 특정 앨범이 없으면 null.
 */
interface SelectedSong {
  song: SongWithAlbums;
  contextAlbumId: string | null;
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

export function SongListView({ songs }: SongListViewProps) {
  const [groupBy, setGroupBy] = useState<SongGroupBy>("album");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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
  const selectedSong = songs.find((s) => s.id === searchParams.get("song"));
  const selected: SelectedSong | null = selectedSong
    ? { song: selectedSong, contextAlbumId: searchParams.get("album") }
    : null;

  /**
   * 매번 새 함수를 넘기면 SongDbDrawer 포커스 관리 effect가 참조 동일성
   * 때문에 열려있는 동안도 매 렌더 재실행돼 포커스가 튄다 — router는
   * Next가 항상 같은 참조를 보장하므로 이 콜백도 항상 동일하다.
   */
  const closeDrawer = useCallback(() => {
    router.back();
  }, [router]);
  const showDateColumn = groupBy === "year";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <SortFilterBar
          options={SORT_OPTIONS}
          value={groupBy}
          onChange={setGroupBy}
        />
        <SortFilterBar
          label="순서"
          options={DIRECTION_OPTIONS}
          value={sortDirection}
          onChange={setSortDirection}
        />
      </div>

      {songs.length === 0 ? (
        <p className={cn("text-base text-white/50", "tablet:text-lg")}>
          아직 등록된 곡이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groupSongs(songs, groupBy, sortDirection).map((group) => {
            const albumSubtitle = group.album
              ? `${ALBUM_TYPE_SHORT_LABEL[group.album.album_type]} ${group.album.album_number}집 · ${group.album.title_ko}`
              : "";

            return (
              <section key={group.key}>
                <div className="bg-ztmy-dark/60 flex flex-col px-2 py-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "min-w-0 truncate font-mono text-base font-semibold tracking-[0.2em] uppercase",
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
                        {albumSubtitle}
                      </p>
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

                <div>
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
                    const contextAlbumId = group.album?.id ?? null;
                    const isSelected =
                      selected?.song.id === song.id &&
                      selected?.contextAlbumId === contextAlbumId;
                    const openSong = () => {
                      if (isSelected) {
                        router.back();
                        return;
                      }
                      const params = new URLSearchParams();
                      params.set("song", song.id);
                      if (contextAlbumId) params.set("album", contextAlbumId);
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

                    return (
                      <div
                        key={song.id}
                        data-song-db-item
                        className={cn(
                          "flex cursor-help items-center gap-1 border-b border-white/10 px-2 transition-colors last:border-0 hover:bg-white/5",
                          "tablet:gap-3",
                          isSelected && "bg-white/10",
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
                          <span className="shrink-0">
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
                            <span
                              className={cn(
                                "block min-w-0 truncate text-base font-medium text-white",
                                "tablet:text-lg",
                              )}
                            >
                              {song.title}
                            </span>
                            <span
                              className={cn(
                                "block text-sm text-white/70",
                                "tablet:text-base",
                              )}
                            >
                              {song.title_ko}
                              <span className={cn("hidden", "tablet:inline")}>
                                {" "}
                                ({song.title_en})
                              </span>
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
                                label="샤모지 호응 가이드 이동"
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
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <SongDbDrawer
        selected={selected}
        onClose={closeDrawer}
        ariaLabel={selected ? `${selected.song.title} 상세 정보` : undefined}
        renderContent={({ song, contextAlbumId }) => (
          <SongDetailPanel
            song={song}
            contextAlbumId={contextAlbumId}
            onClose={closeDrawer}
          />
        )}
      />
    </div>
  );
}
