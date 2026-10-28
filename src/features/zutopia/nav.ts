/**
 * 즛토피아 하위 구역(곡·앨범·공연) 사이를 오가는 헤더 내비게이션 항목
 * (ZutopiaHeaderNav). 헤더는 클라이언트 컴포넌트라 서버 데이터를 불러오는
 * registry.ts를 쓰지 못해서 여기 따로 둔다 — registry.ts의 ZUTOPIA_CATEGORIES에
 * 카테고리를 더하면 여기에도 같이 더한다.
 */
export interface ZutopiaNavItem {
  href: string;
  label: string;
  /** 이 경로들로 시작하는 주소에서 이 항목을 고른 상태로 보인다. */
  paths: readonly string[];
}

export const ZUTOPIA_NAV_ITEMS: readonly ZutopiaNavItem[] = [
  { href: "/zutopia/songs", label: "곡", paths: ["/zutopia/songs"] },
  { href: "/zutopia/albums", label: "앨범", paths: ["/zutopia/albums"] },
  { href: "/zutopia/lives", label: "공연", paths: ["/zutopia/lives"] },
];
