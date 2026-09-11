import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { MicIcon } from "@/components/icons/MicIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import {
  ZoomableImageGroup,
  type ZoomableImageGroupItem,
} from "@/components/ZoomableImageGroup";
import { ALBUM_TYPE_SHORT_LABEL } from "@/features/zutopia/song-db/labels";
import { DrawerCloseButton } from "@/features/zutopia/song-db/components/DrawerCloseButton";
import { IconLinkButton } from "@/features/zutopia/song-db/components/IconLinkButton";
import type { AlbumWithSongs } from "@/features/zutopia/song-db/types";

/**
 * SongDbDrawer가 앨범 상세로 여는 내용 — 커버/부클릿 캐러셀, 제목, 수록곡
 * 목록, 이미지 출처.
 */
export function AlbumDetailPanel({
  album,
  showBookCover,
  galleryIndex,
  onGalleryIndexChange,
  onClose,
}: AlbumDetailPanelProps) {
  const dragStartXRef = useRef<number | null>(null);
  /**
   * pointerup에서 드래그(스와이프)가 임계값을 넘었으면 true — 뒤이어
   * 발생하는 click까지 "확대 보기 모달 열기"로 처리하지 않도록 건너뛴다.
   */
  const didDragRef = useRef(false);

  const galleryImages = getAlbumGalleryImages(album, showBookCover);
  const hasGalleryMultiple = galleryImages.length > 1;
  const imageSource = getAlbumImageSource(album);

  const goPrevImage = () => {
    onGalleryIndexChange(
      (index) => (index - 1 + galleryImages.length) % galleryImages.length,
    );
  };
  const goNextImage = () => {
    onGalleryIndexChange((index) => (index + 1) % galleryImages.length);
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
      <div className={cn("relative h-80 w-full shrink-0 p-3", "tablet:h-108")}>
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
                        onClick={() => onGalleryIndexChange(previewIndex)}
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
            <p className={cn("text-xs text-white/60", "tablet:text-sm")}>
              {ALBUM_TYPE_SHORT_LABEL[album.album_type]}
              {album.album_number}집 · {album.title_ko}
            </p>
            <p
              className={cn(
                "mt-2 text-xl font-semibold text-white",
                "tablet:text-2xl",
              )}
            >
              {album.title}
            </p>
            <p className={cn("text-xs text-white/60", "tablet:text-sm")}>
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

          <DrawerCloseButton onClick={onClose} />
        </div>

        <ul className="mt-4 flex flex-col gap-1">
          {album.songs.length === 0 ? (
            <li className={cn("text-base text-white/60", "tablet:text-lg")}>
              수록곡 정보가 없습니다.
            </li>
          ) : (
            album.songs.map((song) => (
              <li key={song.id} className="flex flex-col items-baseline">
                <div className="flex items-center gap-2 text-white">
                  <span className="w-5 shrink-0 font-mono text-xs text-white/40 tabular-nums">
                    {String(song.track_number).padStart(2, "0")}
                  </span>
                  <span>{song.title}</span>
                  {song.music_video_url && (
                    <IconLinkButton
                      href={song.music_video_url}
                      icon={YouTubeIcon}
                      label="뮤직비디오 보기"
                      tone="youtube"
                    />
                  )}
                  {song.guideHref && (
                    <IconLinkButton
                      href={song.guideHref}
                      icon={MicIcon}
                      label="샤모지 호응 가이드 이동"
                      tone="guide"
                    />
                  )}
                </div>

                <span
                  className={cn(
                    "-mt-0.5 pl-7 text-xs text-white/60",
                    "tablet:text-sm",
                  )}
                >
                  {song.title_ko}
                </span>
              </li>
            ))
          )}
        </ul>

        {imageSource && (
          <p
            className={cn(
              "mt-4 flex gap-1 truncate text-[10px] text-white/40",
              "tablet:text-xs",
            )}
          >
            <span>이미지 출처 :</span>
            <a
              href={imageSource}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/60"
            >
              {imageSource}
            </a>
          </p>
        )}
      </div>
    </>
  );
}

interface AlbumDetailPanelProps {
  album: AlbumWithSongs;
  showBookCover: boolean;
  /**
   * 갤러리 인덱스는 AlbumListView가 소유한다 — 앨범/마도서 버전을 바꾸면
   * 0으로 되돌려야 하는데, 드로어가 닫히는 슬라이드 아웃 동안(album이
   * 아직 마지막 값인 동안)은 건너뛰어야 해서 부모의 렌더 사이클에 걸쳐
   * 있어야 한다(AlbumListView 주석 참고).
   */
  galleryIndex: number;
  onGalleryIndexChange: Dispatch<SetStateAction<number>>;
  onClose: () => void;
}

function getAlbumImageSource(album: AlbumWithSongs): string | null {
  const metadata = album.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const source = (metadata as { source?: unknown }).source;
  return typeof source === "string" && source.length > 0 ? source : null;
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
