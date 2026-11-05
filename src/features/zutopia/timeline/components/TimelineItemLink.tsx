import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/button-styles";

/** 연혁 일정 하나 — 링크가 있으면 상세로 이동, 없으면 포커스만 받는 칸. */
export function TimelineItemLink({
  href,
  title,
  className,
  style,
  children,
}: {
  href: string | null;
  title: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const classes = cn("group rounded", FOCUS_RING, className);
  return href ? (
    <Link href={href} title={title} className={classes} style={style}>
      {children}
    </Link>
  ) : (
    <div tabIndex={0} title={title} className={classes} style={style}>
      {children}
    </div>
  );
}
