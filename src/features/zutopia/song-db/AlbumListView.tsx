"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import {
  ZoomableImageGroup,
  type ZoomableImageGroupItem,
} from "@/components/ZoomableImageGroup";
import {
  ALBUM_TYPE_ORDER,
  ALBUM_TYPE_SECTION_LABEL,
  ALBUM_TYPE_SHORT_LABEL,
} from "./labels";
import type { AlbumGroupBy, AlbumWithSongs } from "./types";

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
 * 순서, "year"는 데뷔년도가 위로 오도록 오름차순이다. albums는 이미
 * data.ts에서 release_date 오름차순으로 오므로, year 그룹은 Map에 먼저
 * 등장하는 순서(=오래된 연도부터)를 그대로 쓰면 된다.
 */
function groupAlbums(
  albums: AlbumWithSongs[],
  groupBy: AlbumGroupBy,
): AlbumGroup[] {
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
    return [...byYear.entries()].map(([year, list]) => ({
      key: year,
      label: `${year}년`,
      albums: list,
    }));
  }

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
  return orderedKeys.map((key) => ({
    key,
    label: isAlbumTypeKey(key) ? ALBUM_TYPE_SECTION_LABEL[key] : key,
    albums: byType.get(key) ?? [],
  }));
}

// 카드마다 살짝 다른 기울기/높이를 줘서 "서랍장에 나란히 꽂힌" 느낌을 낸다 —
// index % 3 기준으로 3가지 패턴을 순환시켜 완전히 균일하게 반복되지 않게 한다.
const SHELF_TILT = ["-rotate-2", "rotate-1", "-rotate-1"];
const SHELF_LEAN = ["translate-y-0", "-translate-y-1.5", "translate-y-1"];

function getAlbumHoverParts(album: AlbumWithSongs): {
  prefix: string | null;
  title: string;
} {
  const typeLabel = album.album_type
    ? ALBUM_TYPE_SHORT_LABEL[album.album_type]
    : null;
  const numberLabel = album.album_number ? `${album.album_number}집` : null;
  const prefix = [typeLabel, numberLabel].filter(Boolean).join(" ") || null;
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
 * 상세 패널 캐러셀에 들어갈 전체 이미지 목록 — cover_image_url + 부클릿
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

export function AlbumListView({
  albums,
  groupBy,
  showBookCover,
}: {
  albums: AlbumWithSongs[];
  groupBy: AlbumGroupBy;
  showBookCover: boolean;
}) {
  const [selected, setSelected] = useState<AlbumWithSongs | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  // pointerup에서 드래그(스와이프)가 임계값을 넘었으면 true — 뒤이어 발생하는
  // click까지 "확대 보기 모달 열기"로 처리하지 않도록 한 번 건너뛴다.
  const didDragRef = useRef(false);
  // 선택된 앨범의 썸네일 버튼 — 선택 시 그 위치로 스크롤하기 위해 잡아둔다.
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selected) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  // block: "start"로 상세 패널이 아래에 펼쳐질 공간을 확보한다 — "nearest"를
  // 쓰면 화면 아래쪽 앨범을 선택했을 때 버튼이 뷰포트 하단에 붙어버려 정작
  // 방금 펼쳐진 패널은 더 안 보이게 된다.
  // 상세 패널은 grid-template-rows로 0→1fr 펼쳐지는 애니메이션(아래
  // duration-300과 동일한 시간)이 있어서, 그게 끝나기 전에 스크롤하면
  // 아직 다 안 늘어난 스크롤 가능 영역 기준으로 목표 위치가 잘려버린다.
  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => {
      selectedButtonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [selected]);

  // cover_image_url + book_image_urls를 항상 통째로 넣는다. showBookCover가
  // 켜져 있으면 이 함수가 이미 cover_image_url을 맨 뒤로 옮겨두므로, 캐러셀은
  // 그냥 0번부터 시작하면 book_image_urls[0]이 자동으로 먼저 보인다.
  const galleryImages = selected
    ? getAlbumGalleryImages(selected, showBookCover)
    : [];

  // 앨범을 바꾸거나 마도서 버전 토글을 바꾸면 이미지 순서가 통째로 달라지므로,
  // 미니 캐러셀은 항상 0번부터 다시 시작한다. useEffect가 아니라 렌더 중
  // 비교(React가 권장하는 "prop 변화에 맞춰 state 조정" 패턴)로 처리해서
  // 불필요한 추가 렌더 한 번을 건너뛴다.
  const selectionKey = selected ? `${selected.id}:${showBookCover}` : null;
  const prevSelectionKeyRef = useRef(selectionKey);
  if (prevSelectionKeyRef.current !== selectionKey) {
    prevSelectionKeyRef.current = selectionKey;
    if (galleryIndex !== 0) setGalleryIndex(0);
  }

  if (albums.length === 0) {
    return (
      <p className="text-sm text-white/50">아직 등록된 앨범이 없습니다.</p>
    );
  }

  const groups = groupAlbums(albums, groupBy);
  const selectedGroupKey = selected
    ? groupBy === "year"
      ? albumYear(selected)
      : (selected.album_type ?? "기타")
    : null;
  const hasGalleryMultiple = galleryImages.length > 1;

  const goPrevImage = () => {
    setGalleryIndex(
      (index) => (index - 1 + galleryImages.length) % galleryImages.length,
    );
  };
  const goNextImage = () => {
    setGalleryIndex((index) => (index + 1) % galleryImages.length);
  };

  const GALLERY_SWIPE_THRESHOLD_PX = 40;
  const handleGalleryPointerDown = (event: React.PointerEvent) => {
    if (!hasGalleryMultiple) return;
    dragStartXRef.current = event.clientX;
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
    <div className="flex flex-col gap-8">
      {groups.map((group) => {
        const isSectionOpen = selectedGroupKey === group.key;

        return (
          <section key={group.key}>
            <p className="font-mono text-base font-semibold tracking-[0.2em] text-white/70 uppercase">
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
                    ref={isSelected ? selectedButtonRef : undefined}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : album)}
                    aria-expanded={isSelected}
                    aria-label={prefix ? `${prefix} ${title}` : title}
                    className={cn(
                      "group relative h-28 w-28 cursor-help",
                      "tablet:h-44 tablet:w-44",
                      "transition-[transform,filter] duration-500 ease-in-out",
                      SHELF_TILT[index % SHELF_TILT.length],
                      SHELF_LEAN[index % SHELF_LEAN.length],
                      "tablet:hover:z-70 tablet:hover:rotate-0 tablet:hover:-translate-y-6 tablet:hover:scale-110 tablet:hover:brightness-110",
                      isSelected && "z-60 rotate-0",
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
                        "pointer-events-none absolute top-full left-1/2 mt-1 flex w-max max-w-40 -translate-x-1/2 translate-y-1 flex-col items-center opacity-0",
                        "rounded-lg bg-black/85 px-3 py-1.5 text-xs text-white",
                        "transition-[opacity,transform] duration-300 ease-out",
                        "tablet:group-hover:translate-y-0 tablet:group-hover:opacity-100",
                      )}
                    >
                      {prefix && (
                        <span className="text-white/60">{prefix}</span>
                      )}
                      <span>{title}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isSectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                {selected && isSectionOpen && (
                  <div
                    className={cn(
                      "flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/30",
                      "tablet:flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "relative h-56 w-full shrink-0 p-3",
                        "tablet:h-120 tablet:w-fit tablet:p-12",
                      )}
                    >
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
                                className="tablet:items-center tablet:justify-center flex h-full w-full cursor-zoom-in"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={galleryImages[galleryIndex].src}
                                  alt={galleryImages[galleryIndex].alt}
                                  className="tablet:h-3/4 aspect-square h-2/3 w-full object-contain"
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
                                {[1, 2].map((offset) => {
                                  const previewIndex =
                                    (galleryIndex + offset) %
                                    galleryImages.length;
                                  const previewImage =
                                    galleryImages[previewIndex];
                                  return (
                                    <button
                                      key={`${previewImage.src}-${offset}`}
                                      type="button"
                                      onClick={() =>
                                        setGalleryIndex(previewIndex)
                                      }
                                      aria-label={`다음 이미지로 이동: ${previewImage.alt}`}
                                      className={cn(
                                        "h-8 w-8 overflow-hidden rounded opacity-80 ring-1 ring-white/50 transition-opacity hover:opacity-100",
                                        "tablet:h-12 tablet:w-12",
                                      )}
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

                    <div className="min-w-0 flex-1 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            {selected.album_type
                              ? `[${ALBUM_TYPE_SHORT_LABEL[selected.album_type]}${selected.album_number ? ` ${selected.album_number}집` : ""}] `
                              : ""}
                            {selected.title}
                          </p>
                          {selected.title_ko && (
                            <p className="mt-1 text-sm text-white/50">
                              {selected.title_ko}
                            </p>
                          )}
                          <p className="mt-1 font-mono text-xs text-white/40">
                            {selected.release_date}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelected(null)}
                          aria-label="닫기"
                          className="shrink-0 text-white/60 transition-colors hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <ul className="mt-4 flex flex-col gap-1">
                        {selected.songs.length === 0 ? (
                          <li className="text-sm text-white/40">
                            수록곡 정보가 없습니다.
                          </li>
                        ) : (
                          selected.songs.map((song) => (
                            <li key={song.id} className="text-sm text-white/70">
                              {song.title}
                              {song.title_ko && (
                                <span className="ml-2 text-white/40">
                                  {song.title_ko}
                                </span>
                              )}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
