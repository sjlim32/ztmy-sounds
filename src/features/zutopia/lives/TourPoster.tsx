"use client";

import { ViewTransition } from "react";
import { ThumbImage } from "@/components/ThumbImage";
import { ZoomableImageGroup } from "@/components/ZoomableImageGroup";
import { FOCUS_RING } from "@/components/button-styles";
import { cn } from "@/lib/utils";
import { posterTransitionName } from "@/features/zutopia/lives/poster-transition";

/**
 * 투어 상세 머리의 포스터 — 3:4 고정 상자(모바일 84×112px, PC 96×128px)에 잘라 채워
 * 포스터 비율과 상관없이 머리 높이가 같다. 눌러서 원본(ZoomableImageGroup 모달). 확대
 * 트리거가 함수라 서버 컴포넌트(DefaultTourContent)에서 바로 못 넘겨 따로 둔다.
 */
export function TourPoster({
  src,
  alt,
  slug,
}: {
  src: string;
  alt: string;
  slug: string;
}) {
  return (
    <ZoomableImageGroup
      images={[{ src, alt }]}
      hideThumbnails
      renderTrigger={(open) => (
        <button
          type="button"
          onClick={() => open(0)}
          aria-label={`${alt} 포스터 크게 보기`}
          className={cn(
            "rounded-card relative block aspect-[3/4] w-21 shrink-0 cursor-zoom-in overflow-hidden bg-white/5",
            "pc:w-24",
            FOCUS_RING,
          )}
        >
          {/* 목록 카드 그림과 같은 이름 — 목록에서 들어올 때 그 그림이 이 자리로 이어진다. */}
          <ViewTransition
            name={posterTransitionName(slug)}
            share="morph"
            default="none"
          >
            {/* 화면 폭별로 줄인 포스터(srcset) — 원본보다 큰 후보는 원본 크기로 온다. */}
            <ThumbImage
              src={src}
              displayWidth={240}
              loading="eager"
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </ViewTransition>
        </button>
      )}
    />
  );
}
