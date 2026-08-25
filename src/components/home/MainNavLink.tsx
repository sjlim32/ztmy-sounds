import Link from "next/link";
import type { ComponentType } from "react";
import clsx from "clsx";

type Accent = "purple" | "pink";

interface MainNavLinkProps {
  href: string;
  eyebrow: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accent: Accent;
}

const ACCENT_CLASSES: Record<
  Accent,
  { badge: string; text: string; line: string }
> = {
  purple: {
    badge: "bg-ztmy-purple",
    text: "group-hover:text-ztmy-purple",
    line: "bg-ztmy-purple",
  },
  pink: {
    badge: "bg-ztmy-magenta",
    text: "group-hover:text-ztmy-pink",
    line: "bg-ztmy-magenta",
  },
};

/**
 * 홈 화면의 "응원 가이드"/"공연 정보" 메인 진입 버튼. 박스/테두리 없이
 * 타이포그래피 자체가 버튼이 되는 미니멀한 스타일 — 원형 아이콘 뱃지 +
 * 큰 라벨, 호버 시 왼쪽에서 오른쪽으로 확장되는 스캔라인 밑줄이 시그니처.
 * 버튼마다 고유 accent 색으로 정체성을 구분합니다. 모바일 전체폭 스택/
 * 데스크톱 우측 고정 nav 두 곳에서 공용으로 씁니다.
 */
export function MainNavLink({
  href,
  eyebrow,
  label,
  icon: Icon,
  accent,
}: MainNavLinkProps) {
  const a = ACCENT_CLASSES[accent];

  return (
    <Link
      href={href}
      className="group tablet:min-w-48 tablet:bg-transparent flex items-center gap-3 rounded-lg bg-black/40 px-4 py-2 focus-visible:outline-none"
    >
      <span
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-110",
          a.badge,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="flex flex-col drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        <span className="font-mono text-[10px] font-medium tracking-[0.3em] text-white/50 uppercase">
          {eyebrow}
        </span>
        <span
          className={clsx(
            "tablet:text-2xl text-xl leading-tight font-bold tracking-tight text-white transition-colors duration-300",
            a.text,
          )}
        >
          {label}
        </span>
        <span className="relative mt-1 h-1 w-full overflow-hidden bg-white/15">
          <span
            className={clsx(
              "absolute inset-y-0 left-0 w-0 transition-all duration-500 ease-out group-hover:w-full",
              a.line,
            )}
          />
        </span>
      </span>
    </Link>
  );
}
