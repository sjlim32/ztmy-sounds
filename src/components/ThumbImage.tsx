"use client";

import { useState } from "react";
import { thumbSrc, thumbSrcSet } from "@/lib/thumb";

/**
 * 작은 자리에 쓰는 이미지 — R2·`/assets/` 이미지는 Cloudflare 변환으로 줄인 주소
 * (thumbSrc)를 쓰고, 변환이 실패하면(설정이 꺼졌거나 한도 초과, 개발 서버) 한 번만
 * 원본 주소로 돌아간다. displayWidth는 화면에 보이는 가장 큰 폭(px).
 * `sizes`를 주면 화면 폭별 후보(srcset)도 붙여, 좁은 화면은 더 작은 파일을 받는다.
 */
export function ThumbImage({
  src,
  displayWidth,
  sizes,
  alt = "",
  className,
  loading = "lazy",
  draggable,
  width,
  height,
  style,
}: {
  src: string;
  displayWidth: number;
  sizes?: string;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  // 같은 자리에서 그림만 바뀌면(key 없이 다시 그려질 때) 앞 그림의 실패를 잊는다.
  const [failedSrc, setFailedSrc] = useState(src);
  if (failedSrc !== src) {
    setFailedSrc(src);
    setFailed(false);
  }
  const resized = thumbSrc(src, displayWidth);
  const srcSet = sizes ? thumbSrcSet(src, displayWidth) : null;
  const fallBack = () => {
    if (!failed && resized !== src) setFailed(true);
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element -- output: export라 next/image 최적화가 없다
    <img
      src={failed ? src : resized}
      srcSet={failed || !srcSet ? undefined : srcSet}
      sizes={failed || !srcSet ? undefined : sizes}
      alt={alt}
      loading={loading}
      draggable={draggable}
      width={width}
      height={height}
      style={style}
      className={className}
      // 정적 HTML의 그림은 React가 붙기 전에 이미 실패했을 수 있다 — 그 error
      // 이벤트는 다시 오지 않으니 붙는 순간 확인한다(개발 서버엔 /cdn-cgi/가 없음).
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0 && img.currentSrc)
          fallBack();
      }}
      onError={fallBack}
    />
  );
}
