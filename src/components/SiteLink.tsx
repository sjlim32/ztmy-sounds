import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";

interface SiteLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  noIcon?: boolean;
  disabled?: boolean;
}

/**
 * 사이트 전역에서 쓰는 링크 스타일 — mdx 본문 링크와 코드에서 직접 쓰는
 * 링크(ZoomableImage의 출처 링크 등) 모두 이 컴포넌트로 통일합니다.
 * href가 http(s)로 시작하면 새 탭으로 열리고 외부 링크 아이콘이 자동으로 붙습니다.
 */
export function SiteLink({
  href,
  className,
  children,
  noIcon = false,
  disabled = false,
  ...props
}: SiteLinkProps) {
  const isExternal = href?.startsWith("http");

  return (
    <a
      href={disabled ? undefined : href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "text-indigo-100 underline underline-offset-2 transition-colors hover:text-white",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
      aria-disabled={disabled}
      {...props}
    >
      {children}
      {isExternal && !noIcon && (
        <ExternalLinkIcon className="ml-1 inline h-3 w-3 align-baseline" />
      )}
    </a>
  );
}
