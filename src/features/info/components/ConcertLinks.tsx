import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLink } from "@/components/SiteLink";
import { LINK_BUTTON_CLASS } from "@/components/button-styles";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import {
  INFO_TAB_LINKS,
  OFFICIAL_LINKS,
  TICKET_LINKS,
} from "@/features/info/links";

/** 공연 관련 링크 모음 — /info 페이지에 있는 공식 안내·티켓 신청, /info 탭 바로가기. */
export function ConcertLinks() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <LinkGroup title="공식 안내">
        <ul className="flex flex-col gap-1">
          {OFFICIAL_LINKS.map((link) => (
            <li key={link.href}>
              <SiteLink href={link.href} className="w-fit">
                {link.label}
              </SiteLink>
            </li>
          ))}
        </ul>
      </LinkGroup>

      {TICKET_LINKS.length > 0 && (
        <LinkGroup title="티켓 신청">
          <ul className="flex flex-col gap-1">
            {TICKET_LINKS.map((link) => (
              <li key={link.href}>
                <SiteLink
                  href={link.href}
                  disabled={link.disabled}
                  className="w-fit"
                >
                  {link.label}
                </SiteLink>
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
