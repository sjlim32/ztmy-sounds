"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { SiteLink } from "@/components/SiteLink";

export type ThumbnailCrop = "center" | "top" | "bottom";

// ZoomableImageGroup(같은 섹션 안 이미지를 좌/우로 넘겨보는 갤러리 버전)도
// 같은 썸네일 규칙을 씁니다.
export const THUMBNAIL_CROP_CLASS: Record<ThumbnailCrop, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
};

export const DEFAULT_THUMBNAIL_SIZE = 160;

/**
 * 확대(원본 크기)로 바뀌는 순간 모달 스크롤을 가운데로 맞춘다 — 안 그러면
 * 이미지가 중앙에서 커지는 게 아니라 왼쪽 위 모서리가 고정된 채 커져서,
 * 사용자가 누른 가운데 부분이 화면 밖으로 밀려난다. 페인트 전에 맞추려고
 * layout effect를 쓴다. ZoomableImageGroup도 같이 쓴다.
 */
export function useCenterScrollOnZoom(
  containerRef: RefObject<HTMLElement | null>,
  isZoomedIn: boolean,
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!isZoomedIn || !container) return;
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
  }, [containerRef, isZoomedIn]);
}

interface ZoomableImageProps {
  src: string;
  alt: string;
  /** 모달에서 원본 크기로 보여줄 때 쓰는 실제 이미지 크기. 없으면 이미지 자체의 크기로 표시됩니다. */
  width?: number;
  height?: number;
  /** 목록에 노출할 썸네일 크기. 없으면 160x160으로 표시됩니다. */
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  /** 썸네일 비율이 원본과 달라 잘릴 때 기준점 (기본값: 중앙) */
  thumbnailCrop?: ThumbnailCrop;
  caption?: string;
  sourceHref?: string;
  sourceLabel?: string;
}

/**
 * mdx 안에서 쓰는 클릭 가능한 이미지. 평소엔 썸네일 크기로 보이다가
 * 클릭하면 원본 크기(뷰포트에 맞게 축소)로 보는 모달이 뜹니다.
 */
export function ZoomableImage({
  src,
  alt,
  width,
  height,
  thumbnailWidth,
  thumbnailHeight,
  thumbnailCrop = "center",
  caption,
  sourceHref,
  sourceLabel,
}: ZoomableImageProps) {
  const [isOpen, setOpen] = useState(false);
  const [isZoomedIn, setZoomedIn] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useCenterScrollOnZoom(dialogRef, isZoomedIn);

  const closeModal = () => {
    setOpen(false);
    setZoomedIn(false);
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

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-block cursor-zoom-in rounded-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- width/height 중 하나만 있을 때도 자연스러운 비율로 보여야 해서 next/image의 필수 width/height 제약을 피함 */}
        <img
          src={src}
          alt={alt}
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

      {isOpen &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            onClick={closeModal}
            className="fixed inset-0 z-50 flex flex-col overflow-auto bg-black/80 p-6"
          >
            {/* absolute가 아니라 fixed — 안내문이 길어 아래 콘텐츠가 스크롤될
                때도 닫기 버튼이 뷰포트 모서리에 계속 붙어있도록. */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="닫기"
              className="fixed top-4 right-4 text-white/60 hover:text-white"
            >
              <CloseIcon className="h-6 w-6" />
            </button>

            {/* items-center/justify-center 대신 m-auto로 중앙 정렬 — 확대된
                이미지가 뷰포트보다 커지면 center 정렬은 위·왼쪽으로도 넘쳐
                그쪽은 스크롤로 닿지 않는다(모바일에서 왼쪽이 잘리던 원인).
                auto margin은 넘칠 때 0이 되어 왼쪽 위부터 전부 스크롤된다.
                같은 효과의 safe center(items-center-safe)는 구형 iOS Safari가
                지원하지 않아 쓰지 않는다. */}
            <div className="m-auto flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- width/height가 없으면 이미지 자체의 크기를 그대로 써야 해서 next/image의 필수 width/height 제약을 피함 (어차피 output:export라 next/image 최적화는 꺼져있음) */}
              <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                onClick={(event) => {
                  event.stopPropagation();
                  setZoomedIn((prev) => !prev);
                }}
                className={cn(
                  "rounded-lg object-contain",
                  isZoomedIn
                    ? "w-auto max-w-none cursor-zoom-out"
                    : "max-h-[75vh] w-auto max-w-[90vw] cursor-zoom-in",
                )}
              />

              {(caption || sourceHref) && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="max-w-[90vw] text-center text-sm text-white/80"
                >
                  {caption && <p className="whitespace-pre-line">{caption}</p>}
                  {sourceHref && (
                    <SiteLink href={sourceHref} className="mt-1 inline-block">
                      {sourceLabel ?? sourceHref}
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
