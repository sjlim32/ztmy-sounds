import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type Tone = "youtube" | "guide" | "spotify" | "appleMusic";
type Variant = "pill" | "solid";

// variant="pill"(기본, 곡 행 옆 작은 버튼): 면 없이 아이콘에만 그 링크의
// 색을 남기고, 마우스를 올리면 옅은 면 — 사이트의 다른 테두리 없는 버튼
// (헤더 뒤로가기, 가이드 상세 버튼 줄)과 같은 결. 꽉 찬 색 면은 목록에서
// 줄마다 반복돼 너무 튄다.
const PILL_TONE_STYLES: Record<Tone, string> = {
  youtube:
    "text-red-500 hover:bg-white/10 hover:text-red-400 focus-visible:bg-white/10",
  guide:
    "text-ztmy-pink hover:bg-white/10 hover:text-white focus-visible:bg-white/10",
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

const SIZE_STYLES = {
  // 면이 없어서 아이콘 자체로 보여야 해 16px(누르는 영역 28px).
  sm: { square: "h-7 w-7", icon: "h-4 w-4" },
  md: { square: "h-7 w-7", icon: "h-4 w-4" },
  // md의 1.5배(세트리스트 스트리밍 버튼처럼 더 눈에 띄어야 할 때).
  lg: { square: "h-11 w-11", icon: "h-6 w-6" },
} satisfies Record<string, { square: string; icon: string }>;

interface IconLinkButtonProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** 접근성 레이블 + 툴팁 문구. */
  label: string;
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
 * 곡 행/공연 정보에 붙는 링크 아이콘(유튜브/응원 가이드/음원 사이트) 공용
 * 버튼. 그냥 아이콘이 아니라 누를 수 있는 버튼임이 드러나도록 마우스를 올리면
 * 옅은 면이 생기고(solid는 확대), 브라우저 기본 title 대신 커스텀 툴팁을 붙인다
 * (AlbumListView 커버 호버 라벨과 동일한 opacity/translate 트랜지션
 * 재사용). 터치(group-active) / 마우스(tablet:group-hover) /
 * 키보드(group-focus-within) 세 가지 입력 방식 모두에서 뜬다.
 */
export function IconLinkButton({
  href,
  icon: Icon,
  label,
  tone,
  variant = "pill",
  size = "sm",
  className,
}: IconLinkButtonProps) {
  const sizing = SIZE_STYLES[size];
  const isSolid = variant === "solid";
  const colorClass = isSolid
    ? cn("shadow-md hover:scale-110 active:scale-95", SOLID_TONE_STYLES[tone])
    : PILL_TONE_STYLES[tone];
  const linkClass = cn(
    "inline-flex items-center justify-center transition-all duration-200",
    "focus-visible:outline-ztmy-magenta focus-visible:outline-2 focus-visible:outline-offset-2",
    "rounded-md",
    sizing.square,
    colorClass,
  );
  const icon = <Icon className={sizing.icon} />;

  return (
    <span className={cn("group/tip relative inline-flex shrink-0", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={linkClass}
      >
        {icon}
      </a>

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
    </span>
  );
}
