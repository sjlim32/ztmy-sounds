"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";

type ThumbnailCrop = "center" | "top" | "bottom";

const THUMBNAIL_CROP_CLASS: Record<ThumbnailCrop, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
};

interface NoticeImageProps {
  src: string;
  alt: string;
  /** 모달에서 원본 크기로 보여줄 때 쓰는 실제 이미지 크기 */
  width: number;
  height: number;
  /** 목록에 노출할 썸네일 크기 */
  thumbnailWidth: number;
  thumbnailHeight: number;
  /** 썸네일 비율이 원본과 달라 잘릴 때 기준점 (기본값: 중앙) */
  thumbnailCrop?: ThumbnailCrop;
  caption?: string;
  sourceHref?: string;
  sourceLabel?: string;
}

/**
 * 안내문 mdx 안에서 쓰는 클릭 가능한 이미지. 평소엔 썸네일 크기로 보이다가
 * 클릭하면 원본 크기(뷰포트에 맞게 축소)로 보는 모달이 뜹니다.
 */
export function NoticeImage({
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
}: NoticeImageProps) {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
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
        <Image
          src={src}
          alt={alt}
          width={thumbnailWidth}
          height={thumbnailHeight}
          style={{ width: thumbnailWidth, height: thumbnailHeight }}
          className={cn(
            "max-w-none rounded-lg object-cover",
            THUMBNAIL_CROP_CLASS[thumbnailCrop],
          )}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 p-6"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <CloseIcon className="h-6 w-6" />
            </button>

            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[75vh] w-auto max-w-[90vw] rounded-lg object-contain"
            />

            {(caption || sourceHref) && (
              <div
                onClick={(event) => event.stopPropagation()}
                className="max-w-[90vw] text-center text-sm text-white/80"
              >
                {caption && <p className="whitespace-pre-line">{caption}</p>}
                {sourceHref && (
                  <a
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-white/50 hover:text-white/80"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    {sourceLabel ?? sourceHref}
                  </a>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
