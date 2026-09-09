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
  /**
   * 기본 썸네일 줄(전체 이미지를 한 줄로 나열)을 안 그린다 — renderTrigger로
   * 완전히 다른 모양의 진입점을 두고 싶을 때 쓴다.
   */
  hideThumbnails?: boolean;
  /**
   * hideThumbnails와 함께 써서 커스텀 진입점을 그린다. 넘겨주는 open(index)을
   * 트리거의 onClick에서 호출하면 그 인덱스부터 모달이 열리고, 그 안에서는
   * images 전체를 그대로 순환한다. 내부 썸네일 버튼과 달리 닫을 때 포커스를
   * 트리거로 자동 복귀시키지는 않는다(트리거가 임의의 커스텀 엘리먼트라 어떤
   * 걸 ref로 잡아야 할지 렌더 시점엔 알 수 없음).
   */
  renderTrigger?: (open: (index: number) => void) => React.ReactNode;
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
  hideThumbnails = false,
  renderTrigger,
}: ZoomableImageGroupProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isZoomedIn, setZoomedIn] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  // 모달을 연 썸네일 버튼 — 닫을 때 포커스를 여기로 되돌립니다.
  const triggerRef = useRef<HTMLElement | null>(null);
  const openAt = (index: number) => {
    setOpenIndex(index);
  };
  // 이미지를 드래그(모바일 스와이프 포함)해서 이전/다음으로 넘기기 위한 상태.
  // dragStartX는 포인터가 눌린 x좌표, didDragRef는 임계값을 넘는 드래그가
  // 실제로 있었는지 — 있었다면 pointerup 뒤에 이어지는 click(확대/축소
  // 토글)을 막아야 스와이프가 실수로 확대를 트리거하지 않습니다.
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

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

  // 이미지를 좌/우로 드래그(모바일 스와이프 포함)하면 이전/다음으로 넘깁니다.
  // 확대(isZoomedIn)된 상태에서는 드래그를 확대 이동(pan)으로 오해할 수
  // 있어 스와이프 넘기기를 비활성화합니다.
  const SWIPE_THRESHOLD_PX = 50;
  const handleImagePointerDown = (event: React.PointerEvent) => {
    if (isZoomedIn || !hasMultiple) return;
    dragStartXRef.current = event.clientX;
  };
  const handleImagePointerUp = (event: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    const deltaX = event.clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    didDragRef.current = true;
    if (deltaX > 0) goPrev();
    else goNext();
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
      {renderTrigger?.(openAt)}

      {!hideThumbnails &&
        images.map((image, index) => (
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
            className="fixed inset-0 z-50 flex flex-col items-center-safe overflow-auto bg-black/80 p-6 focus:outline-none"
          >
            {/* absolute가 아니라 fixed — 안내문이 길어 아래 콘텐츠가 스크롤될
                때도 닫기/이전/다음 버튼이 뷰포트 모서리에 계속 붙어있도록. */}
            {/* items-center(순수 center)면 확대된 이미지가 컨테이너보다 넓어질
                때 좌우로 똑같이 넘치는데, overflow-auto는 스크롤 시작 위치(0)
                기준 음수 방향(왼쪽) 오버플로우로는 스크롤이 닿지 않아 왼쪽
                절반이 영영 안 보이게 됩니다(오른쪽은 스크롤 가능 영역에
                포함돼 끝까지 갈 수 있는 것과 비대칭). safe center는 오버플로우가
                생기면 자동으로 start 정렬로 물러나 전체가 스크롤로 닿게 해주고,
                안 넘칠 땐 평소처럼 중앙 정렬을 유지합니다. */}
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
                {/* 태블릿 이상: 화면 좌우 모서리에 고정. */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goPrev();
                  }}
                  aria-label="이전 이미지"
                  className="tablet:flex fixed top-1/2 left-4 hidden -translate-y-1/2 p-2 text-white/60 hover:text-white"
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
                  className="tablet:flex fixed top-1/2 right-4 hidden -translate-y-1/2 p-2 text-white/60 hover:text-white"
                >
                  <ChevronLeftIcon className="h-8 w-8 rotate-180" />
                </button>
                <span className="tablet:block fixed bottom-4 left-1/2 hidden -translate-x-1/2 font-mono text-xs text-white/50">
                  {openIndex! + 1} / {images.length}
                </span>

                {/* 모바일: 화면 좌우는 스와이프로 대체하고, 버튼은 이미지 아래
                    한 줄(이전 · 카운터 · 다음)로 모아 엄지로 누르기 쉽게. */}
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="tablet:hidden fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4"
                >
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="이전 이미지"
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <span className="font-mono text-xs text-white/50">
                    {openIndex! + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="다음 이미지"
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <ChevronLeftIcon className="h-6 w-6 rotate-180" />
                  </button>
                </div>
              </>
            )}

            {/* justify-center 대신 my-auto로 중앙 정렬 — 콘텐츠(이미지+설명)가
                뷰포트보다 커지면 justify-center는 위쪽이 화면 밖으로 밀려나
                스크롤해도 안 보이게 되는데, my-auto는 그 경우 0으로 줄어들어
                위에서부터 자연스럽게 스크롤됩니다. */}
            <div className="tablet:px-16 my-auto flex flex-col items-center gap-3 px-4 py-6">
              {/* aria-label을 img가 아니라 button에 둡니다 — img에 직접
                  aria-label을 주면 접근성 이름 계산에서 alt(사진 설명)를
                  완전히 덮어써버려, 정작 스크린리더가 사진 내용을 못 읽게
                  됩니다. alt는 그대로 사진 설명으로 남기고, 버튼 라벨에
                  "확대/축소" 동작과 사진 설명을 함께 담습니다. */}
              <button
                type="button"
                onPointerDown={handleImagePointerDown}
                onPointerUp={handleImagePointerUp}
                onClick={(event) => {
                  event.stopPropagation();
                  if (didDragRef.current) {
                    // 드래그(스와이프)로 이미 넘겼으면, 뒤이어 발생하는
                    // click까지 확대/축소로 처리하지 않도록 한 번 건너뜁니다.
                    didDragRef.current = false;
                    return;
                  }
                  setZoomedIn((prev) => !prev);
                }}
                aria-label={`${current.alt} — ${isZoomedIn ? "축소" : "확대"}`}
                // 평소엔 스와이프 넘기기(JS)가 제스처를 온전히 받아야 해서
                // 브라우저 네이티브 처리를 끈다. 확대 중엔 반대로 — 넘기기
                // 로직은 이미 꺼져 있고(handleImagePointerDown 참고), 오히려
                // 뷰포트보다 커진 이미지를 좌우로 훑어볼 수 있어야 하므로
                // 부모(다이얼로그)의 overflow-auto가 실제로 스크롤하도록
                // 네이티브 터치/휠 처리를 그대로 둔다.
                style={{ touchAction: isZoomedIn ? "auto" : "none" }}
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
                      : "tablet:max-w-[90vw] max-h-[75vh] w-auto max-w-[50vw] cursor-zoom-in",
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

              {hasMultiple && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="mt-1 flex items-center gap-2"
                >
                  {[1, 2].map((offset) => {
                    const previewIndex = (openIndex! + offset) % images.length;
                    const previewImage = images[previewIndex];
                    return (
                      <button
                        key={`${previewImage.src}-${offset}`}
                        type="button"
                        onClick={() => {
                          setZoomedIn(false);
                          setOpenIndex(previewIndex);
                        }}
                        aria-label={`다음 이미지로 이동: ${previewImage.alt}`}
                        className="overflow-hidden rounded-md opacity-60 ring-1 ring-white/20 transition-opacity hover:opacity-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewImage.src}
                          alt={previewImage.alt}
                          className="h-14 w-14 object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
