"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { NAV_BUTTON_CLASS } from "@/components/button-styles";

interface BackLinkProps {
  // 지정하면 그 경로로 고정 이동(Link) — 예: 가이드 상세의 뒤로가기는
  // 브라우저 history가 아니라 항상 곡 목록으로 가야 해서(GuideDetailToolbar)
  // 호출부가 그 경로를 넘긴다. 생략하면 router.back()으로 브라우저
  // 히스토리를 한 단계 되돌린다.
  href?: string;
  label?: string;
  // false면 아이콘만 보이고 label은 aria-label로만 쓰인다(모바일 헤더처럼
  // 좁은 아이콘 전용 자리에 쓸 때).
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

// HomeLink와 같은 이동 버튼 스타일(button-styles.ts NAV_BUTTON_CLASS)로 사이트
// 전역 뒤로가기 버튼 모양을 통일한다. group을 여기서 직접 걸어서, 호출부가
// className을 따로 안 줘도 아이콘이 hover 시 항상 살짝 왼쪽으로 튄다.
const BASE_CLASS = cn("group", NAV_BUTTON_CLASS);

/**
 * 사이트 어디서든 "뒤로가기"에 쓰는 공용 링크/버튼. HomeLink와 짝을 이룬다.
 */
export function BackLink({
  href,
  label = "뒤로가기",
  showLabel = true,
  className,
  iconClassName,
}: BackLinkProps) {
  const router = useRouter();
  const icon = (
    <ChevronLeftIcon
      className={cn(
        "h-4 w-4 transition-transform group-hover:-translate-x-0.5",
        iconClassName,
      )}
    />
  );
  const resolvedClassName = cn(
    BASE_CLASS,
    showLabel ? "px-3.5 py-2 text-sm" : "h-9 w-9",
    className,
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={resolvedClassName}>
        {icon}
        {showLabel && label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={label}
      className={resolvedClassName}
    >
      {icon}
      {showLabel && label}
    </button>
  );
}
