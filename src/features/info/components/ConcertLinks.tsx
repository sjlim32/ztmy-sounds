import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLink } from "@/components/SiteLink";
import {
  INFO_TAB_LINKS,
  OFFICIAL_LINKS,
  TICKET_APPS,
} from "@/features/info/links";

/** 공연 관련 링크 모음 — 공식 안내, 전자 티켓 앱, /info 탭 바로가기. */
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

      <LinkGroup title="전자 티켓 앱">
        <ul className="flex flex-col gap-1">
          {TICKET_APPS.map((app) => (
            <li
              key={app.name}
              className="flex flex-wrap items-center justify-between gap-x-3"
            >
              <span>{app.name}</span>
              <span className="flex items-center gap-2">
                <SiteLink href={app.android}>Google Play</SiteLink>
                <SiteLink href={app.ios}>App Store</SiteLink>
              </span>
            </li>
          ))}
        </ul>
      </LinkGroup>

      <LinkGroup title="공연 정보 더 보기">
        <ul className="flex flex-wrap gap-1.5">
          {INFO_TAB_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="hover:border-ztmy-magenta/60 block rounded-full border border-white/15 bg-black/40 px-3 py-1 text-white/80 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                {link.label}
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
