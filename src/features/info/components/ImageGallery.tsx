"use client";

import { cn } from "@/lib/utils";
import {
  ZoomableImageGroup,
  type ZoomableImageGroupItem,
} from "@/components/ZoomableImageGroup";

interface ImageGalleryProps {
  images: ZoomableImageGroupItem[];
  /**
   * 모바일 배치. "stack"은 세로로 한 장씩, "swipe"는 한 줄에 놓고 옆으로
   * 넘긴다 — 장수가 많은 섹션을 세로로 쌓으면 페이지가 너무 길어져서.
   */
  mobile?: "stack" | "swipe";
  /** swipe일 때 이미지 높이 클래스. 폭은 비율대로 정해진다. */
  swipeHeightClassName?: string;
  /** 태블릿 이상 그리드 열 수 등 (`tablet:grid-cols-4 pc:grid-cols-5`). */
  className?: string;
  /** 특정 칸만 여러 행/열을 차지하게 할 때, 이미지 순서대로. */
  itemClassNames?: (string | undefined)[];
}

/**
 * 공연 정보의 이미지 묶음 — 태블릿 이상은 그리드로 여러 장을 한눈에 보이고,
 * 어느 걸 눌러도 같은 확대 뷰(ZoomableImageGroup)에서 묶음 전체를 넘겨 본다.
 */
export function ImageGallery({
  images,
  mobile = "stack",
  swipeHeightClassName = "h-96",
  className,
  itemClassNames,
}: ImageGalleryProps) {
  const isSwipe = mobile === "swipe";

  return (
    <div className="flex flex-col gap-2">
      <ZoomableImageGroup
        images={images}
        hideThumbnails
        renderTrigger={(open) => (
          <div
            className={cn(
              isSwipe
                ? // -mx-3 px-3: 페이지 좌우 여백(px-3)까지 줄을 넓혀 화면 끝에서 잘려 보이게
                  "-mx-3 flex snap-x snap-proximity scrollbar-none gap-3 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden"
                : "flex flex-col gap-3",
              "tablet:mx-0 tablet:grid tablet:items-start tablet:overflow-visible tablet:px-0",
              className,
            )}
          >
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => open(index)}
                className={cn(
                  "cursor-zoom-in rounded-lg",
                  isSwipe && "shrink-0 snap-center",
                  itemClassNames?.[index],
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 이미지마다 비율이 달라 원본 비율 그대로 보여야 해서 next/image의 필수 width/height 제약을 피함 */}
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className={cn(
                    "rounded-lg",
                    isSwipe
                      ? // max-w-none: Preflight의 img max-width:100%가 가로 줄 안에서 폭을 눌러버림
                        cn("w-auto max-w-none", swipeHeightClassName)
                      : "h-auto w-full",
                    "tablet:h-auto tablet:w-full tablet:max-w-full",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      />

      {isSwipe && (
        <p className={cn("text-center text-xs text-white/50", "tablet:hidden")}>
          옆으로 넘겨 보세요 ({images.length}장)
        </p>
      )}
    </div>
  );
}
