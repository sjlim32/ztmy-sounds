import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, LINK_BUTTON_CLASS } from "@/components/button-styles";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import {
  INFO_TAB_LINKS,
  OFFICIAL_LINKS,
  TICKET_LINKS,
} from "@/features/info/links";

/** 공연 관련 링크 모음 — /info 페이지에 있는 공식 안내·티켓 신청, /info 탭 바로가기. */
export function ConcertLinks() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <LinkGroup title="참고 사이트">
        <ul className="flex flex-col gap-1.5">
          {OFFICIAL_LINKS.map((link) => (
            <li key={link.href}>
              <ExternalRow href={link.href}>{link.label}</ExternalRow>
            </li>
          ))}
        </ul>
      </LinkGroup>

      {TICKET_LINKS.length > 0 && (
        <LinkGroup title="티켓 신청">
          <ul className="flex flex-col gap-1.5">
            {TICKET_LINKS.map((link) => (
              <li key={link.href}>
                <ExternalRow href={link.href} disabled={link.disabled} accent>
                  {link.label}
                </ExternalRow>
              </li>
            ))}
          </ul>
        </LinkGroup>
      )}

      <LinkGroup title="공연 정보 더 보기">
        <ul className="flex flex-wrap gap-1.5">
          {INFO_TAB_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={LINK_BUTTON_CLASS}>
                {link.label}
                <ChevronLeftIcon className="h-3.5 w-3.5 rotate-180 opacity-60" />
              </Link>
            </li>
          ))}
        </ul>
      </LinkGroup>
    </div>
  );
}

/**
 * 외부 사이트로 나가는 한 줄 버튼 — 밑줄 글자 링크는 어두운 패널에서 눌러야
 * 하는 곳이 잘 안 보여서, 줄 전체를 누르는 면으로 만들고 오른쪽 끝에 외부
 * 링크 아이콘을 둔다. accent는 티켓 신청처럼 강조할 링크(분홍 면).
 */
function ExternalRow({
  href,
  disabled = false,
  accent = false,
  children,
}: {
  href: string;
  disabled?: boolean;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={disabled ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled || undefined}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 font-medium transition-colors",
        FOCUS_RING,
        accent
          ? "border-ztmy-pink/40 bg-ztmy-pink/10 hover:border-ztmy-pink/70 hover:bg-ztmy-pink/20 text-white"
          : "border-white/10 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10 hover:text-white",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <span className="min-w-0 break-keep">{children}</span>
      <ExternalLinkIcon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          accent ? "text-ztmy-pink" : "text-white/50",
        )}
      />
    </a>
  );
}

function LinkGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h4 className="text-xs font-bold text-white/60">{title}</h4>
      {children}
    </section>
  );
}
