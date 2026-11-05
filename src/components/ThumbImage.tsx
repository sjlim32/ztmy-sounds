"use client";

import { useState } from "react";
import { thumbSrc } from "@/lib/thumb";

/**
 * 작은 자리에 쓰는 이미지 — R2 이미지는 Cloudflare 변환으로 줄인 주소(thumbSrc)를
 * 쓰고, 변환이 실패하면(설정이 꺼졌거나 한도 초과) 한 번만 원본 주소로 돌아간다.
 * displayWidth는 화면에 보이는 가장 큰 폭(px).
 */
export function ThumbImage({
  src,
  displayWidth,
  alt = "",
  className,
  loading = "lazy",
  draggable,
}: {
  src: string;
  displayWidth: number;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  draggable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resized = thumbSrc(src, displayWidth);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- output: export라 next/image 최적화가 없다
    <img
      src={failed ? src : resized}
      alt={alt}
      loading={loading}
      draggable={draggable}
      className={className}
      onError={() => {
        if (!failed && resized !== src) setFailed(true);
      }}
    />
  );
}
