"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { SiteLink } from "@/components/SiteLink";
import {
  THUMBNAIL_CROP_CLASS,
  DEFAULT_THUMBNAIL_SIZE,
  type ThumbnailCrop,
} from "@/components/ZoomableImage";

export interface ZoomableImageGroupItem {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
  sourceHref?: string;
  sourceLabel?: string;
}

interface ZoomableImageGroupProps {
  images: ZoomableImageGroupItem[];
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  thumbnailCrop?: ThumbnailCrop;
}

/**
 * ZoomableImage의 갤러리 버전 — 같은 섹션 안 이미지들을 하나의 모달에서
 * 좌/우(←/→ 키, 화면 양옆 버튼)로 넘겨보게 합니다. ZoomableImage는 이미지마다
 * 독립된 모달을 각자 열고 닫아서 옆 이미지 개념이 없는데, 여기서는 "지금 몇
 * 번째가 열려있는지" 인덱스 하나를 모든 썸네일이 공유합니다.
 */
export function ZoomableImageGroup({
  images,
  thumbnailWidth,
  thumbnailHeight,
  thumbnailCrop = "center",
}: ZoomableImageGroupProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isZoomedIn, setZoomedIn] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  // 모달을 연 썸네일 버튼 — 닫을 때 포커스를 여기로 되돌립니다.
  const triggerRef = useRef<HTMLElement | null>(null);

  const closeModal = () => {
    setOpenIndex(null);
    setZoomedIn(false);
  };
  const goPrev = () => {
    setZoomedIn(false);
    setOpenIndex((index) =>
      index === null ? null : (index - 1 + images.length) % images.length,
    );
  };
  const goNext = () => {
    setZoomedIn(false);
    setOpenIndex((index) =>
      index === null ? null : (index + 1) % images.length,
    );
  };

  // 둘 다 지정 → 그 크기로 크롭. 하나만 지정 → 나머지는 auto로 비율
  // 유지하며 크롭 없이 전체 표시. 둘 다 없음 → 기본 정사각형 크롭.
  let resolvedThumbnailWidth: number | undefined;
  let resolvedThumbnailHeight: number | undefined;
  let cropThumbnail: boolean;

  if (thumbnailWidth !== undefined && thumbnailHeight !== undefined) {
    resolvedThumbnailWidth = thumbnailWidth;
    resolvedThumbnailHeight = thumbnailHeight;
    cropThumbnail = true;
  } else if (thumbnailWidth !== undefined || thumbnailHeight !== undefined) {
    resolvedThumbnailWidth = thumbnailWidth;
    resolvedThumbnailHeight = thumbnailHeight;
    cropThumbnail = false;
  } else {
    resolvedThumbnailWidth = DEFAULT_THUMBNAIL_SIZE;
    resolvedThumbnailHeight = DEFAULT_THUMBNAIL_SIZE;
    cropThumbnail = true;
  }

  const isOpen = openIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    // 모달이 열리는 순간의 포커스를 기억해뒀다가, 닫히면(effect cleanup)
    // 원래 있던 곳(연 썸네일 버튼)으로 되돌립니다. openIndex가 아니라 isOpen
    // (열림/닫힘 여부)에만 의존해야 합니다 — openIndex에 의존하면 모달을 연
    // 채로 이전/다음 이미지만 넘겨도 매번 effect가 재실행되어, 방금 누른
    // "다음 이미지" 버튼에서 포커스가 순간적으로 트리거 썸네일로 빠졌다가
    // 다이얼로그로 돌아오는 불필요한 포커스 이동이 매 탐색마다 발생합니다.
    const previouslyFocused = triggerRef.current;
    dialogRef.current?.focus();

    const getFocusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Tab") {
        // 포커스 트랩 — Tab이 모달 밖(뒤에 있는 페이지)으로 빠져나가지 않도록
        // 마지막/처음 요소에서 반대편으로 되돌립니다.
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goPrev/goNext/closeModal은 매 렌더 재생성되지만 images.length에만 의존해 isOpen 변경 시에만 재등록하면 충분
  }, [isOpen]);

  const current = openIndex !== null ? images[openIndex] : null;
  const hasMultiple = images.length > 1;

  return (
    <>
      {images.map((image, index) => (
        <button
          key={image.src}
          type="button"
          onClick={(event) => {
            triggerRef.current = event.currentTarget;
            setOpenIndex(index);
          }}
          className="inline-block cursor-zoom-in rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- width/height 중 하나만 있을 때도 자연스러운 비율로 보여야 해서 next/image의 필수 width/height 제약을 피함 */}
          <img
            src={image.src}
            alt={image.alt}
            width={resolvedThumbnailWidth}
            height={resolvedThumbnailHeight}
            style={{
              width: resolvedThumbnailWidth,
              height: resolvedThumbnailHeight,
            }}
            className={cn(
              "max-tablet:h-auto! max-tablet:w-full! rounded-lg",
              cropThumbnail
                ? cn("object-cover", THUMBNAIL_CROP_CLASS[thumbnailCrop])
                : "h-auto w-auto",
            )}
          />
        </button>
      ))}

      {current &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt || "이미지 확대 보기"}
            tabIndex={-1}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex flex-col items-center overflow-auto bg-black/80 p-6 focus:outline-none"
          >
            {/* absolute가 아니라 fixed — 안내문이 길어 아래 콘텐츠가 스크롤될
                때도 닫기/이전/다음 버튼이 뷰포트 모서리에 계속 붙어있도록. */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="닫기"
              className="fixed top-4 right-4 text-white/60 hover:text-white"
            >
              <CloseIcon className="h-6 w-6" />
            </button>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goPrev();
                  }}
                  aria-label="이전 이미지"
                  className="fixed top-1/2 left-2 -translate-y-1/2 p-2 text-white/60 hover:text-white tablet:left-4"
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goNext();
                  }}
                  aria-label="다음 이미지"
                  className="fixed top-1/2 right-2 -translate-y-1/2 p-2 text-white/60 hover:text-white tablet:right-4"
                >
                  <ChevronLeftIcon className="h-8 w-8 rotate-180" />
                </button>

                <span className="fixed bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/50">
                  {openIndex! + 1} / {images.length}
                </span>
              </>
            )}

            {/* justify-center 대신 my-auto로 중앙 정렬 — 콘텐츠(이미지+설명)가
                뷰포트보다 커지면 justify-center는 위쪽이 화면 밖으로 밀려나
                스크롤해도 안 보이게 되는데, my-auto는 그 경우 0으로 줄어들어
                위에서부터 자연스럽게 스크롤됩니다. */}
            <div className="my-auto flex flex-col items-center gap-3">
              {/* aria-label을 img가 아니라 button에 둡니다 — img에 직접
                  aria-label을 주면 접근성 이름 계산에서 alt(사진 설명)를
                  완전히 덮어써버려, 정작 스크린리더가 사진 내용을 못 읽게
                  됩니다. alt는 그대로 사진 설명으로 남기고, 버튼 라벨에
                  "확대/축소" 동작과 사진 설명을 함께 담습니다. */}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setZoomedIn((prev) => !prev);
                }}
                aria-label={`${current.alt} — ${isZoomedIn ? "축소" : "확대"}`}
                className="block rounded-lg border-0 bg-transparent p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- width/height가 없으면 이미지 자체의 크기를 그대로 써야 해서 next/image의 필수 width/height 제약을 피함 (어차피 output:export라 next/image 최적화는 꺼져있음) */}
                <img
                  src={current.src}
                  alt={current.alt}
                  width={current.width}
                  height={current.height}
                  className={cn(
                    "rounded-lg object-contain",
                    isZoomedIn
                      ? "w-auto max-w-none cursor-zoom-out"
                      : "max-h-[75vh] w-auto max-w-[90vw] cursor-zoom-in",
                  )}
                />
              </button>

              {(current.caption || current.sourceHref) && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="max-w-[90vw] text-center text-sm text-white/80"
                >
                  {current.caption && (
                    <p className="whitespace-pre-line">{current.caption}</p>
                  )}
                  {current.sourceHref && (
                    <SiteLink
                      href={current.sourceHref}
                      className="mt-1 inline-block"
                    >
                      {current.sourceLabel ?? current.sourceHref}
                    </SiteLink>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
