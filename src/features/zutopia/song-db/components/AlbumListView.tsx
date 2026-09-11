"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import { groupAlbums } from "@/features/zutopia/song-db/song-album-grouping";
import { DIRECTION_OPTIONS } from "@/features/zutopia/song-db/sort";
import { AlbumDetailPanel } from "@/features/zutopia/song-db/components/AlbumDetailPanel";
import { SongDbDrawer } from "@/features/zutopia/song-db/components/SongDbDrawer";
import { SortFilterBar } from "@/features/zutopia/song-db/components/SortFilterBar";
import type {
  AlbumGroupBy,
  AlbumWithSongs,
  SortDirection,
} from "@/features/zutopia/song-db/types";

interface AlbumListViewProps {
  albums: AlbumWithSongs[];
}

type AlbumCoverVersion = "regular" | "first-press";

// 카드마다 살짝 다른 기울기/높이를 줘서 "서랍장에 나란히 꽂힌" 느낌을 낸다 —
// index % 3 기준으로 3가지 패턴을 순환시켜 완전히 균일하게 반복되지 않게 한다.
const SHELF_TILT = ["-rotate-2", "rotate-1", "-rotate-1"];
const SHELF_LEAN = ["translate-y-0", "-translate-y-1.5", "translate-y-1"];

const COVER_VERSION_OPTIONS: { value: AlbumCoverVersion; label: string }[] = [
  { value: "regular", label: "통상반" },
  { value: "first-press", label: "초회반" },
];

const SORT_OPTIONS: { value: AlbumGroupBy; label: string }[] = [
  { value: "type", label: "타입" },
  { value: "year", label: "발매일" },
];

function getAlbumHoverParts(album: AlbumWithSongs): {
  prefix: string;
  title: string;
} {
  const prefix = `${ALBUM_TYPE_SHORT_LABEL[album.album_type]} ${album.album_number}집`;
  return { prefix, title: album.title };
}

function getAlbumCoverSrc(
  album: AlbumWithSongs,
  showBookCover: boolean,
): string | null {
  if (showBookCover) {
    return album.book_image_urls?.[0] ?? album.cover_image_url;
  }
  return album.cover_image_url;
}

export function AlbumListView({ albums }: AlbumListViewProps) {
  const [groupBy, setGroupBy] = useState<AlbumGroupBy>("type");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [coverVersion, setCoverVersion] =
    useState<AlbumCoverVersion>("regular");
  const showBookCover = coverVersion === "first-press";

  /**
   * 드로어 열림 상태를 로컬 state가 아니라 URL 쿼리스트링(?album=)으로
   * 들고 있는다 — 진짜 히스토리 엔트리가 되어 브라우저 뒤로가기가 저절로
   * 닫힘으로 이어지고, 드로어가 열린 채로 다른 페이지로 실제 이동해도
   * 무해한 "더미" 엔트리가 남는 문제 자체가 없어진다(SongListView 동일).
   */
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedAlbumId = searchParams.get("album");
  const selected = albums.find((album) => album.id === selectedAlbumId) ?? null;

  /**
   * 매번 새 함수를 넘기면 SongDbDrawer 포커스 관리 effect가 참조 동일성
   * 때문에 열려있는 동안도 매 렌더 재실행돼 포커스가 튄다 — router는
   * Next가 항상 같은 참조를 보장하므로 이 콜백도 항상 동일하다.
   */
  const closeDrawer = useCallback(() => {
    router.back();
  }, [router]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // 앨범/마도서 버전 토글을 바꾸면 이미지 순서가 달라지므로 미니 캐러셀을
  // 0번부터 다시 시작한다. useRef가 아니라 useState로 이전 값을 비교하는
  // 렌더 중 상태 조정 패턴을 쓴다(React 공식 권장 — useRef는 Strict
  // Mode 이중 렌더에서 비멱등적이다). 드로어가 닫히는 순간(selected===null)
  // 은 비교에서 제외한다 — 포함하면 300ms 슬라이드 아웃 도중 갤러리
  // 인덱스가 먼저 0으로 튀어 엉뚱한 이미지가 사라지는 것처럼 보인다.
  const selectionKey = selected ? `${selected.id}:${showBookCover}` : null;
  const [prevSelectionKey, setPrevSelectionKey] = useState(selectionKey);
  if (selected !== null && selectionKey !== prevSelectionKey) {
    setPrevSelectionKey(selectionKey);
    if (galleryIndex !== 0) setGalleryIndex(0);
  }

  const groups = groupAlbums(albums, groupBy, sortDirection);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <SortFilterBar
          options={SORT_OPTIONS}
          value={groupBy}
          onChange={setGroupBy}
        />

        <section
          className={cn("flex flex-row flex-wrap gap-2", "tablet:gap-4")}
        >
          <SortFilterBar
            label="순서"
            options={DIRECTION_OPTIONS}
            value={sortDirection}
            onChange={setSortDirection}
          />
          <SortFilterBar
            label="앨범 커버"
            options={COVER_VERSION_OPTIONS}
            value={coverVersion}
            onChange={setCoverVersion}
          />
        </section>
      </div>

      {albums.length === 0 ? (
        <p className={cn("text-base text-white/50", "tablet:text-lg")}>
          아직 등록된 앨범이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key}>
              <p
                className={cn(
                  "bg-ztmy-purple/15 p-1 font-mono text-lg font-semibold tracking-[0.2em] text-white/70 uppercase",
                  "tablet:text-xl tablet:p-2",
                )}
              >
                {group.label}
              </p>

              <div
                className={cn(
                  "grid gap-y-4 py-3 pr-8 pl-6",
                  "grid-cols-[repeat(auto-fill,4.5rem)]",
                  "overflow-x-clip",
                  "tablet:overflow-visible tablet:mt-3 tablet:grid-cols-[repeat(auto-fill,9.75rem)] tablet:pt-6 tablet:pr-6 tablet:pl-0 tablet:gap-y-10",
                )}
              >
                {group.albums.map((album, index) => {
                  const isSelected = selected?.id === album.id;
                  const { prefix, title } = getAlbumHoverParts(album);
                  const coverSrc = getAlbumCoverSrc(album, showBookCover);
                  return (
                    <button
                      key={album.id}
                      type="button"
                      data-song-db-item
                      onClick={() => {
                        if (isSelected) {
                          router.back();
                          return;
                        }
                        const url = `${pathname}?album=${album.id}`;
                        // 닫힌 상태에서 처음 열 때만 새 엔트리를 쌓는다.
                        // 이미 열린 채로 다른 앨범으로 바꿀 때는 같은
                        // 엔트리를 replace한다(SongListView 동일).
                        if (selected === null) {
                          router.push(url, { scroll: false });
                        } else {
                          router.replace(url, { scroll: false });
                        }
                      }}
                      aria-haspopup="dialog"
                      aria-pressed={isSelected}
                      aria-label={`${prefix} ${title}`}
                      className={cn(
                        "group relative h-28 w-28 cursor-help",
                        "tablet:h-44 tablet:w-44",
                        "transition-[transform,filter] duration-500 ease-in-out",
                        SHELF_TILT[index % SHELF_TILT.length],
                        SHELF_LEAN[index % SHELF_LEAN.length],
                        "tablet:hover:z-40 tablet:hover:rotate-0 tablet:hover:-translate-y-6 tablet:hover:scale-110 tablet:hover:brightness-110",
                        isSelected && "z-30 rotate-0",
                      )}
                    >
                      {coverSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverSrc}
                          alt={album.title}
                          loading="lazy"
                          className={cn(
                            "h-28 w-28 rounded object-cover shadow-lg ring-1 ring-white/10",
                            "transition-shadow duration-500 ease-in-out",
                            "tablet:h-44 tablet:w-44",
                            "tablet:group-hover:shadow-2xl",
                            isSelected &&
                              "ring-ztmy-magenta/70 shadow-2xl ring-2",
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "h-28 w-28 rounded bg-white/5 ring-1 ring-white/10",
                            "tablet:h-44 tablet:w-44",
                          )}
                        />
                      )}

                      <span
                        className={cn(
                          "pointer-events-none absolute top-full left-1/2 z-10 mt-1 flex w-max max-w-60 -translate-x-1/2 translate-y-1 flex-col items-center opacity-0",
                          "rounded-lg bg-black/85 px-3 py-1.5 text-xs text-white",
                          "tablet:text-sm",
                          "transition-[opacity,transform] duration-300 ease-out",
                          // 모바일엔 hover가 없어 터치 중(group-active)
                          // 에만 잠깐 보여준다 — position:absolute라
                          // 그리드 레이아웃을 건드리지 않고 다른 카드와도
                          // 안 겹친다.
                          "group-active:translate-y-0 group-active:opacity-100",
                          "tablet:group-hover:translate-y-0 tablet:group-hover:opacity-100",
                        )}
                      >
                        <span className="text-white/60">{prefix}</span>
                        <span>{title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <SongDbDrawer
        selected={selected}
        onClose={closeDrawer}
        ariaLabel={selected ? `${selected.title} 상세 정보` : undefined}
        renderContent={(album) => (
          <AlbumDetailPanel
            album={album}
            showBookCover={showBookCover}
            galleryIndex={galleryIndex}
            onGalleryIndexChange={setGalleryIndex}
            onClose={closeDrawer}
          />
        )}
      />
    </div>
  );
}
