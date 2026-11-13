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

/** 뒤로가기 설명(마우스를 올리면 뜨는 문구·화면 읽기용) — 가는 곳 기준. */
const PARENT_LABELS: Record<string, string> = {
  "/zutopia": "ZUTOPIA로 돌아가기",
  "/zutopia/lives": "공연 목록으로 돌아가기",
  "/guide": "응원 가이드 곡 목록으로 돌아가기",
  "/slam": "슬램 가이드 곡 목록으로 돌아가기",
};

/**
 * 한 단계 위 페이지 — 주소의 마지막 칸을 뗀 곳(곡 가이드 → 가이드 곡 목록,
 * 통계 → 즛토피아 첫 화면, 공연 상세 → 공연 목록). 최상위 페이지(/guide 등)는
 * null. 경로(usePathname)만 받으니 쿼리(?song= 등)는 따지지 않는다. PC 헤더(SiteHeader)와 모바일 상단 바
 * (MobileHeader)의 뒤로가기가 같이 쓴다 — 브라우저 기록이 아니라 이 구조를 따라서,
 * 바깥(검색·공유 링크)에서 바로 들어와도 사이트 안 상위 페이지로 간다.
 */
export function getParentPage(
  pathname: string,
): { href: string; label: string } | null {
  const segments = pathname.split("/").filter(Boolean);
  segments.pop();
  if (segments.length === 0) return null;
  const href = `/${segments.join("/")}`;
  return { href, label: PARENT_LABELS[href] ?? "이전 단계로 돌아가기" };
}
