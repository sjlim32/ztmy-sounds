/**
 * 하위 페이지 이름 — PC 헤더(SiteHeader, 로고 옆)와 모바일 상단 바
 * (MobileHeader, 가운데)가 같이 쓴다. 이 경로로 시작하는 주소에서 이 이름이 뜬다.
 * 출처(/credits)는 PC 헤더가 없어서 모바일 상단 바에만 쓰인다(headerless).
 */
export interface SitePage {
  href: string;
  label: string;
  /** true면 PC 헤더(SiteHeader)를 그리지 않는 페이지. */
  headerless?: boolean;
}

export const SITE_PAGES: readonly SitePage[] = [
  { href: "/guide", label: "응원 가이드" },
  { href: "/slam", label: "슬램 가이드" },
  { href: "/info", label: "공연 정보" },
  { href: "/zutopia", label: "ZUTOPIA" },
  { href: "/credits", label: "출처", headerless: true },
];

export function findSitePage(pathname: string): SitePage | undefined {
  return SITE_PAGES.find((page) => pathname.startsWith(page.href));
}
