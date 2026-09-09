"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import {
  ZoomableImageGroup,
  type ZoomableImageGroupItem,
} from "@/components/ZoomableImageGroup";
import {
  ALBUM_TYPE_ORDER,
  ALBUM_TYPE_SECTION_LABEL,
  ALBUM_TYPE_SHORT_LABEL,
} from "./labels";
import { SongDbDrawer } from "./SongDbDrawer";
import { SortFilterBar } from "./SortFilterBar";
import { applySortDirection, DIRECTION_OPTIONS } from "./sort";
import type { AlbumGroupBy, AlbumWithSongs, SortDirection } from "./types";

const SORT_OPTIONS: { value: AlbumGroupBy; label: string }[] = [
  { value: "type", label: "타입" },
  { value: "year", label: "발매일" },
];

type AlbumCoverVersion = "regular" | "first-press";

const COVER_VERSION_OPTIONS: { value: AlbumCoverVersion; label: string }[] = [
  { value: "regular", label: "통상반" },
  { value: "first-press", label: "초회반" },
];

interface AlbumGroup {
  key: string;
  label: string;
  albums: AlbumWithSongs[];
}

function isAlbumTypeKey(
  type: string,
): type is (typeof ALBUM_TYPE_ORDER)[number] {
  return (ALBUM_TYPE_ORDER as readonly string[]).includes(type);
}

function albumYear(album: AlbumWithSongs): string {
  return album.release_date.slice(0, 4);
}

/**
 * groupBy에 따라 정렬 기준이 통째로 바뀐다 — "type"은 정규→미니→EP 고정
 * 순서, "year"는 데뷔년도가 위로 오도록 오름차순이다. year 키는 Map
 * 등장 순서가 아니라 명시적으로 정렬한다 — albums가 이미 release_date
 * 오름차순으로 온다는(현재는 data.ts의 .order() 덕분에 참인) 가정에
 * 기대면, 그 쿼리의 정렬이 나중에 바뀌었을 때 이 함수가 조용히 연도
 * 순서를 깨뜨릴 수 있다(SongListView의 groupSongs도 동일하게 명시적으로
 * 정렬한다). 여기까지는 항상 오름차순 기준으로 만들고, direction이
 * "desc"면 마지막에 그룹 순서와 각 그룹 내부 앨범 순서를 통째로 뒤집는다.
 */
function groupAlbums(
  albums: AlbumWithSongs[],
  groupBy: AlbumGroupBy,
  direction: SortDirection,
): AlbumGroup[] {
  let groups: AlbumGroup[];

  if (groupBy === "year") {
    const byYear = new Map<string, AlbumWithSongs[]>();
    for (const album of albums) {
      const year = albumYear(album);
      const bucket = byYear.get(year);
      if (bucket) {
        bucket.push(album);
      } else {
        byYear.set(year, [album]);
      }
    }
    groups = [...byYear.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, list]) => ({
        key: year,
        label: `${year}년`,
        albums: list,
      }));
  } else {
    const byType = new Map<string, AlbumWithSongs[]>();
    for (const album of albums) {
      const key = album.album_type ?? "기타";
      const bucket = byType.get(key);
      if (bucket) {
        bucket.push(album);
      } else {
        byType.set(key, [album]);
      }
    }
    const orderedKeys = [
      ...ALBUM_TYPE_ORDER.filter((type) => byType.has(type)),
      ...[...byType.keys()].filter((key) => !isAlbumTypeKey(key)),
    ];
    groups = orderedKeys.map((key) => ({
      key,
      label: isAlbumTypeKey(key) ? ALBUM_TYPE_SECTION_LABEL[key] : key,
      albums: byType.get(key) ?? [],
    }));
  }

  return applySortDirection(
    groups,
    direction,
    (group) => group.albums,
    (group, albums) => ({ ...group, albums }),
  );
}

// 카드마다 살짝 다른 기울기/높이를 줘서 "서랍장에 나란히 꽂힌" 느낌을 낸다 —
// index % 3 기준으로 3가지 패턴을 순환시켜 완전히 균일하게 반복되지 않게 한다.
const SHELF_TILT = ["-rotate-2", "rotate-1", "-rotate-1"];
const SHELF_LEAN = ["translate-y-0", "-translate-y-1.5", "translate-y-1"];

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

/**
 * 상세 드로어 캐러셀에 들어갈 전체 이미지 목록 — cover_image_url + 부클릿
 * (book_image_urls) 전부, 항상 둘 다 포함한다. "마도서 버전 보기"가 켜져
 * 있으면 book_image_urls[0]이 먼저 보이도록 cover_image_url을 맨 뒤로
 * 옮긴다(순서만 바뀔 뿐 빠지지는 않음) — 꺼져 있으면 cover_image_url이
 * 그대로 맨 앞이다. 캐러셀은 항상 0번부터 시작하면 되므로 별도의 "시작
 * 인덱스" 계산이 필요 없다.
 */
function getAlbumGalleryImages(
  album: AlbumWithSongs,
  showBookCover: boolean,
): ZoomableImageGroupItem[] {
  const coverImage: ZoomableImageGroupItem | null = album.cover_image_url
    ? { src: album.cover_image_url, alt: album.title }
    : null;
  const bookImages = (album.book_image_urls ?? [])
    .filter((url) => url !== album.cover_image_url)
    .map((url, i) => ({
      src: url,
      alt: `${album.title} 북클릿 ${i + 1}`,
    }));

  if (!coverImage) return bookImages;
  return showBookCover
    ? [...bookImages, coverImage]
    : [coverImage, ...bookImages];
}

export function AlbumListView({ albums }: { albums: AlbumWithSongs[] }) {
  const [groupBy, setGroupBy] = useState<AlbumGroupBy>("type");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [coverVersion, setCoverVersion] =
    useState<AlbumCoverVersion>("regular");
  const showBookCover = coverVersion === "first-press";
  const [selected, setSelected] = useState<AlbumWithSongs | null>(null);
  // 드로어에 매번 새 화살표 함수를 넘기면 SongDbDrawer의 포커스 관리
  // effect가 참조 동일성 때문에 열려 있는 동안에도 매 렌더마다 다시
  // 실행돼(포커스가 튀는 등) 불필요하게 흔들린다 — setSelected는 useState가
  // 보장하는 안정적인 참조라 이 콜백도 항상 같은 참조를 유지한다.
  const closeDrawer = useCallback(() => setSelected(null), []);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  // pointerup에서 드래그(스와이프)가 임계값을 넘었으면 true — 뒤이어 발생하는
  // click까지 "확대 보기 모달 열기"로 처리하지 않도록 한 번 건너뛴다.
  const didDragRef = useRef(false);

  // 앨범을 바꾸거나 마도서 버전 토글을 바꾸면 이미지 순서가 통째로 달라지므로,
  // 미니 캐러셀은 항상 0번부터 다시 시작한다. useEffect가 아니라 렌더 중
  // 비교(React가 권장하는 "prop 변화에 맞춰 state 조정" 패턴)로 처리해서
  // 불필요한 추가 렌더 한 번을 건너뛴다 — 이 패턴은 React 문서가 useRef가
  // 아니라 useState로 이전 값을 추적하도록 명시한다(useRef를 렌더 중에 쓰면
  // Strict Mode의 이중 렌더 호출에서 두 번째 호출이 첫 번째가 이미 반영한
  // ref 값을 보고 조건을 건너뛰어버려 비멱등적이다). selected가 null이 되는
  // (드로어가 닫히는) 순간은 비교 대상에서 제외한다 — 포함시키면 드로어가
  // 닫히는 300ms 슬라이드 아웃 애니메이션이 재생되는 동안 갤러리 인덱스가
  // 즉시 0으로 튀어, 마지막으로 보고 있던 이미지가 아니라 엉뚱한 이미지가
  // 사라지는 것처럼 보인다.
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

        <section className="tablet:gap-4 flex flex-row flex-wrap gap-2">
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
                  "font-mono text-lg font-semibold tracking-[0.2em] text-white/70 uppercase",
                  "tablet:text-xl",
                )}
              >
                {group.label}
              </p>

              <div
                className={cn(
                  "grid gap-y-4 py-3 pr-8 pl-6",
                  "grid-cols-[repeat(auto-fill,4.5rem)]",
                  "tablet:overflow-visible overflow-x-clip",
                  "tablet:mt-3 tablet:grid-cols-[repeat(auto-fill,9.75rem)] tablet:pt-6 tablet:pr-6 tablet:pl-0 tablet:gap-y-10",
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
                      onClick={() => setSelected(isSelected ? null : album)}
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
                          "pointer-events-none absolute top-full left-1/2 z-10 mt-1 flex w-max max-w-40 -translate-x-1/2 translate-y-1 flex-col items-center opacity-0",
                          "rounded-lg bg-black/85 px-3 py-1.5 text-sm text-white",
                          "tablet:text-base",
                          "transition-[opacity,transform] duration-300 ease-out",
                          // 모바일엔 hover가 없어서 기본으로는 이 라벨을 볼 방법이
                          // 없다 — 터치가 눌려있는 동안(group-active)만이라도
                          // 잠깐 보여줘서, 커버를 눌러보면 그게 뭔지 미리 알 수
                          // 있게 한다(그리드 레이아웃 자체를 건드리지 않는
                          // position:absolute라 다른 카드와 안 겹친다).
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
        renderContent={(album) => {
          const galleryImages = getAlbumGalleryImages(album, showBookCover);
          const hasGalleryMultiple = galleryImages.length > 1;

          const goPrevImage = () => {
            setGalleryIndex(
              (index) =>
                (index - 1 + galleryImages.length) % galleryImages.length,
            );
          };
          const goNextImage = () => {
            setGalleryIndex((index) => (index + 1) % galleryImages.length);
          };

          const GALLERY_SWIPE_THRESHOLD_PX = 40;
          const handleGalleryPointerDown = (event: React.PointerEvent) => {
            if (!hasGalleryMultiple) return;
            dragStartXRef.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
          };
          const handleGalleryPointerUp = (event: React.PointerEvent) => {
            if (dragStartXRef.current === null) return;
            const deltaX = event.clientX - dragStartXRef.current;
            dragStartXRef.current = null;
            if (Math.abs(deltaX) < GALLERY_SWIPE_THRESHOLD_PX) return;
            didDragRef.current = true;
            if (deltaX > 0) goPrevImage();
            else goNextImage();
          };

          return (
            <>
              <div className="tablet:h-108 relative h-80 w-full shrink-0 p-3">
                {galleryImages.length === 0 ? (
                  <div className="h-full w-full bg-white/5" />
                ) : (
                  <>
                    <ZoomableImageGroup
                      images={galleryImages}
                      hideThumbnails
                      renderTrigger={(open) => (
                        <button
                          type="button"
                          onPointerDown={handleGalleryPointerDown}
                          onPointerUp={handleGalleryPointerUp}
                          onClick={() => {
                            if (didDragRef.current) {
                              didDragRef.current = false;
                              return;
                            }
                            open(galleryIndex);
                          }}
                          aria-label={`${galleryImages[galleryIndex].alt} — 크게 보기`}
                          className="flex h-full w-full cursor-zoom-in items-center justify-center"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={galleryImages[galleryIndex].src}
                            alt={galleryImages[galleryIndex].alt}
                            draggable={false}
                            className="aspect-square h-4/5 max-h-full w-auto object-contain"
                          />
                        </button>
                      )}
                    />

                    {hasGalleryMultiple && (
                      <>
                        <button
                          type="button"
                          onClick={goPrevImage}
                          aria-label="이전 이미지"
                          className="absolute top-1/2 left-1 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white/80 hover:text-white"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={goNextImage}
                          aria-label="다음 이미지"
                          className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white/80 hover:text-white"
                        >
                          <ChevronLeftIcon className="h-5 w-5 rotate-180" />
                        </button>

                        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1.5">
                          {/* 이미지가 정확히 2장이면 offset 1, 2가 같은(현재)
                          이미지를 가리켜 미리보기가 중복된다 — 남은 이미지
                          수만큼만 슬롯을 만든다. */}
                          {Array.from(
                            { length: Math.min(2, galleryImages.length - 1) },
                            (_, i) => i + 1,
                          ).map((offset) => {
                            const previewIndex =
                              (galleryIndex + offset) % galleryImages.length;
                            const previewImage = galleryImages[previewIndex];
                            return (
                              <button
                                key={`${previewImage.src}-${offset}`}
                                type="button"
                                onClick={() => setGalleryIndex(previewIndex)}
                                aria-label={`다음 이미지로 이동: ${previewImage.alt}`}
                                className="h-8 w-8 overflow-hidden rounded opacity-80 ring-1 ring-white/50 transition-opacity hover:opacity-100"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={previewImage.src}
                                  alt={previewImage.alt}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className={cn("text-xs text-white/60", "tablet:text-sm")}
                    >
                      {ALBUM_TYPE_SHORT_LABEL[album.album_type]}
                      {album.album_number}집 · {album.title_ko}
                    </p>
                    <p
                      className={cn(
                        "text-xl font-semibold text-white",
                        "tablet:text-2xl",
                      )}
                    >
                      {album.title}
                    </p>
                    <p
                      className={cn("text-xs text-white/60", "tablet:text-sm")}
                    >
                      {album.title_en}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-sm text-white/60",
                        "tablet:text-base",
                      )}
                    >
                      {album.release_date}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeDrawer}
                    aria-label="닫기"
                    className="-m-2 shrink-0 p-2 text-white/60 transition-colors hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <ul className="mt-4 flex flex-col gap-1">
                  {album.songs.length === 0 ? (
                    <li
                      className={cn(
                        "text-base text-white/60",
                        "tablet:text-lg",
                      )}
                    >
                      수록곡 정보가 없습니다.
                    </li>
                  ) : (
                    album.songs.map((song) => (
                      <li
                        key={song.id}
                        className={cn(
                          "flex items-center gap-2 text-base text-white/70",
                          "tablet:text-lg",
                        )}
                      >
                        <span>
                          {song.title}
                          <span className="ml-2 text-white/60">
                            {song.title_ko}
                          </span>
                        </span>
                        {song.music_video_url && (
                          <a
                            href={song.music_video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${song.title} 뮤직비디오`}
                            className="shrink-0 text-white/50 transition-colors hover:text-white"
                          >
                            <YouTubeIcon className="h-4 w-4" />
                          </a>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          );
        }}
      />
    </div>
  );
}
