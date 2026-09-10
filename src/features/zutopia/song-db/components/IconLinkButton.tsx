import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type Tone = "youtube" | "guide";

const TONE_STYLES: Record<Tone, string> = {
  youtube:
    "text-white/60 hover:bg-red-500/15 hover:text-red-400 focus-visible:bg-red-500/15 focus-visible:text-red-400",
  guide:
    "text-white/60 hover:bg-ztmy-purple/20 hover:text-ztmy-magenta focus-visible:bg-ztmy-purple/20 focus-visible:text-ztmy-magenta",
};

const SIZE_STYLES = {
  sm: { button: "h-6 w-6", icon: "h-4 w-4" },
  md: { button: "h-7 w-7", icon: "h-5 w-5" },
} satisfies Record<string, { button: string; icon: string }>;

interface IconLinkButtonProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: Tone;
  size?: keyof typeof SIZE_STYLES;
  // 감싸는 span에 붙는 클래스 — 반응형 노출 제어용(예: 모바일 전용 인스턴스에
  // tablet:hidden)으로만 쓴다.
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * 곡 행에 붙는 외부 링크 아이콘(유튜브/응원 가이드) 공용 버튼 — 그냥 아이콘이
 * 아니라 누를 수 있는 버튼임이 드러나도록 원형 배경 + 확대/색상 전환을 주고,
 * 브라우저 기본 title 대신 커스텀 툴팁을 붙인다. 툴팁은 AlbumListView 커버
 * 호버 라벨과 동일한 opacity/translate 트랜지션 패턴을 재사용하고,
 * group-active(터치) / tablet:group-hover(마우스) / group-focus-within(키보드)
 * 세 가지 입력 방식 모두에서 뜨도록 한다.
 */
export function IconLinkButton({
  href,
  icon: Icon,
  label,
  tone,
  size = "sm",
  className,
  onClick,
}: IconLinkButtonProps) {
  const sizing = SIZE_STYLES[size];

  return (
    <span className={cn("group/tip relative inline-flex shrink-0", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-white/5 transition-all duration-200",
          "hover:scale-110 active:scale-95",
          "focus-visible:outline-ztmy-magenta focus-visible:outline-2 focus-visible:outline-offset-2",
          sizing.button,
          TONE_STYLES[tone],
        )}
      >
        <Icon className={sizing.icon} />
      </a>

      <span
        role="tooltip"
        className={cn(
          // 아이콘이 행 우측 끝에 붙어 있어(justify-between으로 오른쪽 정렬),
          // 중앙 정렬(left-1/2)하면 뷰포트 오른쪽 경계를 넘어가 body의
          // overflow-hidden에 잘린다 — 아이콘 오른쪽 끝에 맞춰(right-0) 왼쪽
          // 으로만 펼쳐지게 한다.
          "pointer-events-none absolute right-0 bottom-full z-50 mb-1.5 translate-y-1 rounded-md bg-black/90 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg",
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
