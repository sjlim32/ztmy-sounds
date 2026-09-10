"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";

interface BackLinkProps {
  // 지정하면 그 경로로 고정 이동(Link) — 예: zutopia는 브라우저 history가
  // 아니라 URL 뎁스를 한 단계 뗀 상위 경로로 가야 해서(ZutopiaTopNav 참고,
  // 외부 링크로 바로 들어왔거나 여러 단계를 건너뛴 경우 history back은
  // 엉뚱한 곳으로 감) 호출부가 그 경로를 계산해 넘긴다. 생략하면 기존
  // 동작 그대로 router.back()으로 브라우저 히스토리를 한 단계 되돌린다.
  href?: string;
  label?: string;
  // false면 아이콘만 보이고 label은 aria-label로만 쓰인다(모바일 헤더처럼
  // 좁은 아이콘 전용 자리에 쓸 때).
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

// HomeLink와 동일한 "떠 있는 필" 스타일을 기본값으로 채택해 사이트 전역
// 뒤로가기 버튼 모양을 통일한다. group을 여기서 직접 걸어서, 호출부가
// className을 따로 안 줘도 아이콘이 hover 시 항상 살짝 왼쪽으로 튄다.
const BASE_CLASS =
  "group inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:border-ztmy-magenta/60 hover:text-white";

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
    showLabel ? "px-3 py-1.5 text-sm" : "h-9 w-9",
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
