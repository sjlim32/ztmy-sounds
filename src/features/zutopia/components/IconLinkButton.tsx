import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type Tone = "youtube" | "guide" | "spotify" | "appleMusic";
type Variant = "pill" | "solid";

// variant="pill": 배경 없이 있다가 호버/포커스에만 은은하게 색이 붙는
// 기본형(유튜브 MV). guide는 행 배경이 이미 어두워 은은한 색으로는 묻혀
// 보이지 않아서, 다른 pill 톤과 달리 사이트 시그니처 그라데이션을 항상
// 꽉 채운다(홈 화면 accent 바와 동일한 배색).
const PILL_TONE_STYLES: Record<Tone, string> = {
  youtube:
    "text-white/60 hover:bg-red-500/15 hover:text-red-400 focus-visible:bg-red-500/15 focus-visible:text-red-400",
  guide:
    "bg-linear-to-br from-ztmy-purple to-ztmy-magenta text-white shadow-sm hover:brightness-110 focus-visible:brightness-110",
  spotify:
    "text-white/60 hover:bg-green-500/15 hover:text-green-400 focus-visible:bg-green-500/15 focus-visible:text-green-400",
  appleMusic:
    "text-white/60 hover:bg-pink-500/15 hover:text-pink-400 focus-visible:bg-pink-500/15 focus-visible:text-pink-400",
};

// variant="solid": 각 음원 사이트 대표색을 항상 채운 버튼(세트리스트
// 스트리밍 링크용) — pill보다 훨씬 눈에 띄어야 해서 별도 스타일셋을 둔다.
const SOLID_TONE_STYLES: Partial<Record<Tone, string>> = {
  youtube: "bg-red-500 text-white hover:bg-red-400",
  spotify: "bg-green-500 text-white hover:bg-green-400",
  appleMusic: "bg-pink-500 text-white hover:bg-pink-400",
};

// square: 아이콘만 있는 정사각형 버튼. pill: visibleLabel과 함께 쓰는,
// 텍스트 폭만큼 늘어나는 알약 모양 버튼.
const SIZE_STYLES = {
  sm: { square: "h-6 w-6", icon: "h-4 w-4", pill: "h-6 gap-1 px-2 text-xs" },
  md: {
    square: "h-7 w-7",
    icon: "h-5 w-5",
    pill: "h-7 gap-1.5 px-2.5 text-sm",
  },
  // md의 1.5배(세트리스트 스트리밍 버튼처럼 더 눈에 띄어야 할 때).
  lg: {
    square: "h-11 w-11",
    icon: "h-7 w-7",
    pill: "h-11 gap-2 px-3.5 text-base",
  },
} satisfies Record<string, { square: string; icon: string; pill: string }>;

interface IconLinkButtonProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** 접근성 레이블 + 툴팁 문구. */
  label: string;
  /**
   * 지정하면 아이콘 옆에 이 짧은 텍스트도 항상 보이는 "라벨 있는 버튼"으로
   * 렌더링한다(세트리스트 스트리밍 버튼처럼 어떤 서비스인지 바로 알아야
   * 할 때). 지정하지 않으면 기존처럼 아이콘만 있는 원/사각 버튼 + 호버
   * 시에만 뜨는 툴팁으로 렌더링한다.
   */
  visibleLabel?: string;
  tone: Tone;
  variant?: Variant;
  size?: keyof typeof SIZE_STYLES;
  /**
   * 감싸는 span에 붙는 클래스 — 반응형 노출 제어용(예: 모바일 전용
   * 인스턴스에 tablet:hidden)으로만 쓴다.
   */
  className?: string;
}

/**
 * 곡 행/공연 정보에 붙는 외부 링크 아이콘(유튜브/응원 가이드/음원 사이트)
 * 공용 버튼. 그냥 아이콘이 아니라 누를 수 있는 버튼임이 드러나도록
 * 확대/색상 전환을 주고, 브라우저 기본 title 대신 커스텀 툴팁을 붙인다
 * (AlbumListView 커버 호버 라벨과 동일한 opacity/translate 트랜지션
 * 재사용). 터치(group-active) / 마우스(tablet:group-hover) /
 * 키보드(group-focus-within) 세 가지 입력 방식 모두에서 뜬다.
 */
export function IconLinkButton({
  href,
  icon: Icon,
  label,
  visibleLabel,
  tone,
  variant = "pill",
  size = "sm",
  className,
}: IconLinkButtonProps) {
  const sizing = SIZE_STYLES[size];
  const isSolid = variant === "solid";
  const hasVisibleLabel = Boolean(visibleLabel);
  // visibleLabel이 있으면 항상 꽉 찬 색으로 강조한다 — 텍스트까지 붙는
  // 버튼이 은은한 톤이면 어중간해 보인다.
  const colorClass =
    isSolid || hasVisibleLabel
      ? cn("shadow-md", SOLID_TONE_STYLES[tone])
      : cn("bg-white/5", PILL_TONE_STYLES[tone]);

  return (
    <span className={cn("group/tip relative inline-flex shrink-0", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "focus-visible:outline-ztmy-magenta focus-visible:outline-2 focus-visible:outline-offset-2",
          hasVisibleLabel
            ? cn("rounded-md", sizing.pill)
            : cn(isSolid ? "rounded-md" : "rounded-full", sizing.square),
          colorClass,
        )}
      >
        <Icon className={sizing.icon} />
        {visibleLabel && <span>{visibleLabel}</span>}
      </a>

      {!hasVisibleLabel && (
        <span
          role="tooltip"
          className={cn(
            // 아이콘이 행 우측 끝에 있어 중앙 정렬(left-1/2)하면 뷰포트
            // 밖으로 넘어가 잘린다 — 아이콘 오른쪽 끝(right-0)에 맞춰 왼쪽
            // 으로만 펼친다.
            "pointer-events-none absolute right-0 bottom-full z-50 mb-1.5 translate-y-1 rounded-md bg-black/90 px-2.5 py-1.5 text-sm whitespace-nowrap text-white opacity-0 shadow-lg",
            "transition-[opacity,transform] duration-150",
            "group-active/tip:translate-y-0 group-active/tip:opacity-100",
            "group-focus-within/tip:translate-y-0 group-focus-within/tip:opacity-100",
            "tablet:group-hover/tip:translate-y-0 tablet:group-hover/tip:opacity-100",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
