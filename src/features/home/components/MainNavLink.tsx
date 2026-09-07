import Link from "next/link";
import { memo, type ComponentType } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

type Accent = "purple" | "pink" | "magenta" | "sun";

interface MainNavLinkProps {
  href: string;
  eyebrow: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accent: Accent;
}

const badgeStyles = cva(
  "flex h-6 w-6 tablet:h-9 tablet:w-9 shrink-0 items-center justify-center rounded-full text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-110",
  {
    variants: {
      accent: {
        purple: "bg-ztmy-purple",
        pink: "bg-ztmy-pink",
        magenta: "bg-ztmy-magenta",
        sun: "bg-ztmy-sun",
      } satisfies Record<Accent, string>,
    },
  },
);

const labelStyles = cva(
  "tablet:text-2xl text-sm leading-tight font-bold tracking-tight text-white transition-colors duration-300",
  {
    variants: {
      accent: {
        purple: "group-hover:text-ztmy-purple",
        pink: "group-hover:text-ztmy-pink",
        magenta: "group-hover:text-ztmy-magenta",
        sun: "group-hover:text-ztmy-sun",
      } satisfies Record<Accent, string>,
    },
  },
);

const lineStyles = cva(
  "absolute inset-y-0 left-0 w-0 transition-all duration-500 ease-out group-hover:w-full",
  {
    variants: {
      accent: {
        purple: "bg-ztmy-purple",
        pink: "bg-ztmy-pink",
        magenta: "bg-ztmy-magenta",
        sun: "bg-ztmy-sun",
      } satisfies Record<Accent, string>,
    },
  },
);

/**
 * 홈 화면의 "응원 가이드"/"공연 정보" 메인 진입 버튼. 박스/테두리 없이
 * 타이포그래피 자체가 버튼이 되는 미니멀한 스타일 — 원형 아이콘 뱃지 +
 * 큰 라벨, 호버 시 왼쪽에서 오른쪽으로 확장되는 스캔라인 밑줄이 시그니처.
 * 버튼마다 고유 accent 색으로 정체성을 구분합니다. 모바일 전체폭 스택/
 * 데스크톱 우측 고정 nav 두 곳에서 공용으로 씁니다.
 *
 * props가 전부 정적(고정 문자열/아이콘 컴포넌트 참조)이라 memo로 감쌉니다 —
 * 홈 화면(page.tsx)이 카운트다운 때문에 초당 여러 번 리렌더되는데, 이 버튼
 * 8개(모바일 4 + 데스크톱 4)는 그때마다 다시 그릴 이유가 없습니다.
 */
function MainNavLinkComponent({
  href,
  eyebrow,
  label,
  icon: Icon,
  accent,
}: MainNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg bg-black/40 px-4 py-1 focus-visible:outline-none",
        "tablet:px-4 tablet:py-2 tablet:min-w-48 tablet:bg-transparent",
      )}
    >
      <span className={badgeStyles({ accent })}>
        <Icon className={cn("h-3 w-3", "tablet:h-4 w-4")} />
      </span>

      <span className="flex flex-col drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        <span
          className={cn(
            "font-mono text-[9px] font-medium tracking-[0.3em] text-white/50 uppercase",
            "tablet:text-xs",
          )}
        >
          {eyebrow}
        </span>
        <span className={labelStyles({ accent })}>{label}</span>
        <span className="relative mt-1 h-1 w-full overflow-hidden bg-white/15">
          <span className={lineStyles({ accent })} />
        </span>
      </span>
    </Link>
  );
}

export const MainNavLink = memo(MainNavLinkComponent);
